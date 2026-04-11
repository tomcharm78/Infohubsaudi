export const runtime = "nodejs";
export const maxDuration = 30;

// In-memory cache
let newsCache = { data: null, timestamp: 0 };
const NEWS_TTL = 3 * 60 * 60 * 1000; // 3 hours

// Complete Tadawul Healthcare Stocks (13 companies)
const HEALTHCARE_STOCKS = [
  { ticker: "4013", symbol: "4013.SR", name: "Dr. Sulaiman Al Habib", nameAr: "مجموعة الحبيب", sector: "Hospitals" },
  { ticker: "4004", symbol: "4004.SR", name: "Dallah Healthcare", nameAr: "دله الصحية", sector: "Hospitals" },
  { ticker: "4002", symbol: "4002.SR", name: "Mouwasat Medical", nameAr: "المواساة الطبية", sector: "Hospitals" },
  { ticker: "4007", symbol: "4007.SR", name: "Al Hammadi", nameAr: "الحمادي", sector: "Hospitals" },
  { ticker: "4009", symbol: "4009.SR", name: "Middle East Healthcare", nameAr: "السعودي الألماني", sector: "Hospitals" },
  { ticker: "4005", symbol: "4005.SR", name: "National Medical Care", nameAr: "رعاية", sector: "Hospitals" },
  { ticker: "4016", symbol: "4016.SR", name: "Almoosa Health", nameAr: "الموسى الصحية", sector: "Hospitals" },
  { ticker: "4164", symbol: "4164.SR", name: "Nahdi Medical", nameAr: "النهدي الطبية", sector: "Pharmacy Chain" },
  { ticker: "2070", symbol: "2070.SR", name: "SPIMACO", nameAr: "سبيماكو", sector: "Pharma Manufacturing" },
  { ticker: "2230", symbol: "2230.SR", name: "Saudi Chemical", nameAr: "الكيميائية السعودية", sector: "Medical Supplies" },
  { ticker: "4163", symbol: "4163.SR", name: "TIBBIYAH", nameAr: "طبية القابضة", sector: "Healthcare Holding" },
  { ticker: "4014", symbol: "4014.SR", name: "AYYAN Investment", nameAr: "أيان للاستثمار", sector: "Healthcare Investment" },
  { ticker: "9543", symbol: "9543.SR", name: "NUPCO", nameAr: "نوبكو", sector: "Medical Procurement" },
  // Health Insurance
  { ticker: "8210", symbol: "8210.SR", name: "Bupa Arabia", nameAr: "بوبا العربية", sector: "Health Insurance" },
  { ticker: "8010", symbol: "8010.SR", name: "Tawuniya", nameAr: "التعاونية", sector: "Health Insurance" },
  { ticker: "8230", symbol: "8230.SR", name: "Al Rajhi Takaful", nameAr: "الراجحي للتأمين", sector: "Health Insurance" },
  { ticker: "8030", symbol: "8030.SR", name: "MedGulf", nameAr: "ميدغلف", sector: "Health Insurance" },
  { ticker: "8060", symbol: "8060.SR", name: "Walaa", nameAr: "ولاء", sector: "Health Insurance" },
  { ticker: "8100", symbol: "8100.SR", name: "SAICO", nameAr: "سايكو", sector: "Health Insurance" },
  { ticker: "8250", symbol: "8250.SR", name: "GIG Saudi", nameAr: "الخليج للتأمين", sector: "Health Insurance" },
];

// RSS Feed sources (free, no API key needed)
const RSS_SOURCES = [
  { name: "Arab News Health", url: "https://www.arabnews.com/cat/8/rss.xml", category: "General" },
  { name: "Saudi Gazette", url: "https://saudigazette.com.sa/topic/health/rss", category: "General" },
  { name: "Gulf Business Health", url: "https://gulfbusiness.com/category/sectors/healthcare/feed/", category: "Business" },
];

