"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, Search, X, CheckCircle, Star, Crown, Eye, MessageSquare, Flag, Trash2, Pencil, Building2, Briefcase, Heart, Globe, MapPin, DollarSign, Users, ChevronRight, Mail, Phone, ExternalLink, AlertTriangle, Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { TIERS } from "../lib/subscription";

const CARD_TYPES = {
  investor: { icon: "💰", label: "Investor", color: "#1B7A4A", bg: "#E8F5EE" },
  seeker: { icon: "🏥", label: "Seeker", color: "#3B82F6", bg: "#DBEAFE" },
  partner: { icon: "🤝", label: "Partner", color: "#8B5CF6", bg: "#EDE9FE" },
};

const INV_TYPES = ["Private Equity", "Venture Capital", "Angel Investor", "Family Office", "Sovereign Wealth Fund", "CSR Fund", "Corporate VC", "Impact Fund"];
const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Late Stage", "Buyout"];
const SECTORS = ["Hospitals", "Clinics", "Pharma", "MedTech", "Digital Health", "Home Healthcare", "Dental", "Eye Care", "Mental Health", "Rehabilitation", "Laboratory"];
const IMPACT = ["Primary Healthcare", "Maternal Health", "Child Health", "Chronic Disease", "Mental Wellness", "Health Education", "Rural Access", "Digital Inclusion"];

