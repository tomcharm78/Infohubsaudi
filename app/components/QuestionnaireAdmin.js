"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, ClipboardList, BarChart3, Calendar, Clock, CheckCircle, Users, Download, Pencil, Copy, AlertTriangle, Eye, Link2, Bell, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

// ===== QUESTION BUILDER (supports conditional logic) =====
function QuestionBuilder({ onSave, onCancel, existing, responseCount }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [desc, setDesc] = useState(existing?.description || "");
  const [questions, setQuestions] = useState(existing?.questions || [{ question: "", options: ["", ""], condition: null }]);
  const [startAt, setStartAt] = useState(existing?.start_at ? existing.start_at.slice(0, 16) : "");
  const [endAt, setEndAt] = useState(existing?.end_at ? existing.end_at.slice(0, 16) : "");
  const [notifyEmail, setNotifyEmail] = useState(existing?.notify_email || "");
  const [saving, setSaving] = useState(false);

  const addQ = () => setQuestions([...questions, { question: "", options: ["", ""], condition: null }]);
  const rmQ = (qi) => {
    const nq = questions.filter((_, i) => i !== qi);
    // Fix condition references after removal
    nq.forEach(q => { if (q.condition && q.condition.questionIndex >= qi) { if (q.condition.questionIndex === qi) q.condition = null; else q.condition = { ...q.condition, questionIndex: q.condition.questionIndex - 1 }; } });
    setQuestions(nq);
  };
  const updQ = (qi, val) => { const n = [...questions]; n[qi] = { ...n[qi], question: val }; setQuestions(n); };
  const addOpt = (qi) => { const n = [...questions]; n[qi] = { ...n[qi], options: [...n[qi].options, ""] }; setQuestions(n); };
  const rmOpt = (qi, oi) => { const n = [...questions]; n[qi] = { ...n[qi], options: n[qi].options.filter((_, i) => i !== oi) }; setQuestions(n); };
  const updOpt = (qi, oi, val) => { const n = [...questions]; const o = [...n[qi].options]; o[oi] = val; n[qi] = { ...n[qi], options: o }; setQuestions(n); };

  // Conditional logic
  const setCondition = (qi, depQi, depOi) => {
    const n = [...questions];
    if (depQi === "" || depQi === null) { n[qi] = { ...n[qi], condition: null }; }
    else { n[qi] = { ...n[qi], condition: { questionIndex: parseInt(depQi), optionIndex: parseInt(depOi) || 0 } }; }
    setQuestions(n);
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Title required");
    if (!startAt || !endAt) return alert("Start and end dates required");
    if (new Date(endAt) <= new Date(startAt)) return alert("End must be after start");
    if (questions.find(q => !q.question.trim())) return alert("All questions need text");
    if (questions.find(q => q.options.some(o => !o.trim()))) return alert("All options need text");
    if (questions.some(q => q.options.length < 2)) return alert("Min 2 options per question");
    setSaving(true);
    await onSave({
      ...(existing || {}),
      title: title.trim(), description: desc.trim(), questions,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      status: existing?.status || "active",
      notify_email: notifyEmail.trim(),
    });
    setSaving(false);
  };

  const isEdit = !!existing?.id;

  return (
    <div style={{ maxHeight: "75vh", overflowY: "auto", padding: 4 }}>
      {isEdit && responseCount > 0 && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", fontSize: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <AlertTriangle size={14} /> Warning: This questionnaire has {responseCount} response(s). Editing questions may affect data consistency.
      </div>}

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={LS}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Healthcare Survey Q2 2026" style={IS} />
        </div>
        <div>
          <label style={LS}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..." style={{ ...IS, minHeight: 50, resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={LS}><Calendar size={10} /> Start *</label><input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} style={IS} /></div>
          <div><label style={LS}><Clock size={10} /> End *</label><input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} style={IS} /></div>
        </div>
        <div>
          <label style={LS}><Mail size={10} /> Notification Email (optional)</label>
          <input value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="admin@company.com -- notified when questionnaire opens" style={IS} />
        </div>
<div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span>Questions ({questions.length})</span>
            <button onClick={addQ} style={ABT}><Plus size={12} /> Add Question</button>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} style={{ padding: 14, marginBottom: 10, borderRadius: 10, border: q.condition ? "2px solid #B5A167" : "1px solid #D6E4DB", background: q.condition ? "#FFFBF0" : "#FAFBFA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A" }}>Q{qi + 1} {q.condition && <span style={{ fontSize: 9, color: "#B5A167" }}>⚡ CONDITIONAL</span>}</span>
                {questions.length > 1 && <button onClick={() => rmQ(qi)} style={{ background: "none", border: "none", color: "#DC3545", cursor: "pointer" }}><Trash2 size={13} /></button>}
              </div>
              <input value={q.question} onChange={e => updQ(qi, e.target.value)} placeholder="Enter question..." style={{ ...IS, marginBottom: 8 }} />
