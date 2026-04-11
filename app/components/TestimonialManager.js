"use client";
import { useState, useEffect, useRef } from "react";
import { Star, Plus, CheckCircle, X, Eye, Trash2, Flag, Quote, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const PATHWAY_ICONS = { investor: "💰", seeker: "🏥", partner: "🤝" };

// ===== TESTIMONIAL FLASH BANNER (auto-rotating, shown on dashboard) =====
export function TestimonialBanner() {
  const [testimonials, setTestimonials] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchApproved();
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const fetchApproved = async () => {
    const { data } = await supabase.from("testimonials").select("*").eq("is_approved", true).order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(20);
    setTestimonials(data || []);
  };

  if (!testimonials.length) return null;
  const t = testimonials[current];
  const stars = Array(t.rating || 5).fill(0);

  return (
    <div style={{ background: "linear-gradient(135deg, #F9F5EA, #FFFBF0)", border: "1px solid #D4C68E", borderRadius: 12, padding: "16px 20px", marginBottom: 14, position: "relative", overflow: "hidden", minHeight: 80 }}>
<div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #B5A167, #D4C68E, #B5A167)" }} />

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Quote size={24} color="#D4C68E" style={{ flexShrink: 0, opacity: 0.5, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#3D5A47", lineHeight: 1.6, fontStyle: "italic", marginBottom: 8 }}>"{t.content}"</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E8F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                {PATHWAY_ICONS[t.user_type] || "💼"}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1A2E23" }}>{t.user_name}</div>
                <div style={{ fontSize: 9, color: "#8FA898" }}>{t.user_title}{t.user_org ? ` · ${t.user_org}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 1 }}>
              {stars.map((_, i) => <Star key={i} size={11} fill="#B5A167" color="#B5A167" />)}
            </div>
          </div>
        </div>
      </div>
{testimonials.length > 1 && <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10 }}>
        {testimonials.slice(0, 8).map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 16 : 6, height: 6, borderRadius: 3, background: i === current ? "#B5A167" : "#D6E4DB", border: "none", cursor: "pointer", transition: "all .3s" }} />
        ))}
      </div>}
{testimonials.length > 1 && <div>
        <button onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)} style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.7)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={14} color="#B5A167" /></button>
        <button onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.7)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={14} color="#B5A167" /></button>
      </div>}
    </div>
  );
}

// ===== TESTIMONIAL MANAGER (Admin + Submit) =====
export default function TestimonialManager({ onClose }) {
  const { user, profile, isAdmin } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list|submit
  const [toast, setToast] = useState(null);

  // Submit form
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchAll = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setTestimonials(data || []);
    setLoading(false);
  };

  const submitTestimonial = async () => {
    if (!content.trim()) return alert("Please write your testimonial");
    await supabase.from("testimonials").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || user.email.split("@")[0],
      user_title: profile?.organization_type || "",
      user_org: profile?.organization || "",
      user_type: profile?.user_type || "investor",
      content: content.trim(),
      rating,
      is_approved: false,
    });
    setToast("Testimonial submitted! Awaiting admin approval.");
    setContent(""); setRating(5); setView("list"); fetchAll();
  };

  const toggleApproval = async (id, approved) => {
    await supabase.from("testimonials").update({ is_approved: !approved }).eq("id", id);
    fetchAll(); setToast(approved ? "Hidden" : "Approved & visible!");
  };

  const toggleFeatured = async (id, featured) => {
    await supabase.from("testimonials").update({ is_featured: !featured }).eq("id", id);
    fetchAll(); setToast(featured ? "Unfeatured" : "Featured!");
  };

  const deleteTestimonial = async (id) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    fetchAll(); setToast("Deleted");
  };

  const approved = testimonials.filter(t => t.is_approved);
  const pending = testimonials.filter(t => !t.is_approved);
  const hasSubmitted = testimonials.some(t => t.user_id === user?.id);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 650, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Star size={22} color="#D4C68E" />
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>Testimonials</h2>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ color: "#D4C68E", fontSize: 10, background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 6 }}>{approved.length} approved · {pending.length} pending</span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
{view === "submit" && <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 14 }}>Share Your Experience</div>
            <div style={{ marginBottom: 12 }}>
              <label style={LS}>Your Rating</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setRating(r)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <Star size={24} fill={r <= rating ? "#B5A167" : "none"} color={r <= rating ? "#B5A167" : "#D6E4DB"} />
                  </button>
                ))}
              </div>
            </div>
            <div><label style={LS}>Your Testimonial *</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="How has this platform helped your healthcare investment journey? What features do you find most valuable?" style={{ ...IS, minHeight: 100 }} />
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FAFBFA", border: "1px solid #D6E4DB", marginTop: 8, fontSize: 10, color: "#6B8574" }}>
              Your testimonial will be submitted as: <b>{profile?.full_name || user?.email}</b>{profile?.organization ? ` · ${profile.organization}` : ""}. It will appear on the platform after admin approval.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={submitTestimonial} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Submit Testimonial</button>
              <button onClick={() => setView("list")} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>}
{view === "list" && <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {!hasSubmitted && <button onClick={() => setView("submit")} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Star size={14} /> Write a Testimonial</button>}
              {hasSubmitted && <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#E8F5EE", textAlign: "center", fontSize: 12, color: "#1B7A4A", fontWeight: 600 }}>✅ You've already submitted a testimonial</div>}
            </div>
{isAdmin && pending.length > 0 && <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#D97706", textTransform: "uppercase", marginBottom: 8 }}>⏳ Pending Approval ({pending.length})</div>
              {pending.map(t => (
                <div key={t.id} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #FDE68A", background: "#FFFBEB", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: "#3D5A47", fontStyle: "italic", marginBottom: 6 }}>"{t.content}"</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: "#6B8574" }}>{PATHWAY_ICONS[t.user_type]} {t.user_name} · {t.user_org} · {Array(t.rating).fill("⭐").join("")}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => toggleApproval(t.id, false)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#1B7A4A", color: "#fff", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>✓ Approve</button>
                      <button onClick={() => deleteTestimonial(t.id)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
<div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>✅ Published ({approved.length})</div>
            {approved.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898", fontSize: 12 }}>No testimonials yet. Be the first to share!</div> :
              approved.map(t => (
                <div key={t.id} style={{ padding: "14px 16px", borderRadius: 10, border: t.is_featured ? "2px solid #B5A167" : "1px solid #D6E4DB", background: t.is_featured ? "#FFFBF0" : "#fff", marginBottom: 6, position: "relative" }}>
                  {t.is_featured && <div style={{ position: "absolute", top: -1, right: 12, background: "#B5A167", color: "#fff", padding: "2px 8px", borderRadius: "0 0 6px 6px", fontSize: 8, fontWeight: 700 }}>FEATURED</div>}
                  <div style={{ fontSize: 12, color: "#3D5A47", fontStyle: "italic", lineHeight: 1.6, marginBottom: 8 }}>"{t.content}"</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{PATHWAY_ICONS[t.user_type]}</span>
                      <div><div style={{ fontSize: 11, fontWeight: 600, color: "#1A2E23" }}>{t.user_name}</div><div style={{ fontSize: 9, color: "#8FA898" }}>{t.user_title}{t.user_org ? ` · ${t.user_org}` : ""}</div></div>
                      <div style={{ display: "flex", gap: 1, marginLeft: 8 }}>{Array(t.rating).fill(0).map((_, i) => <Star key={i} size={10} fill="#B5A167" color="#B5A167" />)}</div>
                    </div>
                    {isAdmin && <div style={{ display: "flex", gap: 3 }}>
                      <button onClick={() => toggleFeatured(t.id, t.is_featured)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #D4C68E", background: t.is_featured ? "#B5A167" : "#fff", color: t.is_featured ? "#fff" : "#B5A167", cursor: "pointer", fontSize: 8, fontWeight: 600 }}>{t.is_featured ? "Unfeature" : "Feature"}</button>
                      <button onClick={() => toggleApproval(t.id, true)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 8 }}>Hide</button>
                      <button onClick={() => deleteTestimonial(t.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", fontSize: 8 }}><Trash2 size={10} /></button>
                    </div>}
                  </div>
                </div>
              ))
            }
          </div>}
        </div>
      </div>
    </div>
  );
}

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
