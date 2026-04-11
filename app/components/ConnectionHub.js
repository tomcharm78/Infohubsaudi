"use client";
import { useState, useEffect, useMemo } from "react";
import { Link2, Send, CheckCircle, X, Clock, Users, MessageSquare, Shield, Search, ArrowRight, ArrowUp, Eye, Trash2, Check, XCircle, UserPlus, Building2, Crown, Star, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const STATUS_MAP = {
  pending: { label: "Pending Review", color: "#D97706", bg: "#FEF3C7", icon: "⏳" },
  approved: { label: "Approved", color: "#3B82F6", bg: "#DBEAFE", icon: "✅" },
  introduced: { label: "Introduced", color: "#1B7A4A", bg: "#E8F5EE", icon: "🤝" },
  rejected: { label: "Declined", color: "#DC3545", bg: "#FEF2F2", icon: "❌" },
  completed: { label: "Completed", color: "#6B8574", bg: "#F4F6F5", icon: "✔️" },
  direct: { label: "Direct Message", color: "#3B82F6", bg: "#DBEAFE", icon: "💬" },
};

const TYPE_ICONS = { investor: "💰", seeker: "🏥", partner: "🤝" };
const TYPE_LABELS = { investor: "Investor", seeker: "Seeker", partner: "Partner" };

export default function ConnectionHub({ onClose, onUpgrade }) {
  const { user, profile, isAdmin } = useAuth();
  const tier = profile?.subscription_tier || "basic";
  const isGold = tier === "gold" || isAdmin;
  const isSilver = tier === "silver";
  const canCommunicate = isSilver || isGold;

  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");

  // Request form
  const [toUserId, setToUserId] = useState("");
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [mode, setMode] = useState("direct"); // direct | facilitator

  // Admin action
  const [adminNote, setAdminNote] = useState("");
  const [actionReq, setActionReq] = useState(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const fetchAll = async () => {
    const [{ data: r }, { data: u }] = await Promise.all([
      supabase.from("connection_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,email,full_name,organization,user_type,subscription_tier"),
    ]);
    setRequests(r || []); setAllUsers(u || []); setLoading(false);
  };

  const myRequests = useMemo(() => requests.filter(r => r.from_user_id === user?.id || r.to_user_id === user?.id), [requests, user]);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  const filtered = useMemo(() => {
    let list = isAdmin ? requests : myRequests;
    if (filterStatus !== "All") list = list.filter(r => r.status === filterStatus);
    if (searchQ) { const q = searchQ.toLowerCase(); list = list.filter(r => r.from_name?.toLowerCase().includes(q) || r.to_name?.toLowerCase().includes(q) || r.from_email?.toLowerCase().includes(q) || r.to_email?.toLowerCase().includes(q)); }
    return list;
  }, [requests, myRequests, filterStatus, searchQ, isAdmin]);

  const searchableUsers = useMemo(() => {
    if (!userSearch) return [];
    const q = userSearch.toLowerCase();
    return allUsers.filter(u => u.id !== user?.id && (u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.organization?.toLowerCase().includes(q))).slice(0, 10);
  }, [allUsers, userSearch, user]);

  const submitRequest = async () => {
    if (!toUserId) return alert("Please select who you want to connect with");
    if (!message.trim()) return alert("Please write a message");
    const toUser = allUsers.find(u => u.id === toUserId);
    if (!toUser) return;

    const isDirect = mode === "direct";
    const status = isDirect ? "direct" : "pending";

    await supabase.from("connection_requests").insert({
      from_user_id: user.id, from_email: user.email,
      from_name: profile?.full_name || user.email, from_org: profile?.organization || "",
      from_user_type: profile?.user_type || "investor",
      to_user_id: toUser.id, to_email: toUser.email,
      to_name: toUser.full_name || toUser.email, to_org: toUser.organization || "",
      to_user_type: toUser.user_type || "",
      message, status,
    });

    if (isDirect) {
      // Direct message → notify the recipient immediately with sender's details
      await supabase.from("notifications").insert({
        user_id: toUser.id,
        title: `💬 Message from ${profile?.full_name || user.email}`,
        message: `${message}\n\nContact: ${user.email}${profile?.organization ? ` · ${profile.organization}` : ""}`,
        type: "info",
        metadata: { from_email: user.email, from_name: profile?.full_name, connection_type: "direct" },
      });
      // Confirm to sender
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Message Sent",
        message: `Your message to ${toUser.full_name || toUser.email} has been delivered. They can see your contact details.`,
        type: "info",
      });
      setToast("Message sent directly! They'll see your contact info.");
    } else {
      // Facilitator → notify admin + confirm to sender
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Facilitation Request Submitted",
        message: `Your request to connect with ${toUser.full_name || toUser.email} has been sent to our team. They will facilitate the introduction.`,
        type: "info",
      });
      setToast("Facilitation request sent! Our team will handle the introduction.");
    }

    setView("list"); setToUserId(""); setMessage(""); setUserSearch(""); setMode("direct");
    fetchAll();
  };

  // Admin actions
  const handleAction = async (reqId, action) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const updates = { status: action, handled_by: user.id, handled_at: new Date().toISOString() };
    if (adminNote) updates.admin_note = adminNote;
    await supabase.from("connection_requests").update(updates).eq("id", reqId);

    if (action === "introduced") {
      await supabase.from("notifications").insert({
        user_id: req.from_user_id,
        title: "🤝 Introduction Made!",
        message: `You've been connected with ${req.to_name} (${req.to_org || TYPE_LABELS[req.to_user_type]}). Contact: ${req.to_email}${adminNote ? `. Note: ${adminNote}` : ""}`,
        type: "system", metadata: { contact_email: req.to_email, contact_name: req.to_name },
      });
      await supabase.from("notifications").insert({
        user_id: req.to_user_id,
        title: "🤝 Introduction Made!",
        message: `${req.from_name} (${req.from_org || TYPE_LABELS[req.from_user_type]}) would like to connect with you. Contact: ${req.from_email}${adminNote ? `. Note: ${adminNote}` : ""}`,
        type: "system", metadata: { contact_email: req.from_email, contact_name: req.from_name },
      });
    } else if (action === "rejected") {
      await supabase.from("notifications").insert({
        user_id: req.from_user_id,
        title: "Connection Request Update",
        message: `We were unable to facilitate a connection with ${req.to_name} at this time.${adminNote ? ` Reason: ${adminNote}` : ""}`,
        type: "info",
      });
    }
    setAdminNote(""); setActionReq(null); setToast(`Request ${action}!`); fetchAll();
  };

  const deleteReq = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("connection_requests").delete().eq("id", id);
    fetchAll(); setToast("Deleted");
  };

  // ===== BASIC TIER: UPGRADE WALL =====
  if (!canCommunicate && !isAdmin) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
        <div style={{ background: "#fff", borderRadius: 16, width: "90%", maxWidth: 480, padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
          <div style={{ padding: "24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", textAlign: "center" }}>
            <Lock size={36} color="#D4C68E" style={{ marginBottom: 12 }} />
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>Upgrade to Connect</h2>
            <p style={{ color: "#D4C68E", fontSize: 12, marginTop: 8 }}>Communication with investors, seekers, and partners requires a paid subscription</p>
          </div>
          <div style={{ padding: 24 }}>
<div style={{ padding: 16, borderRadius: 12, border: "1px solid #94A3B8", background: "#F8FAFC", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Star size={18} color="#94A3B8" /><span style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23" }}>Silver</span>
              </div>
              <div style={{ fontSize: 12, color: "#3D5A47", marginBottom: 4 }}>✅ Direct messaging to any user on the platform</div>
              <div style={{ fontSize: 12, color: "#3D5A47", marginBottom: 4 }}>✅ View full investor/seeker/partner profiles</div>
              <div style={{ fontSize: 12, color: "#D6E4DB" }}>❌ Admin facilitation service (Gold only)</div>
            </div>
<div style={{ padding: 16, borderRadius: 12, border: "2px solid #B5A167", background: "#FFFBF0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Crown size={18} color="#B5A167" /><span style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23" }}>Gold</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#B5A167", background: "#F9F5EA", padding: "2px 8px", borderRadius: 10 }}>RECOMMENDED</span>
              </div>
              <div style={{ fontSize: 12, color: "#3D5A47", marginBottom: 4 }}>✅ Direct messaging to any user</div>
              <div style={{ fontSize: 12, color: "#3D5A47", marginBottom: 4 }}>✅ View full profiles + download contact data</div>
              <div style={{ fontSize: 12, color: "#3D5A47" }}>✅ Admin facilitation -- our team personally introduces you to the right contacts</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => { onClose(); if (onUpgrade) onUpgrade(); }} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <ArrowUp size={14} /> Upgrade Now
              </button>
              <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Maybe Later</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}
{actionReq && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 460, width: "90%" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 8 }}>Handle Facilitation Request</div>
          <div style={{ padding: 12, borderRadius: 8, background: "#FAFBFA", border: "1px solid #D6E4DB", marginBottom: 12, fontSize: 11 }}>
            <div><b>{actionReq.from_name}</b> ({TYPE_LABELS[actionReq.from_user_type]}) → <b>{actionReq.to_name}</b> ({TYPE_LABELS[actionReq.to_user_type]})</div>
            <div style={{ color: "#6B8574", marginTop: 4 }}>"{actionReq.message}"</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: "#6B8574", fontWeight: 600, display: "block", marginBottom: 4 }}>ADMIN NOTE (sent to both parties)</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add context, introduction note..." style={{ width: "100%", fontSize: 12, padding: "10px", borderRadius: 8, border: "1px solid #D6E4DB", minHeight: 60 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => handleAction(actionReq.id, "introduced")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#1B7A4A", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><UserPlus size={14} /> Introduce Both Parties</button>
            <button onClick={() => handleAction(actionReq.id, "rejected")} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #DC3545", background: "#FEF2F2", color: "#DC3545", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Decline</button>
            <button onClick={() => setActionReq(null)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 11 }}>Cancel</button>
          </div>
        </div>
      </div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link2 size={22} color="#D4C68E" />
            <div><h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>{view === "request" ? "New Connection" : "Connections"}</h2>
              <div style={{ color: "#D4C68E", fontSize: 10 }}>
                {isGold ? "Direct messaging + Admin facilitation service" : "Direct messaging"}
              </div></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {isAdmin && pendingCount > 0 && <span style={{ background: "#DC3545", color: "#fff", padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{pendingCount} pending</span>}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
{view === "request" && <div>
            <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>← Back</button>
<div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setMode("direct")} style={{ flex: 1, padding: "14px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                border: mode === "direct" ? "2px solid #3B82F6" : "1px solid #D6E4DB", background: mode === "direct" ? "#DBEAFE" : "#fff" }}>
                <MessageSquare size={20} color={mode === "direct" ? "#3B82F6" : "#8FA898"} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: mode === "direct" ? "#3B82F6" : "#6B8574" }}>Direct Message</div>
                <div style={{ fontSize: 10, color: "#8FA898", marginTop: 2 }}>Send your message + contact info directly</div>
              </button>
              <button onClick={() => { if (isGold) setMode("facilitator"); }}
                style={{ flex: 1, padding: "14px", borderRadius: 10, cursor: isGold ? "pointer" : "default", textAlign: "center", position: "relative",
                  border: mode === "facilitator" ? "2px solid #B5A167" : "1px solid #D6E4DB",
                  background: mode === "facilitator" ? "#FFFBF0" : isGold ? "#fff" : "#F4F6F5",
                  opacity: isGold ? 1 : 0.7 }}>
                {!isGold && <div style={{ position: "absolute", top: 6, right: 6, background: "#B5A167", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700 }}>GOLD</div>}
                <Shield size={20} color={mode === "facilitator" ? "#B5A167" : "#8FA898"} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: mode === "facilitator" ? "#B5A167" : "#6B8574" }}>Admin Facilitation</div>
                <div style={{ fontSize: 10, color: "#8FA898", marginTop: 2 }}>
                  {isGold ? "Our team personally introduces you" : "Upgrade to Gold for this service"}
                </div>
              </button>
            </div>
{isSilver && mode === "direct" && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#F9F5EA", border: "1px solid #D4C68E", marginBottom: 12, fontSize: 11, color: "#8C7B4A", display: "flex", alignItems: "center", gap: 8 }}>
              <Crown size={14} color="#B5A167" />
              <span>Want our team to personally facilitate introductions? <b>Upgrade to Gold</b> for the admin facilitation service.</span>
            </div>}
