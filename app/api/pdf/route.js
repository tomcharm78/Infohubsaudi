export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { investors, filters, reportType, mapProviders, mapOpportunities } = await req.json();
    const SAR = 3.75;
    const pA = (a) => parseFloat((a || "").replace(new RegExp("[\\$B,]","g"), "")) || 0;
    const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    let filtered = investors || [];
    if (filters?.region && filters.region !== "All") filtered = filtered.filter(i => i.region === filters.region);
    if (filters?.country && filters.country !== "All") filtered = filtered.filter(i => i.country === filters.country);
    if (filters?.domain && filters.domain !== "All") filtered = filtered.filter(i => i.domains?.includes(filters.domain));
    if (filters?.type && filters.type !== "All") filtered = filtered.filter(i => i.type === filters.type);

    const totalAUM = filtered.reduce((a, i) => a + pA(i.aum), 0);
    const gcc = filtered.filter(i => i.region === "GCC");
    const intl = filtered.filter(i => i.region === "Intl");
    const filterDesc = [
      filters?.region !== "All" ? `Region: ${filters.region}` : null,
      filters?.country !== "All" ? `Country: ${filters.country}` : null,
      filters?.domain !== "All" ? `Domain: ${filters.domain}` : null,
    ].filter(Boolean).join(" | ") || "All Investors";

    // Build PDF-ready HTML
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page{size:A4;margin:20mm 15mm}
body{font-family:Arial,sans-serif;color:#1A2E23;font-size:11px;line-height:1.5}
.header{background:#1B7A4A;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:20px}
.header h1{font-size:20px;margin:0 0 4px 0}
.header p{font-size:10px;color:#D4C68E;margin:0}
.gold-bar{height:3px;background:linear-gradient(90deg,#B5A167,#D4C68E,#B5A167);margin-bottom:16px}
.kpi-row{display:flex;gap:12px;margin-bottom:16px}
.kpi{background:#E8F5EE;border:1px solid #B8DCC8;border-radius:8px;padding:12px 16px;flex:1;text-align:center}
.kpi b{display:block;font-size:18px;color:#1B7A4A}
.kpi .sar{font-size:9px;color:#B5A167;font-weight:bold}
.kpi span{font-size:8px;color:#6B8574;text-transform:uppercase}
h2{color:#1B7A4A;font-size:14px;border-bottom:2px solid #B5A167;padding-bottom:6px;margin-top:24px}
h3{color:#3D5A47;font-size:12px;margin-top:16px}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10px}
th{background:#1B7A4A;color:#fff;padding:6px 8px;text-align:left;font-size:9px}
td{padding:5px 8px;border-bottom:1px solid #D6E4DB}
tr:nth-child(even){background:#F4F6F5}
.badge{display:inline-block;background:#E8F5EE;color:#1B7A4A;padding:1px 6px;border-radius:3px;font-size:8px;font-weight:bold}
.footer{margin-top:30px;border-top:2px solid #B5A167;padding-top:8px;font-size:8px;color:#8FA898;text-align:center}
.page-break{page-break-before:always}
</style></head><body>`;

    // Header
    html += `<div class="header"><h1>Healthcare Investor Intelligence Report</h1><p>Generated: ${now} | Filter: ${filterDesc} | CONFIDENTIAL</p></div>`;
    html += `<div class="gold-bar"></div>`;

    // KPIs
    html += `<div class="kpi-row">`;
    html += `<div class="kpi"><b>${filtered.length}</b><span>Investors</span></div>`;
    html += `<div class="kpi"><b>$${totalAUM.toFixed(1)}B</b><div class="sar">${(totalAUM * SAR).toFixed(1)}B SAR</div><span>Total AUM</span></div>`;
    html += `<div class="kpi"><b>${gcc.length}</b><span>GCC</span></div>`;
    html += `<div class="kpi"><b>${intl.length}</b><span>International</span></div>`;
    html += `<div class="kpi"><b>${filtered.reduce((a, i) => a + (i.cSuite?.length || 0), 0)}</b><span>Contacts</span></div>`;
    html += `</div>`;

    // By Country
    const byCo = {};
    filtered.forEach(i => { byCo[i.country] = (byCo[i.country] || 0) + 1; });
    html += `<h2>Investors by Country</h2><table><tr><th>Country</th><th>Count</th><th>% of Total</th></tr>`;
    Object.entries(byCo).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
      html += `<tr><td>${c}</td><td>${n}</td><td>${Math.round(n / filtered.length * 100)}%</td></tr>`;
    });
    html += `</table>`;

    // By Domain
    const byDom = {};
    filtered.forEach(i => (i.domains || []).forEach(d => { byDom[d] = (byDom[d] || 0) + 1; }));
    html += `<h2>Healthcare Domains Coverage</h2><table><tr><th>Domain</th><th>Investors</th></tr>`;
    Object.entries(byDom).sort((a, b) => b[1] - a[1]).forEach(([d, n]) => { html += `<tr><td>${d}</td><td>${n}</td></tr>`; });
    html += `</table>`;

    // Top by AUM
    const sorted = [...filtered].sort((a, b) => pA(b.aum) - pA(a.aum));
    html += `<h2>Top Investors by AUM</h2><table><tr><th>#</th><th>Company</th><th>Country</th><th>Type</th><th>AUM (USD)</th><th>AUM (SAR)</th></tr>`;
    sorted.slice(0, 20).forEach((inv, i) => {
      const a = pA(inv.aum);
      html += `<tr><td>${i + 1}</td><td><b>${inv.company}</b></td><td>${inv.country}</td><td>${inv.type}</td><td>$${a.toFixed(1)}B</td><td>${(a * SAR).toFixed(1)}B</td></tr>`;
    });
    html += `</table>`;

    // Detailed profiles
    html += `<div class="page-break"></div><h2>Investor Profiles (${filtered.length})</h2>`;
    filtered.forEach((inv, idx) => {
      if (idx > 0 && idx % 4 === 0) html += `<div class="page-break"></div>`;
      const a = pA(inv.aum);
      html += `<h3>${idx + 1}. ${inv.company}</h3>`;
      html += `<p><b>Type:</b> ${inv.type} | <b>AUM:</b> ${inv.aum || "N/A"} (${(a * SAR).toFixed(1)}B SAR) | <b>Country:</b> ${inv.country} | <b>Region:</b> ${inv.region}</p>`;
      if (inv.website) html += `<p><b>Website:</b> ${inv.website}</p>`;
      if (inv.description) html += `<p>${inv.description}</p>`;
      if (inv.domains?.length) html += `<p><b>Domains:</b> ${inv.domains.map(d => `<span class="badge">${d}</span>`).join(" ")}</p>`;
      if (inv.cSuite?.length) {
        html += `<table><tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th></tr>`;
        inv.cSuite.forEach(c => { html += `<tr><td>${c.name || ""}</td><td>${c.title || ""}</td><td>${c.email || ""}</td><td>${c.phone || ""}</td></tr>`; });
        html += `</table>`;
      }
      if (inv.portfolio?.length) {
        html += `<p><b>Portfolio:</b> ${inv.portfolio.map(p => `${p.name}${p.amount ? " (" + p.amount + ")" : ""}`).join(", ")}</p>`;
      }
    });

    // Map data section (if provided)
    if (mapProviders?.length || mapOpportunities?.length) {
      html += `<div class="page-break"></div><h2>Saudi Investment Map Data</h2>`;
      if (mapProviders?.length) {
        html += `<h3>Healthcare Providers (${mapProviders.length})</h3>`;
        html += `<table><tr><th>#</th><th>Name</th><th>City</th><th>Category</th><th>Beds</th><th>Operator</th></tr>`;
        mapProviders.slice(0, 50).forEach((p, i) => {
          html += `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.city}</td><td>${p.category || ""}</td><td>${p.beds || ""}</td><td>${p.operator || ""}</td></tr>`;
        });
        html += `</table>`;
        if (mapProviders.length > 50) html += `<p style="color:#8FA898;font-size:9px">... and ${mapProviders.length - 50} more providers</p>`;
      }
      if (mapOpportunities?.length) {
        html += `<h3>Opportunity Lands (${mapOpportunities.length})</h3>`;
        html += `<table><tr><th>#</th><th>Name</th><th>City</th><th>Investment</th><th>Status</th></tr>`;
        mapOpportunities.forEach((o, i) => {
          html += `<tr><td>${i + 1}</td><td>${o.name}</td><td>${o.city}</td><td>${o.investment || ""}</td><td>${o.status || ""}</td></tr>`;
        });
        html += `</table>`;
      }
    }

    html += `<div class="footer">Healthcare Investor Intelligence Platform -- Confidential Report -- ${now}<br/>Generated for Gold subscribers only</div>`;
    html += `</body></html>`;

    // Return as downloadable HTML (renders as PDF when opened/printed)
    // For true PDF: would need puppeteer or similar -- but HTML with print CSS works perfectly
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="Healthcare_Report_${new Date().toISOString().split("T")[0]}.html"`,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
