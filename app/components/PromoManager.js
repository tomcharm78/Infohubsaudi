"use client";
import { useState, useEffect, useMemo } from "react";
import { Tag, Plus, Trash2, Send, CheckCircle, X, Users, Copy, Bell, Eye, Calendar, Percent, Gift, Search, BarChart3 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

// ===== NOTIFICATION BELL (used in header) =====
export function NotificationBell() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifs = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setNotifs(data || []);
  };

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    for (const id of unreadIds) await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const typeColors = { promo: "#B5A167", info: "#3B82F6", system: "#1B7A4A", testimonial: "#8B5CF6" };
  const typeIcons = { promo: "🎁", info: "ℹ️", system: "⚙️", testimonial: "⭐" };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center" }}>
        <Bell size={14} color={unread > 0 ? "#D4C68E" : "rgba(255,255,255,0.6)"} />
        {unread > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#DC3545", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</div>}
      </button>

      {open && <div style={{ position: "absolute", top: 42, right: 0, width: 320, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #D6E4DB", zIndex: 100, maxHeight: 400, overflowY: "auto" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #D6E4DB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23" }}>Notifications</span>
          <div style={{ display: "flex", gap: 6 }}>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 10, color: "#1B7A4A", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>}
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA898" }}><X size={14} /></button>
          </div>
        </div>
        {notifs.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898", fontSize: 12 }}>No notifications</div> :
          notifs.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: "10px 16px", borderBottom: "1px solid #F0F4F1", background: n.is_read ? "#fff" : "#FFFBEB", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>{typeIcons[n.type] || "📌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 700, color: "#1A2E23" }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "#6B8574", marginTop: 2 }}>{n.message}</div>
                  {n.metadata?.code && <div style={{ marginTop: 4, padding: "4px 10px", borderRadius: 6, background: "#F9F5EA", border: "1px solid #D4C68E", display: "inline-block", fontSize: 12, fontWeight: 700, color: "#B5A167", letterSpacing: 1 }}>{n.metadata.code}</div>}
                  <div style={{ fontSize: 9, color: "#8FA898", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", flexShrink: 0, marginTop: 4 }} />}
              </div>
            </div>
          ))
        }
      </div>}
    </div>
  );
}

// ===== PROMO MANAGER (Admin) =====
export default function PromoManager({ onClose }) {
  const { user, isAdmin } = useAuth();
  const [codes, setCodes] = useState([]);
  const [usage, setUsage] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list|create|send
  const [toast, setToast] = useState(null);

  // Create form
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(10);
  const [newType, setNewType] = useState("percentage");
  const [newMaxUses, setNewMaxUses] = useState(0);
  const [newExpiry, setNewExpiry] = useState("");
  const [newTarget, setNewTarget] = useState("all");

  // Send form
  const [sendCode, setSendCode] = useState(null);
  const [sendTo, setSendTo] = useState("all"); // all|tier|individual
  const [sendTier, setSendTier] = useState("basic");
  const [sendEmail, setSendEmail] = useState("");
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchAll = async () => {
    const [{ data: c }, { data: u }, { data: p }] = await Promise.all([
      supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("promo_usage").select("*").order("used_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id,email,full_name,subscription_tier,user_type"),
    ]);
    setCodes(c || []); setUsage(u || []); setProfiles(p || []); setLoading(false);
  };

  const createCode = async () => {
    if (!newCode.trim()) return alert("Code required");
    const { error } = await supabase.from("promo_codes").insert({
      code: newCode.trim().toUpperCase(),
      discount_pct: newType === "percentage" ? newDiscount : 0,
      discount_type: newType,
      discount_value: newDiscount,
      max_uses: newMaxUses,
      target_tier: newTarget,
      is_active: true,
      valid_until: newExpiry || null,
      created_by: user.id,
    });
    if (error) return alert(error.message.includes("unique") ? "Code already exists" : error.message);
    fetchAll(); setView("list"); setNewCode(""); setToast("Promo code created!");
  };

  const toggleCode = async (id, active) => {
    await supabase.from("promo_codes").update({ is_active: !active }).eq("id", id);
    fetchAll(); setToast(active ? "Code deactivated" : "Code activated");
  };

  const deleteCode = async (id) => {
    if (!confirm("Delete this promo code?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    fetchAll(); setToast("Deleted");
  };

  const sendPromo = async () => {
    if (!sendCode) return;
    let targetUsers = [];
    if (sendTo === "all") targetUsers = profiles;
    else if (sendTo === "tier") targetUsers = profiles.filter(p => p.subscription_tier === sendTier);
    else if (sendTo === "individual") targetUsers = profiles.filter(p => p.email === sendEmail);

    if (!targetUsers.length) return alert("No users match your selection");

    const msg = sendMessage || `Use code ${sendCode.code} for ${sendCode.discount_value}${sendCode.discount_type === "percentage" ? "%" : sendCode.discount_type === "free_trial_days" ? " days free" : " USD"} off your subscription!`;

    for (const u of targetUsers) {
      await supabase.from("notifications").insert({
        user_id: u.id,
        title: `🎁 Promo Code: ${sendCode.code}`,
        message: msg,
        type: "promo",
        metadata: { code: sendCode.code, discount: sendCode.discount_value, type: sendCode.discount_type },
      });
    }

    setToast(`Sent to ${targetUsers.length} user(s)!`);
    setView("list"); setSendCode(null);
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setToast(`Copied: ${code}`);
  };

  const usageForCode = (codeText) => usage.filter(u => u.code === codeText);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Tag size={22} color="#D4C68E" />
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>{view === "create" ? "Create Promo Code" : view === "send" ? "Send Promo Code" : "Promo Codes"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
{view === "create" && <div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                <div><label style={LS}>Code *</label><input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. GOLD20" style={IS} /></div>
                <div><label style={LS}>Discount Value</label><input type="number" value={newDiscount} onChange={e => setNewDiscount(Number(e.target.value))} style={IS} /></div>
                <div><label style={LS}>Type</label><select value={newType} onChange={e => setNewType(e.target.value)} style={IS}><option value="percentage">% Off</option><option value="fixed_usd">$ Off</option><option value="free_trial_days">Free Trial Days</option></select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><label style={LS}>Max Uses (0=unlimited)</label><input type="number" value={newMaxUses} onChange={e => setNewMaxUses(Number(e.target.value))} style={IS} /></div>
                <div><label style={LS}>Expires</label><input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={IS} /></div>
                <div><label style={LS}>Target Tier</label><select value={newTarget} onChange={e => setNewTarget(e.target.value)} style={IS}><option value="all">All Tiers</option><option value="basic">Basic Only</option><option value="silver">Silver Only</option><option value="gold">Gold Only</option></select></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={createCode} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Create Code</button>
              <button onClick={() => setView("list")} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>}
{view === "send" && sendCode && <div>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#F9F5EA", border: "1px solid #D4C68E", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Gift size={18} color="#B5A167" />
              <div><div style={{ fontSize: 16, fontWeight: 700, color: "#B5A167", letterSpacing: 2 }}>{sendCode.code}</div>
                <div style={{ fontSize: 10, color: "#8C7B4A" }}>{sendCode.discount_value}{sendCode.discount_type === "percentage" ? "% off" : sendCode.discount_type === "free_trial_days" ? " days free trial" : " USD off"}</div></div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div><label style={LS}>Send To</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["all", `All Users (${profiles.length})`], ["tier", "By Tier"], ["individual", "Individual"]].map(([v, l]) => (
                    <button key={v} onClick={() => setSendTo(v)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: sendTo === v ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: sendTo === v ? "#E8F5EE" : "#fff", color: sendTo === v ? "#1B7A4A" : "#6B8574", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{l}</button>
                  ))}
                </div>
              </div>
              {sendTo === "tier" && <div><label style={LS}>Select Tier</label><select value={sendTier} onChange={e => setSendTier(e.target.value)} style={IS}>
                <option value="basic">Basic ({profiles.filter(p => p.subscription_tier === "basic").length} users)</option>
                <option value="silver">Silver ({profiles.filter(p => p.subscription_tier === "silver").length} users)</option>
                <option value="gold">Gold ({profiles.filter(p => p.subscription_tier === "gold").length} users)</option>
              </select></div>}
              {sendTo === "individual" && <div><label style={LS}>User Email</label><select value={sendEmail} onChange={e => setSendEmail(e.target.value)} style={IS}>
                <option value="">Select user...</option>{profiles.map(p => <option key={p.id} value={p.email}>{p.email} ({p.full_name || p.user_type})</option>)}
              </select></div>}
              <div><label style={LS}>Custom Message (optional)</label><textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} placeholder={`Use code ${sendCode.code} for ${sendCode.discount_value}${sendCode.discount_type === "percentage" ? "%" : ""} off!`} style={{ ...IS, minHeight: 60 }} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={sendPromo} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Send size={14} /> Send Notifications</button>
              <button onClick={() => { setView("list"); setSendCode(null); }} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>}
{view === "list" && <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setView("create")} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Plus size={14} /> Create Code</button>
            </div>

            {loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !codes.length ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>No promo codes yet</div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {codes.map(c => {
                  const uses = usageForCode(c.code);
                  return (
                    <div key={c.id} style={{ padding: "14px 18px", borderRadius: 10, border: c.is_active ? "1px solid #D4C68E" : "1px solid #D6E4DB", background: c.is_active ? "#FFFBF0" : "#F4F6F5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: c.is_active ? "#B5A167" : "#8FA898", letterSpacing: 2, fontFamily: "monospace" }}>{c.code}</div>
                          <button onClick={() => copyCode(c.code)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA898" }}><Copy size={12} /></button>
                        </div>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: c.is_active ? "#E8F5EE" : "#F4F4F5", color: c.is_active ? "#1B7A4A" : "#8FA898" }}>{c.is_active ? "ACTIVE" : "INACTIVE"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#6B8574", marginBottom: 8, flexWrap: "wrap" }}>
                        <span><Percent size={10} /> {c.discount_value}{c.discount_type === "percentage" ? "%" : c.discount_type === "free_trial_days" ? " days" : " USD"} off</span>
                        <span><Users size={10} /> {c.current_uses}/{c.max_uses || "∞"} used</span>
                        {c.valid_until && <span><Calendar size={10} /> Until {new Date(c.valid_until).toLocaleDateString()}</span>}
                        <span>Target: {c.target_tier}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { setSendCode(c); setView("send"); }} style={LBT}><Send size={11} /> Send to Users</button>
                        <button onClick={() => toggleCode(c.id, c.is_active)} style={LBT}>{c.is_active ? "Deactivate" : "Activate"}</button>
                        <button onClick={() => deleteCode(c.id)} style={{ ...LBT, color: "#DC3545", border: "1px solid #DC3545" }}><Trash2 size={11} /></button>
                      </div>
                      {uses.length > 0 && <div style={{ marginTop: 8, fontSize: 9, color: "#8FA898" }}>Recent: {uses.slice(0, 3).map(u => u.user_email).join(", ")}{uses.length > 3 ? ` +${uses.length - 3} more` : ""}</div>}
                    </div>
                  );
                })}
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
const LBT = { padding: "5px 12px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 };
