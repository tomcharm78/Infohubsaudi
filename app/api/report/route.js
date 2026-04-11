export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { investors, filters, reportType } = await req.json();
    // reportType: "general" | "country" | "domain" | "custom"
    
    const USD_TO_SAR = 3.75;
    const parseAUM = (a) => parseFloat((a||"").replace(new RegExp("[\\$B,]","g"),"")) || 0;

    // Apply filters
    let filtered = investors;
    if (filters?.region && filters.region !== "All") filtered = filtered.filter(i => i.region === filters.region);
    if (filters?.country && filters.country !== "All") filtered = filtered.filter(i => i.country === filters.country);
    if (filters?.domain && filters.domain !== "All") filtered = filtered.filter(i => i.domains?.includes(filters.domain));
    if (filters?.type && filters.type !== "All") filtered = filtered.filter(i => i.type === filters.type);

    const totalAUM = filtered.reduce((a, i) => a + parseAUM(i.aum), 0);
    const totalSAR = totalAUM * USD_TO_SAR;
    const gcc = filtered.filter(i => i.region === "GCC");
    const intl = filtered.filter(i => i.region === "Intl");

    // Build HTML for docx conversion
    const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const filterDesc = [
      filters?.region !== "All" ? `Region: ${filters.region}` : null,
      filters?.country !== "All" ? `Country: ${filters.country}` : null,
      filters?.domain !== "All" ? `Domain: ${filters.domain}` : null,
      filters?.type !== "All" ? `Type: ${filters.type}` : null,
    ].filter(Boolean).join(" | ") || "All Investors";

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#1A2E23;margin:40px}
h1{color:#1B7A4A;font-size:22px;border-bottom:3px solid #B5A167;padding-bottom:10px}
h2{color:#1B7A4A;font-size:16px;margin-top:30px;border-bottom:1px solid #D6E4DB;padding-bottom:6px}
h3{color:#3D5A47;font-size:13px;margin-top:20px}
table{border-collapse:collapse;width:100%;margin:10px 0}
th{background:#1B7A4A;color:#fff;padding:8px 12px;text-align:left;font-size:11px}
td{padding:6px 12px;border-bottom:1px solid #D6E4DB;font-size:11px}
tr:nth-child(even){background:#F4F6F5}
.kpi{display:inline-block;background:#E8F5EE;border:1px solid #B8DCC8;border-radius:8px;padding:12px 20px;margin:5px;text-align:center}
.kpi b{display:block;font-size:18px;color:#1B7A4A}
.kpi span{font-size:10px;color:#6B8574;text-transform:uppercase}
.gold{color:#B5A167;font-size:12px}
.badge{display:inline-block;background:#E8F5EE;color:#1B7A4A;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;margin:1px}
.footer{margin-top:40px;border-top:2px solid #B5A167;padding-top:10px;font-size:10px;color:#8FA898}
</style></head><body>`;

    // Header
    html += `<h1>Healthcare Investor Intelligence Report</h1>`;
    html += `<p style="color:#6B8574">Generated: ${now} | Filter: ${filterDesc}</p>`;

    // KPIs
    html += `<div style="margin:20px 0">`;
    html += `<div class="kpi"><b>${filtered.length}</b><span>Investors</span></div>`;
    html += `<div class="kpi"><b>$${totalAUM.toFixed(1)}B</b><span>Total AUM (USD)</span><br><span class="gold">${totalSAR.toFixed(1)}B SAR</span></div>`;
    html += `<div class="kpi"><b>${gcc.length}</b><span>GCC</span></div>`;
    html += `<div class="kpi"><b>${intl.length}</b><span>International</span></div>`;
    html += `<div class="kpi"><b>${filtered.reduce((a,i)=>a+(i.cSuite?.length||0),0)}</b><span>Contacts</span></div>`;
    html += `</div>`;

    // By country
    const byCo = {};
    filtered.forEach(i => { byCo[i.country] = (byCo[i.country] || 0) + 1; });
    html += `<h2>Investors by Country</h2><table><tr><th>Country</th><th>Count</th></tr>`;
    Object.entries(byCo).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => { html += `<tr><td>${c}</td><td>${n}</td></tr>`; });
    html += `</table>`;

    // By domain
    const byDom = {};
    filtered.forEach(i => (i.domains||[]).forEach(d => { byDom[d] = (byDom[d]||0) + 1; }));
    html += `<h2>Healthcare Domains Coverage</h2><table><tr><th>Domain</th><th>Investors</th></tr>`;
    Object.entries(byDom).sort((a,b) => b[1]-a[1]).forEach(([d,n]) => { html += `<tr><td>${d}</td><td>${n}</td></tr>`; });
    html += `</table>`;

    // Top by AUM
    const sorted = [...filtered].sort((a,b) => parseAUM(b.aum) - parseAUM(a.aum));
    html += `<h2>Top Investors by AUM</h2><table><tr><th>Rank</th><th>Company</th><th>Country</th><th>Type</th><th>AUM (USD)</th><th>AUM (SAR)</th></tr>`;
    sorted.slice(0, 15).forEach((inv, i) => {
      const a = parseAUM(inv.aum);
      html += `<tr><td>${i+1}</td><td><b>${inv.company}</b></td><td>${inv.country}</td><td>${inv.type}</td><td>$${a.toFixed(1)}B</td><td>${(a*USD_TO_SAR).toFixed(1)}B</td></tr>`;
    });
    html += `</table>`;

    // Detailed profiles
    html += `<h2>Investor Profiles</h2>`;
    filtered.forEach(inv => {
      const a = parseAUM(inv.aum);
      html += `<h3>${inv.company} -- ${inv.country}</h3>`;
      html += `<p><b>Type:</b> ${inv.type} | <b>AUM:</b> ${inv.aum || "N/A"} (${(a*USD_TO_SAR).toFixed(1)}B SAR) | <b>Region:</b> ${inv.region}</p>`;
      if (inv.website) html += `<p><b>Website:</b> ${inv.website}</p>`;
      if (inv.description) html += `<p>${inv.description}</p>`;
      if (inv.domains?.length) html += `<p><b>Domains:</b> ${inv.domains.map(d=>`<span class="badge">${d}</span>`).join(" ")}</p>`;

      if (inv.cSuite?.length) {
        html += `<table><tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th></tr>`;
        inv.cSuite.forEach(c => { html += `<tr><td>${c.name||""}</td><td>${c.title||""}</td><td>${c.email||""}</td><td>${c.phone||""}</td></tr>`; });
        html += `</table>`;
      }
      if (inv.portfolio?.length) {
        html += `<p><b>Portfolio:</b> ${inv.portfolio.map(p=>`${p.name}${p.amount?" ("+p.amount+")":""}`).join(", ")}</p>`;
      }
      html += `<hr style="border:none;border-top:1px solid #E8EFE9;margin:15px 0">`;
    });

    html += `<div class="footer">Healthcare Investor Intelligence Platform -- Confidential Report -- ${now}</div>`;
    html += `</body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": `attachment; filename="Healthcare_Investors_Report_${new Date().toISOString().split("T")[0]}.doc"`,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
