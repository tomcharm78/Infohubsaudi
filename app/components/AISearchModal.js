"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Search, Linkedin, Globe } from "lucide-react";
import { DOMAINS, COUNTRIES, GCC_SET } from "../lib/data";

function mkL(n) { return (n||"??").split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase(); }

export default function AISearchModal({ mode, investors, setInvestors, setLogs, onClose, setToast, checkDuplicates }) {
  const [status, setStatus] = useState("config"); // config|running|done
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [results, setResults] = useState({ updated: 0, discovered: 0 });
  const logRef = useRef(null);
  const isSingle = mode.mode === "single";

  // Configurable search params
  const [searchTargets, setSearchTargets] = useState({
    ceo_linkedin: true,
    cSuite: true,
    aum: true,
    portfolio: true,
    recent_deals: true,
    news: true,
    discover_new: !isSingle,
  });
  const [filterCountries, setFilterCountries] = useState([]);
  const [filterDomains, setFilterDomains] = useState([]);
  const [customQuery, setCustomQuery] = useState("");

  const addLog = (t, type = "") => {
    setLogLines(p => [...p, { text: t, type }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  };

  const buildPrompt = (inv) => {
    const parts = [`Search for the LATEST information about "${inv.company}" (${inv.country}) as a healthcare investor.`];
    parts.push("Search these sources: LinkedIn.com company pages and executive profiles, Crunchbase, PitchBook, Bloomberg, company official website, financial news.");

    if (searchTargets.ceo_linkedin) parts.push(`IMPORTANT: Search LinkedIn.com specifically for the CEO and leadership team of "${inv.company}". Find their LinkedIn profile URLs.`);
    if (searchTargets.cSuite) parts.push("Find ALL current C-suite executives: CEO, CFO, CIO, Managing Partners, Directors. Include full names, exact titles, email addresses if publicly listed, direct phone numbers if available, LinkedIn profile URLs.");
    if (searchTargets.aum) parts.push("Find the current Assets Under Management (AUM) or fund size. Report in USD.");
    if (searchTargets.portfolio) {
      let pText = "Find their investment portfolio and recent deals in healthcare";
      if (filterCountries.length) pText += ` specifically in ${filterCountries.join(", ")}`;
      parts.push(pText + ".");
    }
    if (searchTargets.recent_deals) parts.push("Find any deals, acquisitions, or fund launches from 2024-2026.");
    if (searchTargets.news) parts.push("Find the latest news or announcements about this company.");
    if (customQuery) parts.push(`ADDITIONAL REQUEST: ${customQuery}`);

    parts.push(`Return ONLY valid JSON, no markdown, no backticks:
{"company":"${inv.company}","aum":"","website":"","description":"","cSuite":[{"name":"","title":"","email":"","phone":"","linkedin":""}],"recentDeals":[{"name":"","sector":"","year":2025,"amount":""}],"domains":[],"news":""}
Fill in what you find. Empty strings for unfound data.`);

    return parts.join("\n");
  };

  const buildDiscoverPrompt = () => {
    const names = investors.slice(0, 25).map(i => i.company).join(", ");
    let prompt = `Search LinkedIn, Crunchbase, PitchBook, GHE (Global Health Exhibition), Arab Health, and financial news for healthcare investors ACTIVELY investing in the GCC region that are NOT in this list: ${names}.`;

    if (filterDomains.length) prompt += `\nFocus on these domains: ${filterDomains.join(", ")}.`;
    else prompt += `\nSearch across ALL domains: ${DOMAINS.join(", ")}.`;

    if (filterCountries.length) prompt += `\nFocus on investors targeting: ${filterCountries.join(", ")}.`;

    prompt += `\nInclude GCC-based funds, family offices, international PE/VC with active GCC portfolios, recently launched healthcare funds.
IMPORTANT: Verify each investor via LinkedIn company page or official website.`;

    if (customQuery) prompt += `\nADDITIONAL: ${customQuery}`;

    prompt += `\nReturn ONLY valid JSON array, no markdown:
[{"company":"","country":"","city":"","website":"","type":"","aum":"","domains":[],"description":"","cSuite":[{"name":"","title":"","email":"","phone":"","linkedin":""}],"recentDeals":[],"news":""}]
Up to 8 real firms only.`;
    return prompt;
  };

  const callAPI = async (prompt) => {
    const res = await fetch("/api/ai-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "custom", prompt }),
    });
    return res.json();
  };

  const merge = (inv, data) => {
    let ch = [];
    if (data.aum && data.aum !== inv.aum) { inv.aum = data.aum; ch.push("AUM"); }
    if (data.website && data.website !== inv.website) { inv.website = data.website; ch.push("website"); }
    if (data.description && data.description.length > (inv.description || "").length) { inv.description = data.description; ch.push("desc"); }
    if (data.domains?.length) { const m = [...new Set([...inv.domains, ...data.domains.filter(d => DOMAINS.includes(d))])]; if (m.length > inv.domains.length) { inv.domains = m; ch.push("domains"); } }
    if (data.cSuite?.length) {
      data.cSuite.forEach(nc => {
        if (!nc.name) return;
        const ex = inv.cSuite.find(c => c.name.toLowerCase() === nc.name.toLowerCase());
        if (ex) {
          if (nc.email && !ex.email) { ex.email = nc.email; ch.push("email:" + nc.name); }
          if (nc.phone && !ex.phone) { ex.phone = nc.phone; ch.push("phone:" + nc.name); }
          if (nc.linkedin) ex.linkedin = nc.linkedin;
          if (nc.title) ex.title = nc.title;
        } else {
          inv.cSuite.push({ name: nc.name, title: nc.title || "", email: nc.email || "", phone: nc.phone || "", linkedin: nc.linkedin || "" });
          ch.push("+" + nc.name);
        }
      });
    }
    if (data.recentDeals?.length) {
      data.recentDeals.forEach(rd => {
        if (!rd.name) return;
        if (!inv.portfolio.find(p => p.name.toLowerCase() === rd.name.toLowerCase())) { inv.portfolio.push(rd); ch.push("deal:" + rd.name); }
      });
    }
    if (ch.length) { inv.lastUpdated = new Date().toISOString(); inv.logo = mkL(inv.company); }
    return ch;
  };

  const run = async () => {
    setStatus("running");
    const targets = isSingle ? [mode.investor] : [...investors];
    let upd = 0, disc = 0;

    for (let i = 0; i < targets.length; i++) {
      const inv = targets[i];
      setProgress(Math.round(((i + .5) / targets.length) * (searchTargets.discover_new ? 80 : 100)));
      addLog(`🔍 ${inv.company}...`);
      try {
        const prompt = buildPrompt(inv);
        const r = await callAPI(prompt);
        if (r.success && r.data) {
          const ch = merge(inv, r.data);
          if (ch.length) { addLog(`✅ ${inv.company}: ${ch.join(", ")}`, "hit"); upd++; }
          else addLog(`⏭ ${inv.company}: no new data`);
        } else addLog(`⚠ ${inv.company}: ${r.error || "no data"}`, "err");
      } catch (e) { addLog(`❌ ${inv.company}: ${e.message}`, "err"); }
    }

    if (searchTargets.discover_new) {
      setProgress(85);
      addLog("🌐 Searching LinkedIn, Crunchbase, PitchBook for new investors...");
      try {
        const prompt = buildDiscoverPrompt();
        const r = await callAPI(prompt);
        if (r.success && Array.isArray(r.data)) {
          const now = new Date().toISOString();
          r.data.forEach((ni, idx) => {
            if (!ni.company) return;
            if (investors.find(inv => inv.company.toLowerCase() === ni.company.toLowerCase())) return;
            const cn = ni.country || "Unknown";
            investors.push({
              id: Date.now() + idx + 500, company: ni.company, country: cn, city: ni.city || "",
              website: ni.website || "", type: ni.type || "Unknown", aum: ni.aum || "N/A",
              region: GCC_SET.has(cn) ? "GCC" : "Intl",
              domains: (ni.domains || []).filter(d => DOMAINS.includes(d)), stages: [],
              description: ni.description || "", portfolio: ni.recentDeals || [],
              cSuite: (ni.cSuite || []).map(c => ({ ...c, linkedin: c.linkedin || "" })),
              totalInvestments: 0, activeDeals: 0, status: "Active", source: "AI Discovery",
              logo: mkL(ni.company), createdAt: now, lastUpdated: now
            });
            disc++;
            addLog(`🆕 ${ni.company} (${cn})`, "new");
          });
        }
      } catch (e) { addLog(`⚠ Discovery: ${e.message}`, "err"); }
    }

    setInvestors([...investors]);
    setLogs(p => [...p, { date: new Date().toISOString(), updated: upd, discovered: disc }]);
    setProgress(100);
    setResults({ updated: upd, discovered: disc });
    setStatus("done");
    setTimeout(() => checkDuplicates(), 500);
  };

  const toggleCountry = c => setFilterCountries(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleDomain = d => setFilterDomains(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const btnSel = (active) => ({ padding: "5px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", border: active ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: active ? "#E8F5EE" : "#fff", color: active ? "#1B7A4A" : "#6B8574" });
  const chk = (on, label, key) => <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#3D5A47" }}>
    <input type="checkbox" checked={on} onChange={() => setSearchTargets(p => ({ ...p, [key]: !p[key] }))} style={{ width: 16, height: 16, accentColor: "#1B7A4A" }} />{label}</label>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget && status !== "running") onClose(); }}>
      <div style={{ background: "#fff", border: "1px solid #D6E4DB", borderRadius: 16, width: "95%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#B5A167,#D4C68E)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={20} color="#fff" /></div>
          <div><h3 style={{ color: "#1A2E23", fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{isSingle ? `AI Search: ${mode.investor.company}` : "AI-Powered Search & Update"}</h3>
            <p style={{ color: "#B5A167", fontSize: 11, marginTop: 2 }}>Configure what to search for</p></div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#8FA898", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {status === "config" && <div>
<div style={{ padding: 16, borderRadius: 10, background: "#FAFBFA", border: "1px solid #D6E4DB", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>What to search for</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {chk(searchTargets.ceo_linkedin, "CEO / Leadership on LinkedIn", "ceo_linkedin")}
              {chk(searchTargets.cSuite, "C-Suite contacts & details", "cSuite")}
              {chk(searchTargets.aum, "AUM / Fund size", "aum")}
              {chk(searchTargets.portfolio, "Investment portfolio", "portfolio")}
              {chk(searchTargets.recent_deals, "Recent deals (2024-2026)", "recent_deals")}
              {chk(searchTargets.news, "Latest news & announcements", "news")}
              {chk(searchTargets.discover_new, "🆕 Discover new investors", "discover_new")}
            </div>
          </div>
<div style={{ padding: 16, borderRadius: 10, background: "#FAFBFA", border: "1px solid #D6E4DB", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Focus on countries (optional -- leave empty for all)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman"].map(c =>
                <button key={c} onClick={() => toggleCountry(c)} style={btnSel(filterCountries.includes(c))}>{c}</button>
              )}
            </div>
          </div>
<div style={{ padding: 16, borderRadius: 10, background: "#FAFBFA", border: "1px solid #D6E4DB", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Focus on domains (optional)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {DOMAINS.map(d => <button key={d} onClick={() => toggleDomain(d)} style={btnSel(filterDomains.includes(d))}>{d}</button>)}
            </div>
          </div>
<div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Custom search instruction (optional)</div>
            <textarea value={customQuery} onChange={e => setCustomQuery(e.target.value)}
              placeholder='e.g. "Find the CEO of Gulf Capital LinkedIn profile" or "Search for investment size in Saudi Arabia only"'
              style={{ fontSize: 12, minHeight: 60 }} />
          </div>

          <button onClick={run} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Sparkles size={17} /> {isSingle ? "Search & Update" : `Search ${investors.length} Investors`}
          </button>
          <button onClick={onClose} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 12 }}>Cancel</button>
        </div>}

        {(status === "running" || status === "done") && <div style={{ padding: 18, borderRadius: 12, background: "#FAFBFA", border: "1px solid #D6E4DB" }}>
          <div style={{ fontSize: 12, color: status === "done" ? "#1B7A4A" : "#B5A167", fontWeight: 700, marginBottom: 8 }}>{status === "done" ? "✅ Complete!" : "Searching LinkedIn, Crunchbase, PitchBook..."}</div>
          <div style={{ height: 6, borderRadius: 3, background: "#E8EFE9", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#1B7A4A,#2D9E64)", transition: "width .3s", width: `${progress}%` }} /></div>
          <div ref={logRef} style={{ marginTop: 10, maxHeight: 200, overflowY: "auto", fontSize: 11, lineHeight: 2 }}>
            {logLines.map((l, i) => <div key={i} style={{ color: l.type === "hit" ? "#1B7A4A" : l.type === "new" ? "#6366f1" : l.type === "err" ? "#DC3545" : "#6B8574" }}>{l.text}</div>)}
          </div>
          {status === "done" && <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "#E8F5EE", border: "1px solid #B8DCC8" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B7A4A", marginBottom: 4 }}>Search Complete</div>
            <div style={{ fontSize: 12, color: "#3D5A47" }}>{results.updated} updated · {results.discovered} new discovered</div>
            <button onClick={onClose} style={{ marginTop: 10, width: "100%", padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Done</button>
          </div>}
        </div>}
      </div>
    </div>
  );
}
