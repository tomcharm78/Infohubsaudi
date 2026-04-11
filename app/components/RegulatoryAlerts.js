"use client";
import { useState, useEffect, useMemo } from "react";
import { Bell, Plus, AlertTriangle, Shield, CheckCircle, X, Trash2, Clock, Globe, ExternalLink, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const ENTITIES = ["MISA","MOH","SFDA","SIDF","MODON","Monsha'at","MoC","Balady","SCFHS","ZATCA","CCHI","NUPCO","MOFA","SRCA","Cabinet"];
const CATEGORIES = {
  new_regulation: { label: "New Regulation", icon: "📋", color: "#3B82F6", bg: "#DBEAFE" },
  amendment: { label: "Amendment", icon: "✏️", color: "#D97706", bg: "#FEF3C7" },
  deadline: { label: "Deadline", icon: "⏰", color: "#DC2626", bg: "#FEF2F2" },
  announcement: { label: "Announcement", icon: "📢", color: "#1B7A4A", bg: "#E8F5EE" },
  opportunity: { label: "Opportunity", icon: "🌟", color: "#B5A167", bg: "#F9F5EA" },
  warning: { label: "Warning", icon: "⚠️", color: "#DC2626", bg: "#FEF2F2" },
};

// Banner component for dashboard
export function AlertsBanner() {
  const [alerts, setAlerts] = useState([]);
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    supabase.from("regulatory_alerts").select("*").eq("is_active", true).eq("is_urgent", true).order("created_at", { ascending: false }).limit(5).then(({ data }) => setAlerts(data || []));
  }, []);
  useEffect(() => { if (alerts.length <= 1) return; const i = setInterval(() => setCurrent(p => (p + 1) % alerts.length), 6000); return () => clearInterval(i); }, [alerts.length]);
  if (!alerts.length) return null;
  const a = alerts[current]; const cat = CATEGORIES[a.category] || CATEGORIES.announcement;
  return (
    <div style={{ background: cat.bg, border: `1px solid ${cat.color}33`, borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <span style={{ fontSize: 18 }}>{cat.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{a.entity}: {a.title}</div>
        <div style={{ fontSize: 10, color: "#6B8574" }}>{a.summary?.slice(0, 100)}{a.summary?.length > 100 ? "..." : ""}</div>
      </div>
      {a.is_urgent && <span style={{ padding: "2px 8px", borderRadius: 4, background: "#DC3545", color: "#fff", fontSize: 8, fontWeight: 700 }}>URGENT</span>}
    </div>
  );
}

// Full alerts manager
export default function RegulatoryAlerts({ onClose }) {
  const { user, profile, isAdmin } = useAuth();
  const tier = profile?.subscription_tier || "basic";
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [toast, setToast] = useState(null);
  const [filterEntity, setFilterEntity] = useState("All");
  const [filterCat, setFilterCat] = useState("All");

  // Form
  const [form, setForm] = useState({ title: "", entity: "MOH", category: "announcement", summary: "", impact: "", source_url: "", effective_date: "", is_urgent: false });

  useEffect(() => { fetchAlerts(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchAlerts = async () => { const { data } = await supabase.from("regulatory_alerts").select("*").eq("is_active", true).order("created_at", { ascending: false }); setAlerts(data || []); setLoading(false); };

  const filtered = useMemo(() => {
    let f = alerts;
    if (filterEntity !== "All") f = f.filter(a => a.entity === filterEntity);
    if (filterCat !== "All") f = f.filter(a => a.category === filterCat);
    return f;
  }, [alerts, filterEntity, filterCat]);

  const createAlert = async () => {
    if (!form.title.trim() || !form.entity) return alert("Title and entity required");
    await supabase.from("regulatory_alerts").insert({ ...form, created_by: user.id });
    // Notify Gold users if urgent
    if (form.is_urgent) {
      const { data: golds } = await supabase.from("profiles").select("id").in("subscription_tier", ["gold"]);
      for (const g of (golds || [])) {
        await supabase.from("notifications").insert({ user_id: g.id, title: `⚠️ Urgent: ${form.entity} -- ${form.title}`, message: form.summary?.slice(0, 200) || "", type: "system" });
      }
    }
    setToast("Alert published!"); setView("list"); setForm({ title: "", entity: "MOH", category: "announcement", summary: "", impact: "", source_url: "", effective_date: "", is_urgent: false }); fetchAlerts();
  };

  const deleteAlert = async (id) => { if (!confirm("Delete?")) return; await supabase.from("regulatory_alerts").update({ is_active: false }).eq("id", id); fetchAlerts(); setToast("Removed"); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}
      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Bell size={22} color="#D4C68E" /><div><h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>Regulatory Alerts</h2><div style={{ color: "#D4C68E", fontSize: 10 }}>{alerts.length} alerts · Government regulation updates</div></div></div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
{view === "create" && isAdmin && <div>
            <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>← Back</button>
            <div style={{ display: "grid", gap: 12 }}>
              <div><label style={LS}>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. New MOH Hospital Licensing Requirements 2026" style={IS} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><label style={LS}>Entity *</label><select value={form.entity} onChange={e => setForm({ ...form, entity: e.target.value })} style={IS}>{ENTITIES.map(e => <option key={e}>{e}</option>)}</select></div>
                <div><label style={LS}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={IS}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                <div><label style={LS}>Effective Date</label><input type="date" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })} style={IS} /></div>
              </div>
              <div><label style={LS}>Summary</label><textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief summary of the regulation change..." style={{ ...IS, minHeight: 60 }} /></div>
              <div><label style={LS}>Impact on Investors (Gold members see this)</label><textarea value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} placeholder="How this affects healthcare investors..." style={{ ...IS, minHeight: 50 }} /></div>
              <div><label style={LS}>Source URL</label><input value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." style={IS} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_urgent} onChange={e => setForm({ ...form, is_urgent: e.target.checked })} />
                <span style={{ fontWeight: 600, color: "#DC3545" }}>⚠️ Mark as Urgent (notifies all Gold members immediately)</span>
              </label>
            </div>
            <button onClick={createAlert} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, marginTop: 12 }}>Publish Alert</button>
          </div>}
{view === "list" && <div>
            {isAdmin && <button onClick={() => setView("create")} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 14 }}><Plus size={14} /> Create Alert</button>}

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={{ fontSize: 11, padding: "8px", borderRadius: 8, border: "1px solid #D6E4DB" }}><option value="All">All Entities</option>{ENTITIES.map(e => <option key={e}>{e}</option>)}</select>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ fontSize: 11, padding: "8px", borderRadius: 8, border: "1px solid #D6E4DB" }}><option value="All">All Categories</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>

            {loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !filtered.length ? <div style={{ padding: 40, textAlign: "center" }}><Bell size={40} color="#D6E4DB" /><div style={{ marginTop: 8, fontSize: 14, color: "#6B8574" }}>No alerts yet</div></div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(a => {
                  const cat = CATEGORIES[a.category] || CATEGORIES.announcement;
                  return (
                    <div key={a.id} style={{ padding: "14px 18px", borderRadius: 10, border: a.is_urgent ? "2px solid #DC3545" : `1px solid ${cat.color}22`, background: a.is_urgent ? "#FEF2F2" : "#FAFBFA" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 20 }}>{cat.icon}</span>
                          <div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#E8F5EE", color: "#1B7A4A" }}>{a.entity}</span>
                              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: cat.bg, color: cat.color }}>{cat.label}</span>
                              {a.is_urgent && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#DC3545", color: "#fff" }}>URGENT</span>}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23", marginTop: 4 }}>{a.title}</div>
                          </div>
                        </div>
                        {a.effective_date && <span style={{ fontSize: 9, color: "#6B8574", flexShrink: 0, display: "flex", alignItems: "center", gap: 2 }}><Clock size={9} />{a.effective_date}</span>}
                      </div>
                      {a.summary && <div style={{ fontSize: 12, color: "#3D5A47", lineHeight: 1.6, marginBottom: 6 }}>{a.summary}</div>}
                      {a.impact && (tier === "gold" || isAdmin) && <div style={{ padding: "8px 12px", borderRadius: 6, background: "#F9F5EA", border: "1px solid #D4C68E", marginBottom: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#B5A167", marginBottom: 2 }}>IMPACT ANALYSIS (Gold)</div>
                        <div style={{ fontSize: 11, color: "#3D5A47" }}>{a.impact}</div>
                      </div>}
                      {a.impact && tier !== "gold" && !isAdmin && <div style={{ padding: "6px 12px", borderRadius: 6, background: "#F4F6F5", marginBottom: 6, fontSize: 10, color: "#8FA898" }}>🔒 Impact analysis available for Gold members</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {a.source_url && <a href={a.source_url} target="_blank" rel="noopener" style={{ fontSize: 10, color: "#3B82F6", display: "flex", alignItems: "center", gap: 2 }}><ExternalLink size={10} />Source</a>}
                        </div>
                        {isAdmin && <button onClick={() => deleteAlert(a.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", fontSize: 9 }}><Trash2 size={10} /></button>}
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

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
