"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, Send, X, Crown, Star, Shield, Lock, ArrowUp, Sparkles, Calendar, RefreshCw, Building2, MessageSquare, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const TIER_LIMITS = { basic: 0, silver: 2, gold: 15 };
const TIER_LABELS = { basic: "Basic -- View Only", silver: "Silver", gold: "Gold" };

const SUGGESTED_QUESTIONS = [
  { icon: "🏥", text: "How do I open a hospital in Saudi Arabia?", cat: "Licensing" },
  { icon: "💰", text: "What funding options are available from SIDF?", cat: "Funding" },
  { icon: "📋", text: "What licenses do I need from MOH for a clinic?", cat: "Licensing" },
  { icon: "🏗️", text: "How do I get land from MODON for a pharmaceutical plant?", cat: "Industrial" },
  { icon: "🌍", text: "As a foreign investor, what's my first step with MISA?", cat: "Foreign Investment" },
  { icon: "💊", text: "How do I register medical devices with SFDA?", cat: "Regulatory" },
  { icon: "📊", text: "What are the Vision 2030 healthcare targets?", cat: "Strategy" },
  { icon: "🤝", text: "How can I partner with government hospitals?", cat: "PPP" },
  { icon: "🏢", text: "What's the process for a Commercial Registration?", cat: "Setup" },
  { icon: "💳", text: "How does VAT work for healthcare services?", cat: "Tax" },
];

const ENTITIES = [
  { name: "MISA", full: "Ministry of Investment", url: "investsaudi.sa" },
  { name: "MOH", full: "Ministry of Health", url: "moh.gov.sa" },
  { name: "SFDA", full: "Saudi FDA", url: "sfda.gov.sa" },
  { name: "SIDF", full: "Industrial Development Fund", url: "sidf.gov.sa" },
  { name: "MODON", full: "Industrial Cities Authority", url: "modon.gov.sa" },
  { name: "Monsha'at", full: "SME Authority (SBC)", url: "monshaat.gov.sa" },
  { name: "MoC", full: "Ministry of Commerce", url: "mc.gov.sa" },
  { name: "Balady", full: "Municipal Affairs", url: "balady.gov.sa" },
  { name: "SCFHS", full: "Health Specialties Commission", url: "scfhs.org.sa" },
  { name: "ZATCA", full: "Tax Authority", url: "zatca.gov.sa" },
  { name: "SRCA", full: "Saudi Red Crescent", url: "srca.org.sa" },
  { name: "CCHI", full: "Health Insurance Council", url: "cchi.gov.sa" },
  { name: "NUPCO", full: "National Procurement", url: "nupco.com" },
];

export default function InvestmentAdvisor({ onClose, onUpgrade, onRequestMeeting }) {
  const { user, profile, isAdmin } = useAuth();
  const tier = profile?.subscription_tier || "basic";
  const limit = isAdmin ? 999 : TIER_LIMITS[tier] || 0;
  const isBasic = tier === "basic" && !isAdmin;
  const isSilver = tier === "silver" && !isAdmin;
  const isGold = tier === "gold" && !isAdmin;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showEntities, setShowEntities] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => { fetchUsage(); }, []);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, limitReached]);

  const fetchUsage = async () => {
    if (!user) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("visitor_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "advisor_question")
      .gte("created_at", startOfMonth.toISOString());
    setUsageCount(count || 0);
    setLoadingUsage(false);
  };

  const remaining = isAdmin ? 999 : Math.max(limit - usageCount, 0);
  const canAsk = remaining > 0 && !isBasic;

  const sendMessage = async (text) => {
    if (!text?.trim() || loading || !canAsk) return;

    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Track usage
    await supabase.from("visitor_log").insert({
      user_id: user.id, user_email: user.email,
      subscription_tier: tier, page: "advisor",
      action: "advisor_question", metadata: { question: text.trim().slice(0, 200) },
    });
    const newCount = usageCount + 1;
    setUsageCount(newCount);

    try {
      const apiMessages = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, user_tier: tier }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages([...newMessages, { role: "assistant", content: `Sorry, I encountered an error: ${err.error || "Unknown error"}. Please try again.` }]);
      } else {
        const data = await res.json();
        setMessages([...newMessages, { role: "assistant", content: data.response }]);
      }
    } catch(e) {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Please check your internet and try again." }]);
    }
    setLoading(false);

    // Check if limit reached AFTER this question
    const newRemaining = isAdmin ? 999 : Math.max(limit - newCount, 0);
    if (newRemaining <= 0 && !isAdmin) {
      setLimitReached(true);
    }
  };

  const requestAdminConsult = async () => {
    // Send notification to admin
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    const context = messages.slice(-4).map(m => `${m.role === "user" ? "Q" : "A"}: ${m.content.slice(0, 100)}`).join("\n");
    for (const admin of (admins || [])) {
      await supabase.from("notifications").insert({
        user_id: admin.id,
        title: "🧑‍💼 Gold Member Requests Consultation",
        message: `${profile?.full_name || user.email} (Gold) has used all 15 AI Advisor questions this month and is requesting a personal consultation.\n\nRecent topics:\n${context}`,
        type: "system",
        metadata: { from_email: user.email, from_name: profile?.full_name || "" },
      });
    }
    // Notify user
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "✅ Consultation Request Sent",
      message: "Your request for a personal admin consultation has been sent. Our team will contact you within 24-48 hours to schedule a session.",
      type: "system",
    });
    setMessages([...messages, { role: "system", content: "✅ Your consultation request has been sent to our team. You'll be contacted within 24-48 hours to discuss your investment queries in detail." }]);
  };

  // Counter color
  const counterColor = remaining <= 0 ? "#DC3545" : remaining <= 3 ? "#D97706" : "#1B7A4A";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 680, height: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
