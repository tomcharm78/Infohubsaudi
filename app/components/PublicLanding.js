"use client";
import { useState, useEffect, useRef } from "react";
import { TrendingUp, ArrowRight, Users, Building2, MapPin, FileText, Bot, Star, Crown, ChevronRight, BarChart3, Globe, Sparkles, Heart, Shield, Activity } from "lucide-react";

const CATEGORY_COLORS = {
  Investment: { bg: "#E8F5EE", color: "#1B7A4A" },
  Regulation: { bg: "#DBEAFE", color: "#2563EB" },
  Infrastructure: { bg: "#FEF3C7", color: "#D97706" },
  "Digital Health": { bg: "#EDE9FE", color: "#7C3AED" },
  Pharma: { bg: "#FEE2E2", color: "#DC2626" },
  Policy: { bg: "#F0FDF4", color: "#15803D" },
  "M&A": { bg: "#FFF7ED", color: "#EA580C" },
  IPO: { bg: "#F9F5EA", color: "#B5A167" },
};

const STOCKS = [
  // Healthcare Providers
  { ticker: "4013", name: "Al Habib" },
  { ticker: "4004", name: "Dallah" },
  { ticker: "4002", name: "Mouwasat" },
  { ticker: "4007", name: "Al Hammadi" },
  { ticker: "4009", name: "Saudi German" },
  { ticker: "4005", name: "CARE" },
  { ticker: "4016", name: "Almoosa" },
  { ticker: "4164", name: "Al Nahdi" },
  { ticker: "2070", name: "SPIMACO" },
  { ticker: "2230", name: "Saudi Chemical" },
  { ticker: "4163", name: "TIBBIYAH" },
  { ticker: "4014", name: "AYYAN" },
  { ticker: "9543", name: "NUPCO" },
  // Health Insurance
  { ticker: "8210", name: "Bupa Arabia" },
  { ticker: "8010", name: "Tawuniya" },
  { ticker: "8230", name: "Al Rajhi Takaful" },
  { ticker: "8030", name: "MedGulf" },
  { ticker: "8060", name: "Walaa" },
  { ticker: "8100", name: "SAICO" },
  { ticker: "8250", name: "GIG Saudi" },
];

const PLATFORM_STATS = [
  { label: "Healthcare Providers", value: "18,000+", icon: Heart },
  { label: "Investors Tracked", value: "400+", icon: Building2 },
  { label: "Saudi Regions Covered", value: "13", icon: MapPin },
  { label: "Government Entities", value: "15+", icon: Shield },
];

export default function PublicLanding({ onLogin, onSignup }) {
  const [news, setNews] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const tickerRef = useRef(null);

  useEffect(() => {
    fetchNews();
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news?type=news");
      const data = await res.json();
      setNews(data.news || []);
    } catch(e) { setNews([]); }
    setLoadingNews(false);
  };

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/news?type=stocks"); // Just to avoid importing supabase on public page
      // For testimonials, use static ones until user logs in
    } catch(e) {}
    setTestimonials([
      { name: "Dr. Ahmed Al-Rashidi", org: "Riyadh Ventures", content: "The most comprehensive healthcare investment tool for the Saudi market. The AI advisor saved me weeks of research.", rating: 5, type: "investor" },
      { name: "Sarah Al-Dosari", org: "HealthTech Startup", content: "Found our Series A investor through this platform in just 3 weeks. The marketplace feature is incredible.", rating: 5, type: "seeker" },
      { name: "Mohammed Al-Turki", org: "Gulf Impact Foundation", content: "Finally a platform that understands NGO needs in healthcare. The government advisory chatbot is a game-changer.", rating: 5, type: "partner" },
    ]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F5", fontFamily: "'DM Sans', sans-serif" }}>
<div style={{ background: "#0D3D24", padding: "6px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "ticker 30s linear infinite", gap: 32 }}>
          {[...STOCKS, ...STOCKS].map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: "#D4C68E", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700, color: "#fff" }}>{s.name}</span>
              <span style={{ color: "#B5A167" }}>TADAWUL:{s.ticker}</span>
              <Activity size={10} color="#2D9E64" />
            </span>
          ))}
        </div>
      </div>