<div style={{ marginBottom: 12 }}>
              <label style={LS}>Who do you want to {mode === "direct" ? "message" : "be introduced to"}? *</label>
              <div style={{ position: "relative" }}>
                <Search size={13} color="#8FA898" style={{ position: "absolute", left: 10, top: 12 }} />
                <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setToUserId(""); }} placeholder="Search by name, email, or organization..." style={{ ...IS, paddingLeft: 30 }} />
              </div>
              {searchableUsers.length > 0 && !toUserId && <div style={{ border: "1px solid #D6E4DB", borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: "auto" }}>
                {searchableUsers.map(u => (
                  <button key={u.id} onClick={() => { setToUserId(u.id); setUserSearch(u.full_name || u.email); }}
                    style={{ width: "100%", padding: "10px 12px", border: "none", borderBottom: "1px solid #F0F4F1", background: "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{TYPE_ICONS[u.user_type] || "👤"}</span>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>{u.full_name || u.email}</div>
                      <div style={{ fontSize: 10, color: "#6B8574" }}>{u.organization || ""} · {TYPE_LABELS[u.user_type] || "User"}</div></div>
                  </button>
                ))}
              </div>}
              {toUserId && <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "#E8F5EE", border: "1px solid #B8DCC8", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={14} color="#1B7A4A" /><span style={{ fontSize: 12, color: "#1B7A4A", fontWeight: 600 }}>{userSearch}</span>
                <button onClick={() => { setToUserId(""); setUserSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B8574", marginLeft: "auto" }}><X size={14} /></button>
              </div>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={LS}>{mode === "direct" ? "Your Message *" : "Why do you want to connect? (Our team will use this to introduce you) *"}</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder={mode === "direct" ? "Hi, I'm interested in discussing..." : "We are looking for a healthcare operator for our $5M project in Riyadh..."}
                style={{ ...IS, minHeight: 80 }} />
            </div>

            {mode === "direct" && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#DBEAFE", border: "1px solid #93C5FD", marginBottom: 12, fontSize: 10, color: "#1E40AF" }}>
              💬 Your message and contact email ({user?.email}) will be sent directly to this user via notification. They can respond to you directly.
            </div>}

            {mode === "facilitator" && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#F9F5EA", border: "1px solid #D4C68E", marginBottom: 12, fontSize: 10, color: "#8C7B4A" }}>
              🤝 Our team will review your request and personally introduce you to {userSearch || "the user"}. Both parties will receive each other's contact details with an admin note.
            </div>}

            <button onClick={submitRequest} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none",
              background: mode === "direct" ? "linear-gradient(135deg,#3B82F6,#60A5FA)" : "linear-gradient(135deg,#B5A167,#D4C68E)",
              color: mode === "direct" ? "#fff" : "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {mode === "direct" ? <div><Send size={14} /> Send Direct Message</div> : <div><Shield size={14} /> Request Facilitation</div>}
            </button>
          </div>}
{view === "list" && <div>
            <button onClick={() => setView("request")} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 16 }}>
              <UserPlus size={14} /> New Connection
            </button>
<div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ position: "relative", flex: 1 }}><Search size={13} color="#8FA898" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
                <input placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ ...IS, paddingLeft: 28 }} /></div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 11, padding: "8px 10px", borderRadius: 8, border: "1px solid #D6E4DB" }}>
                <option value="All">All</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select>
            </div>

            {loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !filtered.length ? <div style={{ padding: 40, textAlign: "center" }}><Link2 size={40} color="#D6E4DB" /><div style={{ marginTop: 8, fontSize: 14, color: "#6B8574" }}>No connections yet</div></div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(r => {
                  const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
                  const isFrom = r.from_user_id === user?.id;
                  const isDirect = r.status === "direct";
                  return (
                    <div key={r.id} style={{ padding: "14px 18px", borderRadius: 10, border: `1px solid ${st.color}22`, background: "#FAFBFA" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 14 }}>{TYPE_ICONS[r.from_user_type]}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1A2E23" }}>{r.from_name}{isFrom ? " (You)" : ""}</span>
                          </div>
                          <ArrowRight size={14} color="#8FA898" />
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 14 }}>{TYPE_ICONS[r.to_user_type]}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1A2E23" }}>{r.to_name}{r.to_user_id === user?.id ? " (You)" : ""}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                          {isDirect && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#DBEAFE", color: "#3B82F6" }}>💬 Direct</span>}
                          {!isDirect && <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: st.bg, color: st.color }}>{st.icon} {st.label}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#3D5A47", marginBottom: 4 }}>"{r.message}"</div>
                      {r.admin_note && <div style={{ fontSize: 10, color: "#8C7B4A", padding: "4px 8px", borderRadius: 4, background: "#F9F5EA", marginBottom: 4 }}>Admin: {r.admin_note}</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 9, color: "#8FA898" }}>{new Date(r.created_at).toLocaleString()}</span>
                        {isAdmin && r.status === "pending" && <button onClick={() => setActionReq(r)} style={LBT}><UserPlus size={11} /> Handle</button>}
                        {isAdmin && <button onClick={() => deleteReq(r.id)} style={{ ...LBT, color: "#DC3545", border: "1px solid #DC3545", marginLeft: 4 }}><Trash2 size={11} /></button>}
                      </div>
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