<div style={{ padding: "14px 20px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={20} color="#D4C68E" />
            </div>
            <div>
              <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Investment Advisor</h2>
              <div style={{ color: "#D4C68E", fontSize: 10 }}>Saudi Healthcare Investment Guide -- Powered by AI</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
{!isAdmin && !isBasic && <div style={{ padding: "4px 10px", borderRadius: 6, background: `${counterColor}15`, border: `1px solid ${counterColor}40`, display: "flex", alignItems: "center", gap: 4 }}>
              <MessageSquare size={10} color={counterColor} />
              <span style={{ fontSize: 10, fontWeight: 700, color: counterColor }}>{usageCount}/{limit}</span>
            </div>}
            {isBasic && <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "#8FA898" }}>View Only</span>}
            {isAdmin && <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "rgba(181,161,103,0.2)", color: "#D4C68E" }}>Admin ∞</span>}
            <button onClick={() => { setMessages([]); setLimitReached(false); }} title="New conversation" style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "6px", cursor: "pointer", color: "#D4C68E" }}><RefreshCw size={14} /></button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 11 }}>✕</button>
          </div>
        </div>
<div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#FAFBFA" }}>
{messages.length === 0 && <div>
            <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Bot size={28} color="#fff" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2E23" }}>Healthcare Investment Advisor</div>
              <div style={{ fontSize: 12, color: "#6B8574", marginTop: 4, maxWidth: 400, margin: "4px auto 0", lineHeight: 1.5 }}>
                Ask me anything about investing in Saudi healthcare -- licensing, funding, regulations, Vision 2030, government entities, and more.
              </div>
{isBasic && <div style={{ margin: "12px auto", padding: "10px 16px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 11, color: "#92400E", maxWidth: 380 }}>
                <Lock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Basic tier: You can explore the advisor interface but cannot send questions. Upgrade to Silver for 2 questions/month or Gold for 15 questions/month.
              </div>}
              {isSilver && <div style={{ margin: "12px auto", padding: "10px 16px", borderRadius: 8, background: "#DBEAFE", border: "1px solid #93C5FD", fontSize: 11, color: "#1E40AF", maxWidth: 380 }}>
                <Star size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Silver tier: {remaining} of 2 questions remaining this month. Each question counts -- make them count!
              </div>}
              {isGold && <div style={{ margin: "12px auto", padding: "10px 16px", borderRadius: 8, background: "#F9F5EA", border: "1px solid #D4C68E", fontSize: 11, color: "#8C7B4A", maxWidth: 380 }}>
                <Crown size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Gold tier: {remaining} of 15 questions remaining. After 15 questions, you'll be connected with our admin team for personalized consultation.
              </div>}
            </div>
<div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8FA898", textTransform: "uppercase", marginBottom: 8 }}>Suggested Questions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
                  <button key={i} onClick={() => !isBasic && canAsk && sendMessage(q.text)} disabled={isBasic || !canAsk}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", cursor: isBasic || !canAsk ? "not-allowed" : "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 8, opacity: isBasic ? 0.4 : canAsk ? 1 : 0.5 }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{q.icon}</span>
                    <div><div style={{ fontSize: 11, color: "#1A2E23", fontWeight: 500, lineHeight: 1.4 }}>{q.text}</div>
                      <div style={{ fontSize: 9, color: "#8FA898", marginTop: 2 }}>{q.cat}</div></div>
                  </button>
                ))}
              </div>
            </div>