// Fetch and parse RSS (simple XML extraction without external deps)
async function fetchRSS(url, sourceName, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "HealthcareInvestorPlatform/1.0" }
    });
    clearTimeout(timer);

    if (!res.ok) return [];
    const xml = await res.text();

    // Simple XML item extraction
    const items = [];
    const itemMatches = xml.match(new RegExp("<item>([\\s\\S]*?)<\\/item>","gi")) || [];

    for (const itemXml of itemMatches.slice(0, 5)) {
      const title = (itemXml.match(new RegExp("<title[^>]*>([\\s\\S]*?)</title>","i")) || [])[1]?.replace(new RegExp("<!\\[CDATA\\[|\\]\\]>","g"), "").trim() || "";
      const desc = (itemXml.match(new RegExp("<description[^>]*>([\\s\\S]*?)</description>","i")) || [])[1]?.replace(new RegExp("<!\\[CDATA\\[|\\]\\]>","g"), "").replace(new RegExp("<[^>]+>","g"), "").trim() || "";
      const link = (itemXml.match(new RegExp("<link[^>]*>([\\s\\S]*?)</link>","i")) || [])[1]?.replace(new RegExp("<!\\[CDATA\\[|\\]\\]>","g"), "").trim() || "";
      const pubDate = (itemXml.match(new RegExp("<pubDate[^>]*>([\\s\\S]*?)<\\/pubDate>","i")) || [])[1]?.trim() || "";

      // Filter: only healthcare-related items
      const combined = (title + " " + desc).toLowerCase();
      const isHealth = ["health", "hospital", "medical", "pharma", "clinic", "doctor", "patient", "moh", "sfda", "healthcare", "vision 2030", "invest", "saudi"].some(k => combined.includes(k));

      if (title && isHealth) {
        items.push({
          title: title.slice(0, 100),
          summary: desc.slice(0, 200),
          source: sourceName,
          url: link,
          date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : "",
          category: categorize(title + " " + desc),
        });
      }
    }
    return items;
  } catch(e) { return []; }
}

function categorize(text) {
  const t = text.toLowerCase();
  if (t.includes("invest") || t.includes("fund") || t.includes("capital") || t.includes("billion") || t.includes("million")) return "Investment";
  if (t.includes("regulation") || t.includes("license") || t.includes("misa") || t.includes("moh") || t.includes("sfda") || t.includes("law")) return "Regulation";
  if (t.includes("hospital") || t.includes("construct") || t.includes("build") || t.includes("facility") || t.includes("bed")) return "Infrastructure";
  if (t.includes("digital") || t.includes("tech") || t.includes("ai") || t.includes("app") || t.includes("telemedicine")) return "Digital Health";
  if (t.includes("pharma") || t.includes("drug") || t.includes("medicine") || t.includes("vaccine")) return "Pharma";
  if (t.includes("ipo") || t.includes("listing") || t.includes("tadawul") || t.includes("stock")) return "IPO";
  if (t.includes("merger") || t.includes("acqui") || t.includes("deal") || t.includes("partner")) return "M&A";
  return "Policy";
}

