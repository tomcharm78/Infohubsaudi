"use client";
import { useState, useEffect, useMemo } from "react";
import { Briefcase, Plus, Search, X, CheckCircle, Eye, MessageSquare, Crown, Star, Shield, Trash2, Pencil, Send, MapPin, DollarSign, Clock, Users, ArrowUp, Lock, Filter, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const DEAL_TYPES = [
  { id: "equity", label: "Equity Investment", icon: "💰" },
  { id: "debt", label: "Debt/Loan", icon: "🏦" },
  { id: "partnership", label: "Partnership/JV", icon: "🤝" },
  { id: "acquisition", label: "Acquisition", icon: "🏢" },
  { id: "lease", label: "Lease/Operate", icon: "🔑" },
  { id: "ppp", label: "PPP Project", icon: "🏛️" },
  { id: "other", label: "Other", icon: "📋" },
];

const SECTORS = ["Hospitals","Clinics","Pharma","MedTech","Digital Health","Home Healthcare","Dental","Eye Care","Mental Health","Rehabilitation","Laboratory","Medical Tourism","Insurance","Elderly Care"];

export default function DealFlow({ onClose, onUpgrade }) {
  const { user, profile, isAdmin } = useAuth();
  const tier = profile?.subscription_tier || "basic";
  const canPost = tier !== "basic" || isAdmin;
  const canExpress = tier !== "basic" || isAdmin;

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selDeal, setSelDeal] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterSector, setFilterSector] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [interests, setInterests] = useState([]);

  // Form state
  const [form, setForm] = useState({ title: "", deal_type: "equity", sector: "", city: "", region: "", funding_amount: "", currency: "SAR", equity_offered: "", description: "", highlights: [], requirements: "", timeline: "" });
  const [highlightInput, setHighlightInput] = useState("");

  useEffect(() => { fetchDeals(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const fetchDeals = async () => {
    const { data } = await supabase.from("deals").select("*").eq("status", "active").order("is_featured", { ascending: false }).order("created_at", { ascending: false });
    setDeals(data || []); setLoading(false);
  };

  const filtered = useMemo(() => {
    let f = deals;
    if (filterSector !== "All") f = f.filter(d => d.sector === filterSector);
    if (filterType !== "All") f = f.filter(d => d.deal_type === filterType);
    if (searchQ) { const q = searchQ.toLowerCase(); f = f.filter(d => d.title.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q) || (d.city || "").toLowerCase().includes(q) || (d.user_org || "").toLowerCase().includes(q)); }
    return f;
  }, [deals, filterSector, filterType, searchQ]);

  const myDeals = useMemo(() => deals.filter(d => d.user_id === user?.id), [deals, user]);

  const submitDeal = async () => {
    if (!form.title.trim()) return alert("Title required");
    if (!form.sector) return alert("Select a sector");
    await supabase.from("deals").insert({ ...form, user_id: user.id, user_email: user.email, user_name: profile?.full_name || "", user_org: profile?.organization || "", user_type: profile?.user_type || "seeker", is_featured: tier === "gold", status: "active" });
    setToast("Deal posted!"); setView("list"); setForm({ title: "", deal_type: "equity", sector: "", city: "", region: "", funding_amount: "", currency: "SAR", equity_offered: "", description: "", highlights: [], requirements: "", timeline: "" }); fetchDeals();
  };

  const expressInterest = async (deal, message) => {
    await supabase.from("deal_interests").insert({ deal_id: deal.id, user_id: user.id, user_email: user.email, user_name: profile?.full_name || "", message });
    await supabase.from("deals").update({ interest_count: (deal.interest_count || 0) + 1 }).eq("id", deal.id);
    // Notify deal owner
    await supabase.from("notifications").insert({ user_id: deal.user_id, title: "💰 New Interest in Your Deal", message: `${profile?.full_name || user.email} expressed interest in "${deal.title}". Message: ${message}`, type: "info", metadata: { deal_id: deal.id, from_email: user.email } });
    setToast("Interest sent! Deal owner will be notified."); fetchDeals();
  };

  const viewDeal = async (deal) => {
    await supabase.from("deals").update({ views_count: (deal.views_count || 0) + 1 }).eq("id", deal.id);
    if (deal.user_id === user?.id || isAdmin) {
      const { data } = await supabase.from("deal_interests").select("*").eq("deal_id", deal.id).order("created_at", { ascending: false });
      setInterests(data || []);
    }
    setSelDeal({ ...deal, views_count: (deal.views_count || 0) + 1 }); setView("detail");
  };

  const deleteDeal = async (id) => { if (!confirm("Delete this deal?")) return; await supabase.from("deals").delete().eq("id", id); fetchDeals(); setView("list"); setToast("Deleted"); };

  const readinessScore = (deal) => {
    let s = 0, max = 0;
    max += 10; if (deal.title?.length > 10) s += 10;
    max += 15; if (deal.description?.length > 50) s += 15;
    max += 10; if (deal.sector) s += 10;
    max += 10; if (deal.city) s += 10;
    max += 15; if (deal.funding_amount) s += 15;
    max += 10; if (deal.equity_offered) s += 10;
    max += 10; if ((deal.highlights || []).length >= 2) s += 10;
    max += 10; if (deal.requirements?.length > 20) s += 10;
    max += 10; if (deal.timeline) s += 10;
    return Math.round((s / max) * 100);
  };

  const scoreColor = (s) => s >= 80 ? "#1B7A4A" : s >= 50 ? "#D97706" : "#DC3545";
  const scoreLabel = (s) => s >= 80 ? "Investor Ready" : s >= 50 ? "Needs Work" : "Incomplete";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 850, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Briefcase size={22} color="#D4C68E" />
            <div><h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>{view === "create" ? "Post a Deal" : view === "detail" ? selDeal?.title : "Deal Flow"}</h2>
              <div style={{ color: "#D4C68E", fontSize: 10 }}>{deals.length} active deals · Real-time investment opportunities</div></div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
{view === "create" && <div>
            <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>← Back</button>
            <div style={{ display: "grid", gap: 12, maxHeight: "65vh", overflowY: "auto" }}>
              <div><label style={LS}>Deal Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 50-Bed Hospital Seeking Equity Partner in Riyadh" style={IS} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={LS}>Deal Type</label><select value={form.deal_type} onChange={e => setForm({ ...form, deal_type: e.target.value })} style={IS}>{DEAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}</select></div>
                <div><label style={LS}>Sector *</label><select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} style={IS}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><label style={LS}>Funding Amount</label><input value={form.funding_amount} onChange={e => setForm({ ...form, funding_amount: e.target.value })} placeholder="e.g. 5,000,000" style={IS} /></div>
                <div><label style={LS}>Currency</label><select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={IS}><option>SAR</option><option>USD</option><option>EUR</option></select></div>
                <div><label style={LS}>Equity Offered</label><input value={form.equity_offered} onChange={e => setForm({ ...form, equity_offered: e.target.value })} placeholder="e.g. 30%" style={IS} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={LS}>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Riyadh" style={IS} /></div>
                <div><label style={LS}>Timeline</label><input value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. Q3 2026" style={IS} /></div>
              </div>
              <div><label style={LS}>Description *</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the opportunity in detail..." style={{ ...IS, minHeight: 80 }} /></div>
              <div><label style={LS}>Key Highlights (press Enter to add)</label>
                <div style={{ display: "flex", gap: 6 }}><input value={highlightInput} onChange={e => setHighlightInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && highlightInput.trim()) { setForm({ ...form, highlights: [...form.highlights, highlightInput.trim()] }); setHighlightInput(""); } }} placeholder="e.g. MOH license approved" style={{ ...IS, flex: 1 }} /><button onClick={() => { if (highlightInput.trim()) { setForm({ ...form, highlights: [...form.highlights, highlightInput.trim()] }); setHighlightInput(""); } }} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#1B7A4A", color: "#fff", cursor: "pointer", fontSize: 12 }}>Add</button></div>
                {form.highlights.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{form.highlights.map((h, i) => <span key={i} style={{ padding: "4px 10px", borderRadius: 6, background: "#E8F5EE", color: "#1B7A4A", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>{h}<button onClick={() => setForm({ ...form, highlights: form.highlights.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B8574", padding: 0 }}>×</button></span>)}</div>}
              </div>
              <div><label style={LS}>Requirements for Investor</label><textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="What are you looking for in a partner?" style={{ ...IS, minHeight: 50 }} /></div>
{(() => { const s = readinessScore(form); return (
                <div style={{ padding: 14, borderRadius: 10, border: `2px solid ${scoreColor(s)}22`, background: `${scoreColor(s)}08` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(s) }}>Investor Readiness Score</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(s) }}>{s}%</span>
                  </div>
                  <div style={{ height: 8, background: "#E8EFE9", borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${s}%`, height: "100%", background: scoreColor(s), borderRadius: 4, transition: "width .3s" }} /></div>
                  <div style={{ fontSize: 10, color: "#6B8574", marginTop: 4 }}>{scoreLabel(s)} -- {s < 80 ? "Add more details to attract investors" : "Great! Your deal looks complete"}</div>
                </div>
              ); })()}
            </div>
            <button onClick={submitDeal} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, marginTop: 12 }}>Post Deal</button>
          </div>}
{view === "detail" && selDeal && <DealDetail deal={selDeal} interests={interests} isOwn={selDeal.user_id === user?.id} isAdmin={isAdmin} canExpress={canExpress} tier={tier} readinessScore={readinessScore} scoreColor={scoreColor} scoreLabel={scoreLabel} onBack={() => { setView("list"); setSelDeal(null); }} onExpress={expressInterest} onDelete={deleteDeal} onUpgrade={() => { onClose(); if (onUpgrade) onUpgrade(); }} />}
{view === "list" && <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {canPost ? <button onClick={() => setView("create")} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Plus size={14} /> Post a Deal</button>
              : <div style={{ flex: 1, padding: "12px 16px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span><Lock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Upgrade to Silver or Gold to post deals</span>
                  <button onClick={() => { onClose(); if (onUpgrade) onUpgrade(); }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#B5A167", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Upgrade</button>
                </div>}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 150px" }}><Search size={13} color="#8FA898" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} /><input placeholder="Search deals..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ ...IS, paddingLeft: 28 }} /></div>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ fontSize: 11, padding: "8px", borderRadius: 8, border: "1px solid #D6E4DB" }}><option value="All">All Sectors</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 11, padding: "8px", borderRadius: 8, border: "1px solid #D6E4DB" }}><option value="All">All Types</option>{DEAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            </div>
{myDeals.length > 0 && <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 6 }}>Your Deals ({myDeals.length})</div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>{myDeals.map(d => <div key={d.id} onClick={() => viewDeal(d)} style={{ minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "2px solid #1B7A4A", background: "#E8F5EE", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23" }}>{d.title}</div>
                <div style={{ fontSize: 10, color: "#6B8574" }}>{d.sector} · <Eye size={9} /> {d.views_count || 0} · <MessageSquare size={9} /> {d.interest_count || 0}</div>
              </div>)}</div>
            </div>}

            {loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !filtered.length ? <div style={{ padding: 40, textAlign: "center" }}><Briefcase size={40} color="#D6E4DB" /><div style={{ marginTop: 8, fontSize: 14, color: "#6B8574" }}>No deals yet</div></div> :
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {filtered.map(d => {
                  const dt = DEAL_TYPES.find(t => t.id === d.deal_type) || DEAL_TYPES[0];
                  const score = readinessScore(d);
                  return (
                    <div key={d.id} onClick={() => viewDeal(d)} style={{ padding: "16px 18px", borderRadius: 12, border: d.is_featured ? "2px solid #B5A167" : "1px solid #D6E4DB", background: d.is_featured ? "#FFFBF0" : "#fff", cursor: "pointer", position: "relative" }}>
                      {d.is_featured && <div style={{ position: "absolute", top: 0, right: 0, background: "#B5A167", color: "#fff", padding: "2px 10px", borderRadius: "0 12px 0 8px", fontSize: 8, fontWeight: 700 }}>FEATURED</div>}
                      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{dt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23", lineHeight: 1.3 }}>{d.title}</div>
                          <div style={{ fontSize: 10, color: "#6B8574", marginTop: 2 }}>{d.user_org || d.user_name} · {d.sector}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, fontSize: 10 }}>
                        {d.city && <span style={{ color: "#6B8574", display: "flex", alignItems: "center", gap: 2 }}><MapPin size={9} />{d.city}</span>}
                        {d.funding_amount && <span style={{ fontWeight: 600, color: "#1B7A4A", background: "#E8F5EE", padding: "1px 6px", borderRadius: 3 }}>{d.funding_amount} {d.currency}</span>}
                        {d.equity_offered && <span style={{ color: "#8B5CF6" }}>{d.equity_offered} equity</span>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#8FA898" }}><span><Eye size={9} /> {d.views_count || 0}</span><span><MessageSquare size={9} /> {d.interest_count || 0}</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 30, height: 4, background: "#E8EFE9", borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", background: scoreColor(score), borderRadius: 2 }} /></div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: scoreColor(score) }}>{score}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>}
          </div>}
        </div>
      </div>
    </div>
  );
}

// Deal Detail sub-component
function DealDetail({ deal, interests, isOwn, isAdmin, canExpress, tier, readinessScore, scoreColor, scoreLabel, onBack, onExpress, onDelete, onUpgrade }) {
  const [msg, setMsg] = useState("");
  const [showInterest, setShowInterest] = useState(false);
  const dt = DEAL_TYPES.find(t => t.id === deal.deal_type) || DEAL_TYPES[0];
  const score = readinessScore(deal);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>← Back</button>
      <div style={{ padding: 18, borderRadius: 12, background: "#FAFBFA", border: "1px solid #D6E4DB", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{dt.icon}</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A2E23", margin: 0 }}>{deal.title}</h3>
            <div style={{ fontSize: 11, color: "#6B8574", marginTop: 4 }}>{deal.user_org || deal.user_name} · {dt.label} · {deal.sector}</div>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: `${scoreColor(score)}10`, border: `2px solid ${scoreColor(score)}30`, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor(score) }}>{score}%</div>
            <div style={{ fontSize: 8, color: scoreColor(score), fontWeight: 600 }}>{scoreLabel(score)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {deal.city && <span style={{ padding: "4px 10px", borderRadius: 6, background: "#E8F5EE", fontSize: 11, color: "#1B7A4A", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{deal.city}{deal.region ? `, ${deal.region}` : ""}</span>}
          {deal.funding_amount && <span style={{ padding: "4px 10px", borderRadius: 6, background: "#E8F5EE", fontSize: 11, fontWeight: 600, color: "#1B7A4A" }}>{deal.funding_amount} {deal.currency}</span>}
          {deal.equity_offered && <span style={{ padding: "4px 10px", borderRadius: 6, background: "#EDE9FE", fontSize: 11, color: "#7C3AED" }}>{deal.equity_offered} equity</span>}
          {deal.timeline && <span style={{ padding: "4px 10px", borderRadius: 6, background: "#DBEAFE", fontSize: 11, color: "#2563EB", display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{deal.timeline}</span>}
        </div>
      </div>
      {deal.description && <div style={{ padding: 16, borderRadius: 10, border: "1px solid #D6E4DB", marginBottom: 12, fontSize: 12, color: "#3D5A47", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{deal.description}</div>}
      {(deal.highlights || []).length > 0 && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 6 }}>Key Highlights</div>{deal.highlights.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12, color: "#3D5A47" }}><CheckCircle size={12} color="#1B7A4A" />{h}</div>)}</div>}
      {deal.requirements && <div style={{ padding: 12, borderRadius: 8, background: "#F9F5EA", border: "1px solid #D4C68E", marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#B5A167", marginBottom: 4 }}>Looking For</div><div style={{ fontSize: 12, color: "#3D5A47" }}>{deal.requirements}</div></div>}
{!isOwn && canExpress && <div style={{ marginBottom: 12 }}>
        {!showInterest ? <button onClick={() => setShowInterest(true)} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Send size={14} /> Express Interest</button>
        : <div style={{ padding: 14, borderRadius: 10, border: "1px solid #D6E4DB" }}>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Introduce yourself and explain your interest..." style={{ ...IS, minHeight: 60, marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}><button onClick={() => { if (msg.trim()) { onExpress(deal, msg); setShowInterest(false); setMsg(""); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#1B7A4A", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Send</button><button onClick={() => setShowInterest(false)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 12 }}>Cancel</button></div>
          </div>}
      </div>}
      {!isOwn && !canExpress && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", marginBottom: 12, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span><Lock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Upgrade to express interest</span>
        <button onClick={onUpgrade} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#B5A167", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Upgrade</button>
      </div>}
{(isOwn || isAdmin) && interests.length > 0 && <div><div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 6 }}>Expressions of Interest ({interests.length})</div>
        {interests.map(i => <div key={i.id} style={{ padding: 10, borderRadius: 8, border: "1px solid #D6E4DB", marginBottom: 4, background: i.status === "new" ? "#FFFBEB" : "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>{i.user_name || i.user_email}</div>
          <div style={{ fontSize: 11, color: "#3D5A47", marginTop: 2 }}>{i.message}</div>
          <div style={{ fontSize: 9, color: "#8FA898", marginTop: 2 }}>{new Date(i.created_at).toLocaleString()}</div>
        </div>)}
      </div>}

      {(isOwn || isAdmin) && <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {isAdmin && <button onClick={() => onDelete(deal.id)} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><Trash2 size={12} /> Delete</button>}
      </div>}
    </div>
  );
}

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