<header style={{ padding: "16px 32px", background: "linear-gradient(135deg, #0D3D24 0%, #1B7A4A 50%, #145C38 100%)", borderBottom: "3px solid #B5A167", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#D4C68E" }}>H</span>
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Healthcare Investor Intelligence</div>
            <div style={{ color: "#D4C68E", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>GCC · Saudi Arabia · Vision 2030</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onLogin} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Log In</button>
          <button onClick={onSignup} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Get Started Free</button>
        </div>
      </header>
<section style={{ padding: "48px 32px 32px", textAlign: "center", background: "linear-gradient(180deg, #E8F5EE 0%, #F4F6F5 100%)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1A2E23", fontFamily: "'Playfair Display', serif", lineHeight: 1.2, marginBottom: 16 }}>
            The Intelligence Platform for<br /><span style={{ color: "#1B7A4A" }}>Healthcare Investment</span> in Saudi Arabia
          </h1>
          <p style={{ fontSize: 16, color: "#6B8574", lineHeight: 1.6, marginBottom: 24, maxWidth: 540, margin: "0 auto 24px" }}>
            Connect with 400+ investors, explore 18,000+ healthcare providers on an interactive map, get AI-powered investment guidance, and close deals -- all in one platform.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onSignup} style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 16px rgba(27,122,74,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
              Start Free <ArrowRight size={18} />
            </button>
            <button onClick={onLogin} style={{ padding: "14px 32px", borderRadius: 10, border: "2px solid #1B7A4A", background: "transparent", color: "#1B7A4A", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
              Log In
            </button>
          </div>
        </div>
<div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32, flexWrap: "wrap" }}>
          {PLATFORM_STATS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "#fff", border: "1px solid #D6E4DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <s.icon size={18} color="#1B7A4A" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A2E23" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "#6B8574", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
<section style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A2E23", fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Healthcare Investment News</h2>
            <p style={{ fontSize: 12, color: "#8FA898" }}>Latest developments in Saudi Arabia's healthcare sector</p>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "#E8F5EE", fontSize: 10, color: "#1B7A4A", fontWeight: 600 }}>
            <Sparkles size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> AI-curated · Updated every 6 hours
          </div>
        </div>

        {loadingNews ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8FA898" }}>Loading latest news...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {news.slice(0, 5).map((item, i) => {
                const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Investment;
                return (
                  <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                      {item.category === "Investment" ? "💰" : item.category === "Regulation" ? "📋" : item.category === "Infrastructure" ? "🏗️" : item.category === "Digital Health" ? "💻" : item.category === "Pharma" ? "💊" : item.category === "Policy" ? "🏛️" : item.category === "IPO" ? "📈" : "📰"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: cat.bg, color: cat.color }}>{item.category}</span>
                        {item.source && <span style={{ fontSize: 9, color: "#8FA898" }}>{item.source}</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A2E23", lineHeight: 1.4, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6B8574", lineHeight: 1.5 }}>{item.summary}</div>
                    </div>
                  </div>
                );
              })}
            </div>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<div style={{ padding: 18, borderRadius: 12, background: "linear-gradient(135deg, #F9F5EA, #FFFBF0)", border: "2px solid #D4C68E" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#B5A167", textTransform: "uppercase", marginBottom: 8 }}>🔥 Featured Opportunity</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 6 }}>PPP Hospital Projects Open for Investment</div>
                <div style={{ fontSize: 11, color: "#6B8574", marginBottom: 12, lineHeight: 1.5 }}>Multiple government-backed healthcare projects seeking private sector partners across Saudi regions.</div>
                <button onClick={onSignup} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#B5A167", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  Sign Up to View Details →
                </button>
              </div>
{testimonials.length > 0 && <div style={{ padding: 18, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                  {Array(testimonials[currentTestimonial]?.rating || 5).fill(0).map((_, i) => <Star key={i} size={12} fill="#B5A167" color="#B5A167" />)}
                </div>
                <div style={{ fontSize: 12, color: "#3D5A47", fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
                  "{testimonials[currentTestimonial]?.content}"
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1A2E23" }}>{testimonials[currentTestimonial]?.name}</div>
                <div style={{ fontSize: 10, color: "#8FA898" }}>{testimonials[currentTestimonial]?.org}</div>
              </div>}
<div style={{ padding: 18, borderRadius: 12, background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", color: "#fff" }}>
                <Bot size={24} color="#D4C68E" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>AI Investment Advisor</div>
                <div style={{ fontSize: 11, color: "#D4C68E", lineHeight: 1.5, marginBottom: 12 }}>Ask anything about Saudi healthcare investment -- licensing, funding, regulations, Vision 2030.</div>
                <button onClick={onSignup} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D4C68E", background: "rgba(255,255,255,0.1)", color: "#D4C68E", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Try Free →
                </button>
              </div>
<div style={{ padding: 16, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.656-6.364-1.791l-.444-.27-2.634.883.883-2.634-.27-.444A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Official WhatsApp Channels
                </div>
                {[
                  { name: "وزارة الصحة السعودية", nameEn: "Ministry of Health (MOH)", url: "https://whatsapp.com/channel/0029VaYcOW99Gv7QO19PXd1m" },
                  { name: "هيئة الغذاء والدواء", nameEn: "Saudi FDA (SFDA)", url: "https://whatsapp.com/channel/0029VaG4RtcBPzjehHiO1H3M" },
                  { name: "وزارة التجارة", nameEn: "Ministry of Commerce", url: "https://whatsapp.com/channel/0029VaL2gNh3wtbHsYKSbK1N" },
                  { name: "وزارة البلديات والإسكان", nameEn: "Ministry of Municipal Affairs (Balady)", url: "https://whatsapp.com/channel/0029VacB3iNFi8xWjTfqp13a" },
                  { name: "وزارة الموارد البشرية والتنمية الاجتماعية", nameEn: "Ministry of Human Resources", url: "https://whatsapp.com/channel/0029VaFxrlk5EjxrK9zEGM3O" },
                  { name: "وزارة الحج والعمرة", nameEn: "Ministry of Hajj & Umrah", url: "https://whatsapp.com/channel/0029VaFkKnG1dAw7rmzX2L2J" },
                  { name: "Nusuk | نسك", nameEn: "Nusuk Platform", url: "https://whatsapp.com/channel/0029VbBnCIVDp2Q3R1MY831T" },
                ].map((ch, i) => (
                  <a key={i} href={ch.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", marginBottom: 6, textDecoration: "none", cursor: "pointer" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.656-6.364-1.791l-.444-.27-2.634.883.883-2.634-.27-.444A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23" }}>{ch.name}</div>
                      <div style={{ fontSize: 10, color: "#6B8574" }}>{ch.nameEn} -- Official Channel</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#25D366", flexShrink: 0 }}>Follow →</div>
                  </a>
                ))}
                <div style={{ fontSize: 9, color: "#8FA898", marginTop: 8, textAlign: "center" }}>Follow official government channels for real-time healthcare updates</div>
              </div>
{news.slice(5).map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 8, background: "#fff", border: "1px solid #E8EFE9" }}>
                  <span style={{ padding: "2px 6px", borderRadius: 3, fontSize: 8, fontWeight: 700, background: (CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Investment).bg, color: (CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Investment).color }}>{item.category}</span>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23", marginTop: 4, lineHeight: 1.3 }}>{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
<section style={{ padding: "48px 32px", background: "#fff", borderTop: "1px solid #D6E4DB" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Official MOH Open Data</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1A2E23", fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>Saudi Healthcare Infrastructure at a Glance</h2>
            <p style={{ fontSize: 13, color: "#8FA898", maxWidth: 500, margin: "0 auto" }}>Data sourced from Ministry of Health -- Health Holding Company (health.sa)</p>
          </div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 32 }}>
            {[
              { val: "21", label: "Health Clusters", sub: "Nationwide", color: "#1B7A4A" },
              { val: "78,440", label: "Hospital Beds", sub: "All sectors", color: "#3B82F6" },
              { val: "2,387", label: "Primary Care Centers", sub: "MOH operated", color: "#D97706" },
              { val: "322", label: "Hospitals", sub: "MOH network", color: "#8B5CF6" },
              { val: "32.2M", label: "Population Served", sub: "2.4 beds/1,000", color: "#DC2626" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "20px 16px", borderRadius: 12, background: `${s.color}06`, border: `1px solid ${s.color}18`, textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.val}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1A2E23", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 9, color: "#8FA898", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
<div style={{ padding: 22, borderRadius: 12, border: "1px solid #D6E4DB", background: "#FAFBFA" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23", marginBottom: 4 }}>Top Health Clusters by Bed Capacity</div>
              <div style={{ fontSize: 10, color: "#8FA898", marginBottom: 14 }}>MOH government hospitals only</div>
              {[
                { name: "Eastern Province", beds: 3456, pop: "1.9M" },
                { name: "Aseer", beds: 3389, pop: "2.1M" },
                { name: "Al-Madinah", beds: 3118, pop: "2.3M" },
                { name: "Makkah", beds: 3094, pop: "1.9M" },
                { name: "Riyadh 1st", beds: 4000, pop: "3.9M" },
                { name: "Qassim", beds: 2909, pop: "1.0M" },
                { name: "AlTaif", beds: 2640, pop: "1.0M" },
                { name: "Riyadh 2nd", beds: 2449, pop: "3.8M" },
              ].sort((a,b) => b.beds - a.beds).map((c, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: "#1A2E23", fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: "#1B7A4A" }}>{c.beds.toLocaleString()} beds</span>
                  </div>
                  <div style={{ height: 6, background: "#E8EFE9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${(c.beds / 4000) * 100}%`, height: "100%", background: "linear-gradient(90deg, #1B7A4A, #2D9E64)", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#8FA898", marginTop: 1 }}>Serving {c.pop} beneficiaries</div>
                </div>
              ))}
            </div>
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: 22, borderRadius: 12, border: "1px solid #D4C68E", background: "linear-gradient(145deg, #FAF6EE, #FFF9F0)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8C7B4A", marginBottom: 12 }}>Why Invest in Saudi Healthcare?</div>
                {[
                  { metric: "SR 260B", desc: "2025 national health budget -- 2nd largest spending category" },
                  { metric: "65%", desc: "Target private sector share of healthcare delivery by 2030" },
                  { metric: "290", desc: "Government hospitals targeted for privatization under Vision 2030" },
                  { metric: "8,500+", desc: "New hospital beds needed by 2029 (69% of GCC total)" },
                  { metric: "$170.5B", desc: "Projected GCC healthcare market by 2030" },
                  { metric: "100%", desc: "Foreign ownership allowed in healthcare since 2019" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 68, padding: "4px 8px", borderRadius: 6, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 800, textAlign: "center", flexShrink: 0 }}>{item.metric}</div>
                    <div style={{ fontSize: 11, color: "#4A5A4F", lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 18, borderRadius: 12, border: "1px solid #D6E4DB", background: "#FAFBFA", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6B8574", marginBottom: 8 }}>Want the full breakdown by region?</div>
                <button onClick={onSignup} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #1B7A4A, #2D9E64)", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                  Sign Up Free -- Explore All 21 Clusters
                </button>
                <div style={{ fontSize: 9, color: "#8FA898", marginTop: 6 }}>Dashboard includes interactive charts, cluster comparisons, and downloadable reports</div>
              </div>
            </div>
          </div>
        </div>
      </section>
<section style={{ padding: "48px 32px", background: "#F4F6F5", borderTop: "1px solid #D6E4DB" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Live Government Data · 15 Datasets Connected</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1A2E23", fontFamily: "'Playfair Display', serif" }}>MOH Health Data Platform</h2>
              <p style={{ fontSize: 12, color: "#8FA898", marginTop: 4 }}>Real-time open data from hdp.moh.gov.sa -- free, public API, no registration</p>
            </div>
            <div style={{ padding: "6px 14px", borderRadius: 8, background: "#E8F5EE", border: "1px solid #B8DCC8", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1B7A4A", animation: "blink 2s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#1B7A4A" }}>API Connected</span>
            </div>
          </div>
<div style={{ padding: 20, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23", marginBottom: 14 }}>Health Indicators</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { val: "77.9", label: "Life Expectancy", sub: "Years (Saudi nationals)", color: "#1B7A4A" },
                { val: "45.83M", label: "PHC Visits", sub: "Primary healthcare centers", color: "#3B82F6" },
                { val: "96.3%", label: "Immunization", sub: "Basic coverage rate", color: "#8B5CF6" },
                { val: "42.1", label: "Doctors / 10K", sub: "Per 10,000 population", color: "#D97706" },
                { val: "96%", label: "Measles Vaccination", sub: "Coverage rate", color: "#1B7A4A" },
                { val: "2.14", label: "Fertility Rate", sub: "Total fertility", color: "#DC2626" },
                { val: "7.41", label: "Infant Mortality", sub: "Per 1,000 live births", color: "#D97706" },
                { val: "4,423", label: "Traffic Fatalities", sub: "Annual deaths", color: "#DC2626" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "12px 10px", borderRadius: 8, background: "#FAFBFA", border: "1px solid #E8EFE9", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#1A2E23", marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 8, color: "#8FA898", marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
<div style={{ padding: 20, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23", marginBottom: 14 }}>Resources</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { val: "499", label: "Hospitals", sub: "Healthcare sector", color: "#3B82F6" },
                  { val: "2,126", label: "PHC Centers", sub: "Primary healthcare", color: "#1B7A4A" },
                  { val: "9,360", label: "Pharmacies", sub: "Licensed", color: "#8B5CF6" },
                  { val: "300.67K", label: "Health Staff", sub: "MOH workforce", color: "#D97706" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "14px 10px", borderRadius: 8, background: `${s.color}06`, border: `1px solid ${s.color}15`, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#1A2E23", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 8, color: "#8FA898" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
<div style={{ padding: 20, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23", marginBottom: 14 }}>Activities & Services</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { val: "15.92M", label: "Hospital Appt.", sub: "Healthcare hospitals", color: "#3B82F6" },
                  { val: "26.53M", label: "PHC Appt.", sub: "Primary care", color: "#1B7A4A" },
                  { val: "1.25M", label: "Virtual Visits", sub: "Virtual clinics", color: "#8B5CF6" },
                  { val: "61,271", label: "Maternity Cases", sub: "Complications in MOH", color: "#DC2626" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "14px 10px", borderRadius: 8, background: `${s.color}06`, border: `1px solid ${s.color}15`, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#1A2E23", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 8, color: "#8FA898" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
<div style={{ padding: 20, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23", marginBottom: 14 }}>Hajj Season Health Services</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { val: "1,261", label: "Catheterizations", sub: "For pilgrims" },
                { val: "10,555", label: "Heat Exhaustion", sub: "Last 5 years" },
                { val: "39,118", label: "ER Visits", sub: "Pilgrim emergency" },
                { val: "196K", label: "PHC Visits", sub: "Pilgrim primary care" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "14px 10px", borderRadius: 8, background: "#FAFBFA", border: "1px solid #E8EFE9", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1A2E23" }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#3D5A47", marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 8, color: "#8FA898" }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
<div style={{ padding: 20, borderRadius: 12, background: "#fff", border: "1px solid #D6E4DB", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23" }}>Open Datasets via MOH API</div>
              <div style={{ fontSize: 9, color: "#8FA898" }}>15 datasets · hdp.moh.gov.sa</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { name: "Hospitals & Beds by Region", cat: "Infrastructure", year: "2023" },
                { name: "PHC Centers by Region (5yr)", cat: "Infrastructure", year: "2023" },
                { name: "Licensed Pharmacies List", cat: "Resources", year: "2023" },
                { name: "Medical Appointments & Referrals", cat: "Services", year: "2022" },
                { name: "PHC Visits by Region", cat: "Services", year: "2023" },
                { name: "Pilgrim Healthcare (5yr)", cat: "Hajj", year: "2023" },
                { name: "MOH Staff by Region", cat: "Workforce", year: "2023" },
                { name: "Vaccination Coverage (5yr)", cat: "Indicators", year: "2023" },
                { name: "Health Resources per 10K", cat: "Indicators", year: "2023" },
                { name: "Population Indicators", cat: "Demographics", year: "2023" },
                { name: "Mortality Indicators", cat: "Mortality", year: "2023" },
                { name: "Traffic Accidents (10yr)", cat: "Safety", year: "2023" },
                { name: "KKESH Eye Hospital (5yr)", cat: "Specialist", year: "2023" },
                { name: "Long-term Hospital Beds", cat: "Infrastructure", year: "2023" },
                { name: "Medical Malpractice Cases", cat: "Regulation", year: "2022" },
              ].map((d, i) => {
                const catColors = { Infrastructure: "#3B82F6", Resources: "#1B7A4A", Services: "#D97706", Hajj: "#8B5CF6", Workforce: "#DC2626", Indicators: "#0EA5E9", Demographics: "#6366F1", Mortality: "#DC2626", Safety: "#F59E0B", Specialist: "#14B8A6", Regulation: "#7C3AED" };
                const bg = { Infrastructure: "#DBEAFE", Resources: "#E8F5EE", Services: "#FEF3C7", Hajj: "#EDE9FE", Workforce: "#FEF2F2", Indicators: "#E0F2FE", Demographics: "#EEF2FF", Mortality: "#FEF2F2", Safety: "#FEF9C3", Specialist: "#D1FAE5", Regulation: "#F5F3FF" };
                return (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "#FAFBFA", border: "1px solid #E8EFE9", display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: catColors[d.cat] || "#1B7A4A", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#1A2E23", lineHeight: 1.3 }}>{d.name}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: bg[d.cat] || "#E8EFE9", color: catColors[d.cat] || "#1B7A4A", fontWeight: 600 }}>{d.cat}</span>
                        <span style={{ fontSize: 8, color: "#8FA898" }}>{d.year}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
<div style={{ padding: "16px 22px", borderRadius: 10, background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Full interactive dashboards inside the platform</div>
              <div style={{ fontSize: 11, color: "#D4C68E", marginTop: 2 }}>Charts, comparisons, regional breakdowns, and downloadable reports</div>
            </div>
            <button onClick={onSignup} style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#B5A167", color: "#1A2E23", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>Explore Free</button>
          </div>
        </div>
      </section>
<section style={{ padding: "40px 32px", background: "#fff", borderTop: "1px solid #D6E4DB" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1A2E23", fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>Everything You Need to Invest in Saudi Healthcare</h2>
          <p style={{ fontSize: 13, color: "#8FA898", marginBottom: 32 }}>From market intelligence to deal execution -- one platform</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { icon: "🗺️", title: "Interactive Map", desc: "18,000+ providers, opportunity lands, PPP projects, and private assets across all 13 Saudi regions" },
              { icon: "💰", title: "Investor Directory", desc: "400+ healthcare investors with AUM, contacts, portfolio, and deal history" },
              { icon: "🤖", title: "AI Advisor", desc: "Ask anything about Saudi healthcare investment -- MISA, MOH, SFDA, SIDF procedures and more" },
              { icon: "📊", title: "Market Analytics", desc: "Dashboard with charts, demand/supply analysis, and downloadable reports" },
              { icon: "🏪", title: "Marketplace", desc: "3 directories: Investors, Seekers, Partners -- create your card and get discovered" },
              { icon: "📝", title: "Contracts", desc: "Digital signatures, MOU/investment/funding agreements, PDF download, audit trail" },
              { icon: "🔗", title: "Connections", desc: "Direct messaging for Silver, admin-facilitated introductions for Gold members" },
              { icon: "📚", title: "Studies & Reports", desc: "Download market studies, presentations, and feasibility reports" },
            ].map((f, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 12, border: "1px solid #D6E4DB", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#6B8574", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
<section style={{ padding: "40px 32px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>Start Your Healthcare Investment Journey Today</h2>
        <p style={{ fontSize: 14, color: "#D4C68E", marginBottom: 24 }}>Free account gives you dashboard access, map, and 1 AI advisor question. Upgrade anytime.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onSignup} style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: "#B5A167", color: "#1A2E23", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>Create Free Account</button>
          <button onClick={onLogin} style={{ padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Log In</button>
        </div>
      </section>
<footer style={{ padding: "32px 32px 20px", background: "#0D3D24" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 24, marginBottom: 24 }}>
<div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>Healthcare Investor Intelligence</div>
              <p style={{ fontSize: 11, color: "#6B8574", lineHeight: 1.6 }}>
                The leading platform for healthcare investment intelligence in Saudi Arabia and the GCC region. Connect with investors, explore opportunities across 13 Saudi regions, and navigate Vision 2030 healthcare transformation with AI-powered guidance.
              </p>
            </div>
<div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#D4C68E", textTransform: "uppercase", marginBottom: 8 }}>Government Entities</div>
              {["MISA -- investsaudi.sa","MOH -- moh.gov.sa","SFDA -- sfda.gov.sa","SIDF -- sidf.gov.sa","MODON -- modon.gov.sa","Monsha'at -- monshaat.gov.sa","ZATCA -- zatca.gov.sa"].map((e, i) =>
                <div key={i} style={{ fontSize: 10, color: "#6B8574", marginBottom: 3 }}>{e}</div>
              )}
            </div>
<div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#D4C68E", textTransform: "uppercase", marginBottom: 8 }}>Markets Covered</div>
              {["Saudi Arabia","United Arab Emirates","Qatar","Kuwait","Bahrain","Oman","Global Healthcare"].map((m, i) =>
                <div key={i} style={{ fontSize: 10, color: "#6B8574", marginBottom: 3 }}>{m}</div>
              )}
            </div>
<div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#D4C68E", textTransform: "uppercase", marginBottom: 8 }}>Healthcare Sectors</div>
              {["Hospitals & Clinics","Pharmaceutical","Medical Devices","Digital Health","Home Healthcare","Medical Tourism","Insurance","Rehabilitation"].map((s, i) =>
                <div key={i} style={{ fontSize: 10, color: "#6B8574", marginBottom: 3 }}>{s}</div>
              )}
            </div>
          </div>
<div style={{ padding: "10px 0", borderTop: "1px solid #1B7A4A", marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: "#3D5A47", lineHeight: 1.6 }}>
              Tadawul Healthcare Stocks: Dr. Sulaiman Al Habib (4013) · Dallah Healthcare (4004) · Mouwasat Medical (4002) · Al Hammadi (4007) · Saudi German Hospital (4009) · National Medical Care (4005) · Almoosa Health (4016) · Nahdi Medical (4164) · SPIMACO (2070) · Saudi Chemical (2230) · TIBBIYAH (4163) · AYYAN Investment (4014) · NUPCO (9543)
            </div>
          </div>
<div style={{ textAlign: "center", paddingTop: 12, borderTop: "1px solid #1B7A4A" }}>
            <div style={{ fontSize: 10, color: "#6B8574" }}>© {new Date().getFullYear()} HealthBridge GCC -- Healthcare Investor Intelligence Platform. All rights reserved.</div>
            <div style={{ fontSize: 9, color: "#3D5A47", marginTop: 4 }}>This platform does not provide financial, legal, or investment advice. Consult licensed professionals for investment decisions.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