<div style={{ fontSize: 9, color: "#8FA898", marginBottom: 6, fontWeight: 600 }}>OPTIONS:</div>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #D6E4DB", flexShrink: 0 }} />
                  <input value={opt} onChange={e => updOpt(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} style={{ ...IS, padding: "6px 10px" }} />
                  {q.options.length > 2 && <button onClick={() => rmOpt(qi, oi)} style={{ background: "none", border: "none", color: "#DC3545", cursor: "pointer" }}><X size={13} /></button>}
                </div>
              ))}
              <button onClick={() => addOpt(qi)} style={{ marginTop: 4, fontSize: 10, color: "#1B7A4A", background: "none", border: "1px dashed #D6E4DB", borderRadius: 6, padding: "4px 10px", cursor: "pointer", width: "100%" }}>+ Add Option</button>
{qi > 0 && <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#fff", border: "1px solid #E8EFE9" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#B5A167", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Link2 size={10} /> Conditional Logic (optional)</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 11, color: "#3D5A47" }}>
                  <span>Show this question only if</span>
                  <select value={q.condition?.questionIndex ?? ""} onChange={e => setCondition(qi, e.target.value === "" ? null : e.target.value, q.condition?.optionIndex || 0)}
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 5, border: "1px solid #D6E4DB", minWidth: 80 }}>
                    <option value="">Always show</option>
                    {questions.slice(0, qi).map((pq, pi) => <option key={pi} value={pi}>Q{pi + 1}</option>)}
                  </select>
                  {q.condition && <div>
                    <span>answer is</span>
                    <select value={q.condition.optionIndex || 0} onChange={e => setCondition(qi, q.condition.questionIndex, e.target.value)}
                      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 5, border: "1px solid #D6E4DB", minWidth: 100 }}>
                      {(questions[q.condition.questionIndex]?.options || []).map((o, oi) => <option key={oi} value={oi}>{o || `Option ${oi + 1}`}</option>)}
                    </select>
                  </div>}
                </div>
              </div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: saving ? "#8FA898" : "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 700 }}>
          {saving ? "Saving..." : isEdit ? "Update Questionnaire" : "Create & Activate"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ===== RESULTS TRACKER (Phase 2 -- unchanged) =====
function ResultsTracker({ questionnaire, onClose }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchR(); }, [questionnaire.id]);
  const fetchR = async () => { const { data } = await supabase.from("responses").select("*").eq("questionnaire_id", questionnaire.id).order("submitted_at", { ascending: false }); setResponses(data || []); setLoading(false); };

  const stats = useMemo(() => {
    const sub = responses.filter(r => !r.skipped), skip = responses.filter(r => r.skipped);
    const bd = (questionnaire.questions || []).map((q, qi) => {
      const counts = {}; (q.options || []).forEach((_, oi) => { counts[oi] = 0; });
      sub.forEach(r => { const a = r.answers?.[qi]; if (a !== undefined && counts[a] !== undefined) counts[a]++; });
      return { question: q.question, options: q.options, counts, total: sub.length, condition: q.condition };
    });
    return { total: responses.length, submitted: sub.length, skipped: skip.length, breakdown: bd };
  }, [responses, questionnaire]);

  const exportXlsx = () => {
    import("xlsx").then(X => {
      const qs = questionnaire.questions || [];
      const hd = ["Email", "Date", "Status", ...qs.map((q, i) => `Q${i + 1}: ${q.question}`)];
      const rows = [hd];
      responses.forEach(r => {
        const row = [r.user_email, new Date(r.submitted_at).toLocaleString(), r.skipped ? "Skipped" : "Completed"];
        qs.forEach((q, qi) => row.push(r.skipped ? "--" : (q.options?.[r.answers?.[qi]] || "--")));
        rows.push(row);
      });
      const ws = X.utils.aoa_to_sheet(rows); const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, ws, "Responses");
      X.writeFile(wb, `Results_${questionnaire.title.replace(new RegExp("\\s","g"), "_")}.xlsx`);
    });
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div>;

  return (
    <div style={{ maxHeight: "75vh", overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["Total", stats.total, "#E8F5EE", "#1B7A4A"], ["Completed", stats.submitted, "#F0FDF4", "#16A34A"], ["Skipped", stats.skipped, "#FEF3C7", "#D97706"]].map(([l, v, bg, c]) =>
          <div key={l} style={{ padding: 14, borderRadius: 10, background: bg, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 9, color: "#6B8574", textTransform: "uppercase", fontWeight: 600 }}>{l}</div></div>
        )}
      </div>

      {stats.total > 0 && <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, border: "1px solid #D6E4DB" }}>
        <div style={{ fontSize: 10, color: "#6B8574", fontWeight: 600, marginBottom: 6 }}>COMPLETION RATE</div>
        <div style={{ height: 20, borderRadius: 10, background: "#E8EFE9", overflow: "hidden", display: "flex" }}>
          {stats.submitted > 0 && <div style={{ width: `${(stats.submitted / stats.total) * 100}%`, height: "100%", background: "#1B7A4A", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{Math.round((stats.submitted / stats.total) * 100)}%</span></div>}
          {stats.skipped > 0 && <div style={{ width: `${(stats.skipped / stats.total) * 100}%`, height: "100%", background: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 700 }}>{Math.round((stats.skipped / stats.total) * 100)}%</span></div>}
        </div>
      </div>}

      {stats.breakdown.map((b, i) => (
        <div key={i} style={{ marginBottom: 14, padding: 14, borderRadius: 10, border: b.condition ? "2px solid #B5A167" : "1px solid #D6E4DB" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23", marginBottom: 10 }}>
            <span style={{ color: "#1B7A4A", fontWeight: 700 }}>Q{i + 1}.</span> {b.question}
            {b.condition && <span style={{ fontSize: 9, color: "#B5A167", marginLeft: 6 }}>⚡ conditional</span>}
          </div>
          {b.options.map((opt, oi) => {
            const ct = b.counts[oi] || 0, pct = b.total > 0 ? (ct / b.total) * 100 : 0;
            return <div key={oi} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3D5A47", marginBottom: 3 }}><span>{opt}</span><span style={{ fontWeight: 600 }}>{ct} ({Math.round(pct)}%)</span></div>
              <div style={{ height: 14, borderRadius: 7, background: "#E8EFE9", overflow: "hidden" }}><div style={{ width: `${Math.max(pct, 1)}%`, height: "100%", borderRadius: 7, background: `hsl(${150 - oi * 30}, 60%, ${40 + oi * 8}%)`, transition: "width .4s" }} /></div>
            </div>;
          })}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={exportXlsx} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Download size={14} /> Export Excel</button>
        <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 12 }}>Close</button>
      </div>

      {responses.length > 0 && <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>Individual Responses</div>
        <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #D6E4DB", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: "#FAFBFA" }}><th style={TH}>Email</th><th style={TH}>Status</th><th style={TH}>Date</th></tr></thead>
            <tbody>{responses.map(r => <tr key={r.id} style={{ borderBottom: "1px solid #F0F4F1" }}>
              <td style={TD}>{r.user_email}</td>
              <td style={TD}>{r.skipped ? <span style={{ color: "#D97706", fontWeight: 600 }}>Skipped</span> : <span style={{ color: "#1B7A4A", fontWeight: 600 }}>Done</span>}</td>
              <td style={{ ...TD, color: "#8FA898" }}>{new Date(r.submitted_at).toLocaleString()}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}

// Style helpers
const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
const ABT = { padding: "4px 12px", borderRadius: 6, border: "1px solid #1B7A4A", background: "#E8F5EE", color: "#1B7A4A", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 };
const TH = { padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #D6E4DB", color: "#6B8574", fontSize: 10 };
const TD = { padding: "6px 10px", color: "#3D5A47" };

// ===== MAIN ADMIN =====
export default function QuestionnaireAdmin({ onClose }) {
  const { user, isAdmin } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list|create|edit|results
  const [selQ, setSelQ] = useState(null);
  const [selRespCount, setSelRespCount] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchAll = async () => { const { data } = await supabase.from("questionnaires").select("*").order("created_at", { ascending: false }); setQuests(data || []); setLoading(false); };

  const create = async (d) => {
    const { data, error } = await supabase.from("questionnaires").insert({ ...d, created_by: user.id }).select().single();
    if (error) return alert("Error: " + error.message);
    setQuests(prev => [data, ...prev]); setView("list");
    setToast("Created & activated!");
    // Send email notification if configured
    if (d.notify_email) sendNotification(d.notify_email, d.title, d.start_at);
  };

  const update = async (d) => {
    const { error } = await supabase.from("questionnaires").update({
      title: d.title, description: d.description, questions: d.questions,
      start_at: d.start_at, end_at: d.end_at, notify_email: d.notify_email,
      updated_at: new Date().toISOString(),
    }).eq("id", d.id);
    if (error) return alert("Error: " + error.message);
    setQuests(prev => prev.map(q => q.id === d.id ? { ...q, ...d } : q));
    setView("list"); setSelQ(null); setToast("Updated!");
  };

  const del = async (id) => {
    if (!confirm("Delete this questionnaire and ALL responses?")) return;
    await supabase.from("responses").delete().eq("questionnaire_id", id);
    await supabase.from("questionnaires").delete().eq("id", id);
    setQuests(prev => prev.filter(q => q.id !== id)); setToast("Deleted");
  };

  const toggle = async (q) => {
    const ns = q.status === "active" ? "closed" : "active";
    await supabase.from("questionnaires").update({ status: ns }).eq("id", q.id);
    setQuests(prev => prev.map(x => x.id === q.id ? { ...x, status: ns } : x));
    setToast(`Status: ${ns}`);
  };

  const duplicate = async (q) => {
    const clone = {
      title: q.title + " (Copy)",
      description: q.description,
      questions: q.questions,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "draft",
      notify_email: q.notify_email || "",
      created_by: user.id,
    };
    const { data, error } = await supabase.from("questionnaires").insert(clone).select().single();
    if (error) return alert("Error: " + error.message);
    setQuests(prev => [data, ...prev]); setToast("Duplicated! Edit dates and activate.");
  };

  const startEdit = async (q) => {
    // Count existing responses
    const { count } = await supabase.from("responses").select("id", { count: "exact", head: true }).eq("questionnaire_id", q.id);
    setSelRespCount(count || 0);
    setSelQ(q); setView("edit");
  };

  const sendNotification = async (email, title, startAt) => {
    // In production, this would call an API route to send email
    // For now, log it -- can be connected to Supabase Edge Functions or Resend/SendGrid later
    console.log(`📧 Notification: ${email} -- Questionnaire "${title}" opens at ${new Date(startAt).toLocaleString()}`);
  };

  const badge = (s) => {
    const c = { active: ["#E8F5EE", "#1B7A4A"], closed: ["#F4F4F5", "#6B8574"], draft: ["#FEF3C7", "#D97706"] }[s] || ["#F4F4F5", "#6B8574"];
    return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: c[0], color: c[1] }}>{s.toUpperCase()}</span>;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={22} color="#D4C68E" />
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>
              {view === "create" ? "Create Questionnaire" : view === "edit" ? "Edit Questionnaire" : view === "results" ? "Results Tracker" : "Questionnaires"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {view === "create" && <QuestionBuilder onSave={create} onCancel={() => setView("list")} />}
          {view === "edit" && selQ && <QuestionBuilder existing={selQ} responseCount={selRespCount} onSave={update} onCancel={() => { setView("list"); setSelQ(null); }} />}
          {view === "results" && selQ && <ResultsTracker questionnaire={selQ} onClose={() => { setView("list"); setSelQ(null); }} />}

          {view === "list" && <div>
            {isAdmin && <button onClick={() => setView("create")}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              <Plus size={16} /> Create New Questionnaire
            </button>}

            {loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !quests.length ? <div style={{ padding: 40, textAlign: "center", color: "#8FA898" }}>
                <ClipboardList size={40} color="#D6E4DB" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, color: "#6B8574" }}>No questionnaires yet</div>
              </div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {quests.map(q => {
                  const expired = new Date(q.end_at) < new Date();
                  const hasConditions = q.questions?.some(qq => qq.condition);
                  return (
                    <div key={q.id} style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid #D6E4DB", background: "#FAFBFA" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23" }}>{q.title}</span>
                            {badge(q.status)}
                            {expired && q.status === "active" && <span style={{ fontSize: 9, color: "#DC3545", fontWeight: 600 }}>EXPIRED</span>}
                            {hasConditions && <span style={{ fontSize: 9, color: "#B5A167", fontWeight: 600 }}>⚡ HAS LOGIC</span>}
                          </div>
                          {q.description && <div style={{ fontSize: 11, color: "#6B8574" }}>{q.description}</div>}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#8FA898", display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
                        <span><Calendar size={10} /> {new Date(q.start_at).toLocaleDateString()}</span>
                        <span><Clock size={10} /> {new Date(q.end_at).toLocaleDateString()}</span>
                        <span>{q.questions?.length || 0} Qs</span>
                        {q.notify_email && <span><Bell size={10} /> {q.notify_email}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => { setSelQ(q); setView("results"); }} style={LB}><BarChart3 size={12} /> Results</button>
                        {isAdmin && <div>
                          <button onClick={() => startEdit(q)} style={LB}><Pencil size={12} /> Edit</button>
                          <button onClick={() => duplicate(q)} style={LB}><Copy size={12} /> Duplicate</button>
                          <button onClick={() => toggle(q)} style={{ ...LB, color: q.status === "active" ? "#D97706" : "#1B7A4A" }}>
                            {q.status === "active" ? "Close" : "Activate"}
                          </button>
                          <button onClick={() => del(q.id)} style={{ ...LB, border: "1px solid #DC3545", color: "#DC3545", background: "#FFF5F5" }}><Trash2 size={12} /> Delete</button>
                        </div>}
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

const LB = { padding: "6px 14px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 };