// Default curated news (always available, no API needed)
function getDefaultNews() {
  return [
    { title: "Saudi Healthcare Sector Attracts $33B in GHE 2025 Agreements", summary: "The Global Health Exhibition 2025 saw a 125% increase in healthcare investment commitments, signaling strong investor confidence in the Kingdom's healthcare transformation.", source: "GHE 2025", category: "Investment", date: "2025-10" },
    { title: "Vision 2030: Private Sector Share to Reach 65% of Healthcare by 2030", summary: "Saudi Arabia plans to privatize 290 hospitals and 2,300 primary health centres under Vision 2030, creating massive opportunities for private investors.", source: "Vision 2030", category: "Policy", date: "2025" },
    { title: "100% Foreign Ownership Now Allowed in Saudi Healthcare", summary: "MISA confirmed that foreign investors can fully own healthcare facilities in Saudi Arabia, removing previous restrictions on hospital and clinic investments.", source: "MISA", category: "Regulation", date: "2025" },
    { title: "SR260 Billion Allocated to Health and Social Development in 2025", summary: "The national budget allocated SR260 billion to health, the second-largest spending category, supporting new hospital construction and health system modernization.", source: "Ministry of Finance", category: "Policy", date: "2025" },
    { title: "GCC Healthcare Market Projected to Reach $170.5B by 2030", summary: "The GCC healthcare innovation market is expected to grow from $121.9 billion in 2025 to $170.5 billion by 2030, led by digital health and infrastructure expansion.", source: "Research & Markets", category: "Investment", date: "2025" },
    { title: "Almoosa Health IPO Raises $450 Million on Tadawul", summary: "Saudi Arabia's Almoosa Health successfully completed its IPO, raising $450 million and becoming one of the largest healthcare IPOs in the region.", source: "Tadawul", category: "IPO", date: "2025" },
    { title: "Saudi Arabia Needs 12,300+ New Hospital Beds by 2029", summary: "The Kingdom needs over 8,500 new beds, accounting for 69% of the GCC's total projected additions of 12,317 beds by 2029.", source: "Alpen Capital", category: "Infrastructure", date: "2025" },
    { title: "Dr. Sulaiman Al Habib Revenue Grows 22% to SAR 7.8 Billion", summary: "HMG's revenue grew 22% in 2025, driven by hospital expansion into secondary cities and new specialty centres in IVF and oncology.", source: "HMG", category: "M&A", date: "2025" },
    { title: "Digital Health Market in Saudi-UAE Projected at $4B by 2026", summary: "Telehealth, AI diagnostics, and digital pharmacy are driving the combined Saudi-UAE digital health market to an estimated $4 billion.", source: "McKinsey", category: "Digital Health", date: "2025" },
    { title: "NUPCO Listed on Tadawul -- Government Healthcare Supply Monopoly", summary: "National Unified Procurement Company joined Tadawul with contractually guaranteed revenue from the expanding government health system.", source: "Tadawul", category: "IPO", date: "2025" },
  ];
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "news";

  // Return stock list
  if (type === "stocks") {
    return Response.json({ stocks: HEALTHCARE_STOCKS, count: HEALTHCARE_STOCKS.length });
  }

  // Return cached news if fresh
  if (newsCache.data && Date.now() - newsCache.timestamp < NEWS_TTL) {
    return Response.json({ news: newsCache.data, cached: true, source: "cache" });
  }

  // Try RSS feeds first (FREE, no API key)
  let rssNews = [];
  try {
    const results = await Promise.allSettled(
      RSS_SOURCES.map(src => fetchRSS(src.url, src.name))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.length) rssNews.push(...r.value);
    }
  } catch(e) {}

  if (rssNews.length >= 3) {
    // Deduplicate by title similarity
    const seen = new Set();
    const unique = rssNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);

    newsCache = { data: unique, timestamp: Date.now() };
    return Response.json({ news: unique, cached: false, source: "rss" });
  }

  // Try AI-enhanced news (if API key available)
  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  if (apiKey && apiKey.startsWith("sk-")) {
    try {
      const models = ["claude-haiku-4-5-20251001", "claude-3-haiku-20240307"]; // Use cheapest model for news
      for (const model of models) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({
              model, max_tokens: 1500,
              tools: [{ type: "web_search_20250305", name: "web_search" }],
              messages: [{ role: "user", content: 'Search for latest Saudi Arabia healthcare investment news. Return ONLY a JSON array with 8 objects: {"title":"...","summary":"...","source":"...","category":"Investment|Regulation|Infrastructure|Digital Health|Pharma|Policy|M&A|IPO","date":"YYYY-MM-DD"}. No markdown, no backticks.' }],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const text = data.content?.map(c => c.text || "").filter(Boolean).join("");
            const jsonMatch = text.match(new RegExp("\\[[\\s\\S]*\\]"));
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.length) {
                newsCache = { data: parsed, timestamp: Date.now() };
                return Response.json({ news: parsed, cached: false, source: "ai" });
              }
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
  }

  // Final fallback: curated default news
  const defaults = getDefaultNews();
  newsCache = { data: defaults, timestamp: Date.now() };
  return Response.json({ news: defaults, cached: false, source: "default" });
}