// ===== CARD DISPLAY =====
function MarketCard({ card, onView, onInquire, isOwn, isAdmin, currentTier }) {
  const ct = CARD_TYPES[card.card_type] || CARD_TYPES.investor;
  const isGold = card.subscription_tier === "gold";
  const isSilver = card.subscription_tier === "silver";

  return (
    <div onClick={() => onView(card)} style={{
      background: "#fff", borderRadius: 14, padding: 20, cursor: "pointer", transition: "all .2s",
      border: isGold ? "2px solid #B5A167" : card.is_flagged ? "2px solid #DC3545" : "1px solid #D6E4DB",
      boxShadow: isGold ? "0 4px 16px rgba(181,161,103,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isGold ? "0 4px 16px rgba(181,161,103,0.15)" : "0 1px 3px rgba(0,0,0,0.04)"; }}>
{isGold && <div style={{ position: "absolute", top: 0, right: 0, background: "linear-gradient(135deg,#B5A167,#D4C68E)", padding: "4px 12px 4px 16px", borderRadius: "0 0 0 12px", display: "flex", alignItems: "center", gap: 3 }}>
        <Crown size={10} color="#fff" /><span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>FEATURED</span>
      </div>}
      {card.is_flagged && <div style={{ position: "absolute", top: 0, left: 0, background: "#DC3545", padding: "2px 8px", borderRadius: "0 0 8px 0" }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>⚠ FLAGGED</span>
      </div>}
<div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: ct.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {card.logo_text || ct.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2E23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.company_name}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: ct.bg, color: ct.color }}>{ct.label}</span>
            {isGold && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#F9F5EA", color: "#B5A167" }}>GOLD</span>}
            {isSilver && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#F1F5F9", color: "#94A3B8" }}>SILVER</span>}
          </div>
          {card.tagline && <div style={{ fontSize: 11, color: "#6B8574", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.tagline}</div>}
        </div>
      </div>
<div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {card.city && <span style={{ fontSize: 10, color: "#6B8574", display: "flex", alignItems: "center", gap: 2 }}><MapPin size={10} />{card.city}, {card.country}</span>}
        {card.card_type === "investor" && card.aum && <span style={{ fontSize: 10, fontWeight: 600, color: "#1B7A4A", background: "#E8F5EE", padding: "2px 6px", borderRadius: 4 }}>AUM: {card.aum}</span>}
        {card.card_type === "seeker" && card.funding_needed && <span style={{ fontSize: 10, fontWeight: 600, color: "#3B82F6", background: "#DBEAFE", padding: "2px 6px", borderRadius: 4 }}>Need: {card.funding_needed}</span>}
        {card.card_type === "partner" && card.funding_capacity && <span style={{ fontSize: 10, fontWeight: 600, color: "#8B5CF6", background: "#EDE9FE", padding: "2px 6px", borderRadius: 4 }}>Capacity: {card.funding_capacity}</span>}
      </div>
<div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 10 }}>
        {(card.investment_focus || card.impact_focus || []).slice(0, 3).map((f, i) => (
          <span key={i} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "#F4F6F5", color: "#3D5A47" }}>{f}</span>
        ))}
        {(card.investment_focus || card.impact_focus || []).length > 3 && <span style={{ fontSize: 9, color: "#8FA898" }}>+{(card.investment_focus || card.impact_focus || []).length - 3}</span>}
      </div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #E8EFE9" }}>
        <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#8FA898" }}>
          <span><Eye size={10} /> {card.views_count || 0}</span>
          <span><MessageSquare size={10} /> {card.inquiries_count || 0}</span>
        </div>
        {!isOwn && <button onClick={e => { e.stopPropagation(); onInquire(card); }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: ct.color, color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          <MessageSquare size={11} /> Inquire
        </button>}
        {isOwn && <span style={{ fontSize: 10, color: "#1B7A4A", fontWeight: 600 }}>Your Card</span>}
      </div>
    </div>
  );
}

// ===== CARD FORM =====
function CardForm({ existing, cardType, onSave, onCancel }) {
  const [form, setForm] = useState(existing || { card_type: cardType, company_name: "", tagline: "", description: "", website: "", email: "", phone: "", city: "", country: "Saudi Arabia", aum: "", investment_focus: [], deal_size_min: "", deal_size_max: "", preferred_stages: [], investor_type: "", funding_needed: "", sector: "", project_stage: "", revenue: "", team_size: 0, pitch_summary: "", impact_focus: [], funding_capacity: "", regions_active: [], partnerships_seeking: "", portfolio_highlights: [], logo_text: "" });
  const u = (k, v) => setForm({ ...form, [k]: v });
  const toggleArr = (k, v) => { const arr = form[k] || []; u(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]); };
  const ct = CARD_TYPES[form.card_type] || CARD_TYPES.investor;
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.company_name.trim()) return alert("Company name required");
    setSaving(true); await onSave(form); setSaving(false);
  };

  return (
    <div style={{ maxHeight: "72vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: ct.bg }}>
        <span style={{ fontSize: 24 }}>{ct.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: ct.color }}>{ct.label} Card</span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
<div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 10 }}>
          <div><label style={LS}>Company / Organization Name *</label><input value={form.company_name} onChange={e => u("company_name", e.target.value)} style={IS} /></div>
          <div><label style={LS}>Logo (2-3 letters)</label><input value={form.logo_text} onChange={e => u("logo_text", e.target.value)} placeholder="e.g. ARC" maxLength={4} style={IS} /></div>
        </div>
        <div><label style={LS}>Tagline</label><input value={form.tagline} onChange={e => u("tagline", e.target.value)} placeholder="One-line pitch..." style={IS} /></div>
        <div><label style={LS}>Description</label><textarea value={form.description} onChange={e => u("description", e.target.value)} placeholder="About your organization..." style={{ ...IS, minHeight: 60 }} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={LS}>City</label><input value={form.city} onChange={e => u("city", e.target.value)} placeholder="Riyadh" style={IS} /></div>
          <div><label style={LS}>Country</label><input value={form.country} onChange={e => u("country", e.target.value)} style={IS} /></div>
          <div><label style={LS}>Website</label><input value={form.website} onChange={e => u("website", e.target.value)} placeholder="https://..." style={IS} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={LS}>Contact Email</label><input value={form.email} onChange={e => u("email", e.target.value)} style={IS} /></div>
          <div><label style={LS}>Contact Phone</label><input value={form.phone} onChange={e => u("phone", e.target.value)} style={IS} /></div>
        </div>
{form.card_type === "investor" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={LS}>AUM</label><input value={form.aum} onChange={e => u("aum", e.target.value)} placeholder="$500M" style={IS} /></div>
            <div><label style={LS}>Deal Size Min</label><input value={form.deal_size_min} onChange={e => u("deal_size_min", e.target.value)} placeholder="$1M" style={IS} /></div>
            <div><label style={LS}>Deal Size Max</label><input value={form.deal_size_max} onChange={e => u("deal_size_max", e.target.value)} placeholder="$50M" style={IS} /></div>
          </div>
          <div><label style={LS}>Investor Type</label><select value={form.investor_type} onChange={e => u("investor_type", e.target.value)} style={IS}><option value="">Select...</option>{INV_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={LS}>Investment Focus (click to select)</label><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{SECTORS.map(s => <button key={s} onClick={() => toggleArr("investment_focus", s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: (form.investment_focus || []).includes(s) ? `2px solid ${ct.color}` : "1px solid #D6E4DB", background: (form.investment_focus || []).includes(s) ? ct.bg : "#fff", color: (form.investment_focus || []).includes(s) ? ct.color : "#6B8574", fontWeight: 600 }}>{s}</button>)}</div></div>
          <div><label style={LS}>Preferred Stages</label><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{STAGES.map(s => <button key={s} onClick={() => toggleArr("preferred_stages", s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: (form.preferred_stages || []).includes(s) ? `2px solid ${ct.color}` : "1px solid #D6E4DB", background: (form.preferred_stages || []).includes(s) ? ct.bg : "#fff", color: (form.preferred_stages || []).includes(s) ? ct.color : "#6B8574", fontWeight: 600 }}>{s}</button>)}</div></div>
        </div>}
{form.card_type === "seeker" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={LS}>Funding Needed</label><input value={form.funding_needed} onChange={e => u("funding_needed", e.target.value)} placeholder="$2M" style={IS} /></div>
            <div><label style={LS}>Current Revenue</label><input value={form.revenue} onChange={e => u("revenue", e.target.value)} placeholder="$500K/yr" style={IS} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={LS}>Sector</label><select value={form.sector} onChange={e => u("sector", e.target.value)} style={IS}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label style={LS}>Project Stage</label><select value={form.project_stage} onChange={e => u("project_stage", e.target.value)} style={IS}><option value="">Select...</option>{STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label style={LS}>Team Size</label><input type="number" value={form.team_size} onChange={e => u("team_size", parseInt(e.target.value) || 0)} style={IS} /></div>
          <div><label style={LS}>Pitch Summary</label><textarea value={form.pitch_summary} onChange={e => u("pitch_summary", e.target.value)} placeholder="What makes your project unique..." style={{ ...IS, minHeight: 60 }} /></div>
        </div>}
{form.card_type === "partner" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={LS}>Funding Capacity</label><input value={form.funding_capacity} onChange={e => u("funding_capacity", e.target.value)} placeholder="$10M/yr" style={IS} /></div>
            <div><label style={LS}>Partnerships Seeking</label><input value={form.partnerships_seeking} onChange={e => u("partnerships_seeking", e.target.value)} placeholder="Operators, co-funders..." style={IS} /></div>
          </div>
          <div><label style={LS}>Impact Focus (click to select)</label><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{IMPACT.map(s => <button key={s} onClick={() => toggleArr("impact_focus", s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: (form.impact_focus || []).includes(s) ? `2px solid ${ct.color}` : "1px solid #D6E4DB", background: (form.impact_focus || []).includes(s) ? ct.bg : "#fff", color: (form.impact_focus || []).includes(s) ? ct.color : "#6B8574", fontWeight: 600 }}>{s}</button>)}</div></div>
        </div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: saving ? "#8FA898" : `linear-gradient(135deg,${ct.color},${ct.color}CC)`, color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 700 }}>
          {saving ? "Saving..." : existing?.id ? "Update Card" : "Create Card"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ===== INQUIRY MODAL =====
function InquiryModal({ card, userId, userEmail, userName, onClose, onSent }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const ct = CARD_TYPES[card.card_type];
  const send = async () => {
    if (!msg.trim()) return alert("Please write a message");
    setSending(true);
    await supabase.from("card_inquiries").insert({ card_id: card.id, from_user_id: userId, from_email: userEmail, from_name: userName, message: msg });
    await supabase.from("marketplace_cards").update({ inquiries_count: (card.inquiries_count || 0) + 1 }).eq("id", card.id);
    setSending(false); onSent();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 460, width: "90%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>{ct.icon}</span>
          <div><div style={{ fontSize: 14, fontWeight: 700 }}>Contact {card.company_name}</div><div style={{ fontSize: 11, color: "#6B8574" }}>{ct.label} · {card.city}</div></div>
        </div>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder={`Introduce yourself and explain why you'd like to connect with ${card.company_name}...`} style={{ ...IS, minHeight: 100 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={send} disabled={sending} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: ct.color, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Send size={14} /> {sending ? "Sending..." : "Send Inquiry"}</button>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN MARKETPLACE =====
export default function Marketplace({ onClose }) {
  const { user, profile, isAdmin } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("browse"); // browse|create|edit|detail
  const [activeDir, setActiveDir] = useState("investor"); // investor|seeker|partner
  const [searchQ, setSearchQ] = useState("");
  const [selCard, setSelCard] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [inquiryCard, setInquiryCard] = useState(null);
  const [myInquiries, setMyInquiries] = useState([]);
  const [toast, setToast] = useState(null);

  const tier = profile?.subscription_tier || "basic";
  const userType = profile?.user_type || "investor";
  const canCreateMultiple = tier === "silver" || tier === "gold" || isAdmin;

  useEffect(() => { fetchCards(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchCards = async () => {
    const { data } = await supabase.from("marketplace_cards").select("*").eq("is_active", true).order("is_featured", { ascending: false }).order("is_priority", { ascending: false }).order("created_at", { ascending: false });
    setCards(data || []); setLoading(false);
  };

  const myCards = useMemo(() => cards.filter(c => c.user_id === user?.id), [cards, user]);
  const canCreateNew = canCreateMultiple || myCards.length === 0;

  const filtered = useMemo(() => {
    let f = cards.filter(c => c.card_type === activeDir);
    if (searchQ) { const q = searchQ.toLowerCase(); f = f.filter(c => c.company_name.toLowerCase().includes(q) || (c.tagline || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)); }
    // Sort: Gold featured first, then Silver, then Basic
    f.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      if (a.subscription_tier === "gold" && b.subscription_tier !== "gold") return -1;
      if (b.subscription_tier === "gold" && a.subscription_tier !== "gold") return 1;
      if (a.subscription_tier === "silver" && b.subscription_tier === "basic") return -1;
      if (b.subscription_tier === "silver" && a.subscription_tier === "basic") return 1;
      return 0;
    });
    return f;
  }, [cards, activeDir, searchQ]);

  const saveCard = async (form) => {
    const isGold = tier === "gold";
    const data = { ...form, user_id: user.id, user_email: user.email, subscription_tier: tier, is_featured: isGold, is_priority: isGold || tier === "silver", updated_at: new Date().toISOString() };
    if (form.id) {
      await supabase.from("marketplace_cards").update(data).eq("id", form.id);
    } else {
      await supabase.from("marketplace_cards").insert(data);
    }
    fetchCards(); setView("browse"); setEditCard(null); setToast(form.id ? "Card updated!" : "Card created & live!");
  };

  const flagCard = async (id, reason) => {
    await supabase.from("marketplace_cards").update({ is_flagged: true, flag_reason: reason || "Flagged by admin" }).eq("id", id);
    fetchCards(); setToast("Card flagged");
  };

  const removeCard = async (id) => {
    if (!confirm("Remove this card?")) return;
    await supabase.from("marketplace_cards").update({ is_active: false }).eq("id", id);
    fetchCards(); setToast("Card removed");
  };

  const deleteCard = async (id) => {
    if (!confirm("Permanently delete?")) return;
    await supabase.from("card_inquiries").delete().eq("card_id", id);
    await supabase.from("marketplace_cards").delete().eq("id", id);
    fetchCards(); setSelCard(null); setToast("Deleted");
  };

  const viewCard = async (card) => {
    // Increment views
    await supabase.from("marketplace_cards").update({ views_count: (card.views_count || 0) + 1 }).eq("id", card.id);
    // Fetch inquiries if own card
    if (card.user_id === user?.id) {
      const { data } = await supabase.from("card_inquiries").select("*").eq("card_id", card.id).order("created_at", { ascending: false });
      setMyInquiries(data || []);
    }
    setSelCard({ ...card, views_count: (card.views_count || 0) + 1 });
    setView("detail");
  };

  const dirCounts = useMemo(() => ({
    investor: cards.filter(c => c.card_type === "investor").length,
    seeker: cards.filter(c => c.card_type === "seeker").length,
    partner: cards.filter(c => c.card_type === "partner").length,
  }), [cards]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}
      {inquiryCard && <InquiryModal card={inquiryCard} userId={user.id} userEmail={user.email} userName={profile?.full_name || ""} onClose={() => setInquiryCard(null)} onSent={() => { setInquiryCard(null); setToast("Inquiry sent!"); }} />}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
<div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Building2 size={22} color="#D4C68E" />
            <div><h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>{view === "create" ? "Create Card" : view === "edit" ? "Edit Card" : view === "detail" ? selCard?.company_name : "Marketplace"}</h2>
              <div style={{ color: "#D4C68E", fontSize: 10 }}>{cards.length} listings · {dirCounts.investor} investors · {dirCounts.seeker} seekers · {dirCounts.partner} partners</div></div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
{view === "create" && <CardForm cardType={activeDir} onSave={saveCard} onCancel={() => setView("browse")} />}
          {view === "edit" && editCard && <CardForm existing={editCard} cardType={editCard.card_type} onSave={saveCard} onCancel={() => { setView("browse"); setEditCard(null); }} />}
{view === "detail" && selCard && <div>
            <button onClick={() => { setView("browse"); setSelCard(null); }} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>← Back</button>
            <MarketCard card={selCard} onView={() => {}} onInquire={setInquiryCard} isOwn={selCard.user_id === user?.id} isAdmin={isAdmin} currentTier={tier} />
{selCard.description && <div style={{ marginTop: 14, padding: 16, borderRadius: 10, border: "1px solid #D6E4DB", background: "#FAFBFA", fontSize: 12, color: "#3D5A47", lineHeight: 1.7 }}>{selCard.description}</div>}
<div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              {selCard.email && <a href={`mailto:${selCard.email}`} style={{ fontSize: 11, color: "#1B7A4A", display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} />{selCard.email}</a>}
              {selCard.phone && <span style={{ fontSize: 11, color: "#6B8574", display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{selCard.phone}</span>}
              {selCard.website && <a href={selCard.website} target="_blank" style={{ fontSize: 11, color: "#3B82F6", display: "flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} />{selCard.website}</a>}
            </div>
{selCard.user_id === user?.id && myInquiries.length > 0 && <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>Inquiries ({myInquiries.length})</div>
              {myInquiries.map(inq => (
                <div key={inq.id} style={{ padding: 12, borderRadius: 8, border: "1px solid #D6E4DB", marginBottom: 6, background: inq.status === "new" ? "#FFFBEB" : "#fff" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>{inq.from_name || inq.from_email}</div>
                  <div style={{ fontSize: 11, color: "#3D5A47", marginTop: 4 }}>{inq.message}</div>
                  <div style={{ fontSize: 9, color: "#8FA898", marginTop: 4 }}>{new Date(inq.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>}
<div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              {selCard.user_id === user?.id && <button onClick={() => { setEditCard(selCard); setView("edit"); }} style={LBT}><Pencil size={12} /> Edit</button>}
              {isAdmin && !selCard.is_flagged && <button onClick={() => flagCard(selCard.id, "Admin review")} style={{ ...LBT, color: "#D97706", border: "1px solid #D97706" }}><Flag size={12} /> Flag</button>}
              {isAdmin && <button onClick={() => removeCard(selCard.id)} style={{ ...LBT, color: "#DC3545", border: "1px solid #DC3545" }}><Trash2 size={12} /> Remove</button>}
              {(isAdmin || selCard.user_id === user?.id) && <button onClick={() => deleteCard(selCard.id)} style={{ ...LBT, color: "#DC3545", border: "1px solid #DC3545" }}><Trash2 size={12} /> Delete</button>}
            </div>
          </div>}
{view === "browse" && <div>
<div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {Object.entries(CARD_TYPES).map(([k, v]) => (
                <button key={k} onClick={() => setActiveDir(k)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: activeDir === k ? `2px solid ${v.color}` : "1px solid #D6E4DB", background: activeDir === k ? v.bg : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{v.icon}</span>
                  <div style={{ textAlign: "left" }}><div style={{ fontSize: 12, fontWeight: 700, color: activeDir === k ? v.color : "#6B8574" }}>{v.label}s</div>
                    <div style={{ fontSize: 10, color: "#8FA898" }}>{dirCounts[k]} listed</div></div>
                </button>
              ))}
            </div>
<div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ position: "relative", flex: 1 }}><Search size={13} color="#8FA898" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input placeholder="Search cards..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ ...IS, paddingLeft: 30 }} /></div>
              {canCreateNew && <button onClick={() => setView("create")} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: CARD_TYPES[activeDir].color, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Plus size={14} /> Create Card</button>}
              {!canCreateNew && <div style={{ fontSize: 10, color: "#D97706", padding: "10px", display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Upgrade to Silver/Gold for more cards</div>}
            </div>
{myCards.length > 0 && <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 6 }}>Your Cards ({myCards.length})</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
                {myCards.map(c => <div key={c.id} onClick={() => viewCard(c)} style={{ minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "2px solid #1B7A4A", background: "#E8F5EE", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E23" }}>{c.company_name}</div>
                  <div style={{ fontSize: 10, color: "#6B8574" }}>{CARD_TYPES[c.card_type]?.label} · <Eye size={9} /> {c.views_count || 0} · <MessageSquare size={9} /> {c.inquiries_count || 0}</div>
                </div>)}
              </div>
            </div>}
{loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !filtered.length ? <div style={{ padding: 40, textAlign: "center", color: "#8FA898" }}>
                <Building2 size={40} color="#D6E4DB" /><div style={{ marginTop: 8, fontSize: 14, color: "#6B8574" }}>No {CARD_TYPES[activeDir].label.toLowerCase()} cards yet</div>
                <div style={{ fontSize: 12, color: "#8FA898", marginTop: 4 }}>Be the first to create one!</div>
              </div> :
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {filtered.map(c => <MarketCard key={c.id} card={c} onView={viewCard} onInquire={setInquiryCard} isOwn={c.user_id === user?.id} isAdmin={isAdmin} currentTier={tier} />)}
              </div>
            }
          </div>}
        </div>
      </div>
    </div>
  );
}

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
const LBT = { padding: "6px 12px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 };