<button onClick={() => setShowEntities(!showEntities)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", cursor: "pointer", fontSize: 11, color: "#1B7A4A", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Building2 size={13} /> {showEntities ? "Hide" : "Show"} Government Entities Reference ({ENTITIES.length})
            </button>
            {showEntities && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 8 }}>
              {ENTITIES.map((e, i) => (
                <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: "#E8F5EE", fontSize: 10 }}>
                  <span style={{ fontWeight: 700, color: "#1B7A4A" }}>{e.name}</span> -- <span style={{ color: "#3D5A47" }}>{e.full}</span>
                  <div style={{ fontSize: 9, color: "#8FA898" }}>{e.url}</div>
                </div>
              ))}
            </div>}
          </div>}
{messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{
                maxWidth: "85%", padding: "12px 16px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: msg.role === "user" ? "linear-gradient(135deg,#1B7A4A,#2D9E64)" : msg.role === "system" ? "#F9F5EA" : "#fff",
                color: msg.role === "user" ? "#fff" : "#1A2E23",
                border: msg.role === "user" ? "none" : msg.role === "system" ? "1px solid #D4C68E" : "1px solid #D6E4DB",
                boxShadow: msg.role === "user" ? "0 2px 8px rgba(27,122,74,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                {msg.role === "assistant" && <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <Bot size={12} color="#1B7A4A" /><span style={{ fontSize: 9, fontWeight: 700, color: "#1B7A4A" }}>Investment Advisor</span>
                </div>}
                {msg.role === "system" && <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <User size={12} color="#B5A167" /><span style={{ fontSize: 9, fontWeight: 700, color: "#B5A167" }}>System</span>
                </div>}
                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</div>
              </div>
            </div>
          ))}
{loading && <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{ padding: "14px 20px", borderRadius: "14px 14px 14px 4px", background: "#fff", border: "1px solid #D6E4DB" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1B7A4A", animation: "pulse 1.4s infinite ease-in-out" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1B7A4A", animation: "pulse 1.4s infinite ease-in-out 0.2s" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1B7A4A", animation: "pulse 1.4s infinite ease-in-out 0.4s" }} />
              </div>
            </div>
          </div>}
        </div>
{isBasic && <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", borderTop: "2px solid #FDE68A", textAlign: "center" }}>
          <Lock size={20} color="#D97706" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Upgrade to Unlock the AI Advisor</div>
          <div style={{ fontSize: 11, color: "#B45309", marginBottom: 10 }}>Silver: 2 questions/month · Gold: 15 questions/month + admin consultation</div>
          <button onClick={() => { onClose(); if (onUpgrade) onUpgrade(); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            <ArrowUp size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Upgrade Now
          </button>
        </div>}
{isSilver && limitReached && <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)", borderTop: "2px solid #93C5FD", textAlign: "center" }}>
          <Star size={20} color="#2563EB" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>You've used your 2 questions this month</div>
          <div style={{ fontSize: 11, color: "#3B82F6", marginBottom: 10 }}>Upgrade to Gold for 15 questions/month + personalized admin consultation</div>
          <button onClick={() => { onClose(); if (onUpgrade) onUpgrade(); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            <Crown size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Upgrade to Gold
          </button>
        </div>}
{isGold && limitReached && <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #F9F5EA, #FFFBF0)", borderTop: "2px solid #D4C68E" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#B5A167", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8C7B4A" }}>You've used all 15 questions this month</div>
              <div style={{ fontSize: 11, color: "#B5A167" }}>As a Gold member, you can request a personal consultation with our investment team.</div>
            </div>
          </div>
          <button onClick={requestAdminConsult} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Calendar size={16} /> Request Admin Consultation
          </button>
          <div style={{ fontSize: 9, color: "#8C7B4A", textAlign: "center", marginTop: 6 }}>Our team will contact you within 24-48 hours</div>
        </div>}
{isGold && !limitReached && messages.length > 2 && <div style={{ padding: "8px 20px", background: "#F9F5EA", borderTop: "1px solid #D4C68E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: "#8C7B4A" }}>Need to meet a government official? Our team can arrange it.</div>
          <button onClick={() => { if (onRequestMeeting) onRequestMeeting(); else onClose(); }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#B5A167", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={11} /> Request Meeting
          </button>
        </div>}
{!isBasic && !limitReached && <div style={{ padding: "12px 20px", borderTop: "1px solid #D6E4DB", background: "#fff", display: "flex", gap: 8, flexShrink: 0 }}>
          <input value={input} onChange={e => setInput(e.target.value)} disabled={loading}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={`Ask about Saudi healthcare investment... (${remaining} left)`}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #D6E4DB", fontSize: 13, outline: "none" }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: input.trim() ? "linear-gradient(135deg,#1B7A4A,#2D9E64)" : "#D6E4DB", color: "#fff", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 4 }}>
            <Send size={16} />
          </button>
        </div>}
{!isBasic && !isAdmin && !limitReached && messages.length > 0 && <div style={{ padding: "4px 20px 8px", background: "#fff", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 80, height: 4, background: "#E8EFE9", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(usageCount / limit) * 100}%`, height: "100%", background: counterColor, borderRadius: 2, transition: "width .3s" }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: counterColor }}>{usageCount}/{limit} used</span>
            {remaining <= 2 && remaining > 0 && <span style={{ fontSize: 9, color: "#D97706" }}>· {remaining} remaining</span>}
          </div>
        </div>}
      </div>
    </div>
  );
}
