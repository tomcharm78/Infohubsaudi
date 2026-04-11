"use client";
import { useState, useEffect, useMemo } from "react";
import { X, CheckCircle, SkipForward, ClipboardList, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export default function QuestionnairePopup() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]); // multiple active questionnaires
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) checkActive(); }, [user]);

  const checkActive = async () => {
    try {
      const now = new Date().toISOString();
      const { data: quests } = await supabase
        .from("questionnaires").select("*")
        .lte("start_at", now).gte("end_at", now)
        .eq("status", "active")
        .order("created_at", { ascending: true });
      if (!quests?.length) { setLoading(false); return; }

      // Check which ones user hasn't responded to
      const { data: existing } = await supabase
        .from("responses").select("questionnaire_id")
        .eq("user_id", user.id);
      const answeredIds = new Set((existing || []).map(r => r.questionnaire_id));
      const pending = quests.filter(q => !answeredIds.has(q.id));
      if (!pending.length) { setLoading(false); return; }
      setQueue(pending);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const questionnaire = queue[currentIdx];
  const questions = questionnaire?.questions || [];

  // Conditional logic: determine visible questions based on current answers
  const visibleQuestions = useMemo(() => {
    if (!questions.length) return [];
    return questions.map((q, qi) => {
      if (!q.condition) return { ...q, qi, visible: true };
      // condition format: { questionIndex: number, optionIndex: number }
      const depAnswer = answers[q.condition.questionIndex];
      const visible = depAnswer === q.condition.optionIndex;
      return { ...q, qi, visible };
    });
  }, [questions, answers]);

  const visibleOnly = visibleQuestions.filter(q => q.visible);

  const submitAnswers = async () => {
    if (!questionnaire || !user) return;
    const unanswered = visibleOnly.filter(q => answers[q.qi] === undefined);
    if (unanswered.length) {
      alert(`Please answer all ${visibleOnly.length} visible questions.`);
      return;
    }
    try {
      await supabase.from("responses").insert({
        questionnaire_id: questionnaire.id,
        user_id: user.id, user_email: user.email,
        answers, skipped: false,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setAnswers({});
        if (currentIdx + 1 < queue.length) setCurrentIdx(currentIdx + 1);
        else setDismissed(true);
      }, 1500);
    } catch (e) { alert("Error: " + e.message); }
  };

  const skipQuestionnaire = async () => {
    if (!questionnaire || !user) return;
    try {
      await supabase.from("responses").insert({
        questionnaire_id: questionnaire.id,
        user_id: user.id, user_email: user.email,
        answers: {}, skipped: true,
      });
    } catch (e) { console.error(e); }
    setAnswers({});
    if (currentIdx + 1 < queue.length) setCurrentIdx(currentIdx + 1);
    else setDismissed(true);
  };

  if (loading || dismissed || !questionnaire) return null;

  if (submitted) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", maxWidth: 400 }}>
        <CheckCircle size={48} color="#1B7A4A" />
        <h3 style={{ color: "#1A2E23", fontSize: 20, fontWeight: 700, marginTop: 16 }}>Thank You!</h3>
        <p style={{ color: "#6B8574", fontSize: 13, marginTop: 8 }}>
          {currentIdx + 1 < queue.length ? `Response recorded. Next questionnaire loading...` : "All responses recorded."}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ClipboardList size={22} color="#D4C68E" />
            <div>
              <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>{questionnaire.title}</h2>
              {questionnaire.description && <p style={{ color: "#D4C68E", fontSize: 11, marginTop: 4 }}>{questionnaire.description}</p>}
            </div>
          </div>
          {queue.length > 1 && <span style={{ color: "#D4C68E", fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 6 }}>{currentIdx + 1} of {queue.length}</span>}
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 11, color: "#8FA898", marginBottom: 16 }}>
            {visibleOnly.length} question{visibleOnly.length !== 1 ? "s" : ""} · All visible fields required
          </div>

          {visibleQuestions.map((q) => {
            if (!q.visible) return null;
            return (
              <div key={q.qi} style={{ marginBottom: 18, padding: 16, borderRadius: 10, border: "1px solid #D6E4DB", background: answers[q.qi] !== undefined ? "#E8F5EE" : "#FAFBFA", transition: "all .2s" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2E23", marginBottom: 10 }}>
                  <span style={{ color: "#1B7A4A", fontWeight: 700 }}>Q{q.qi + 1}.</span> {q.question}
                  {q.condition && <span style={{ fontSize: 9, color: "#B5A167", marginLeft: 6 }}>(conditional)</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(q.options || []).map((opt, oi) => (
                    <label key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.qi]: oi }))}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                        border: answers[q.qi] === oi ? "2px solid #1B7A4A" : "1px solid #D6E4DB",
                        background: answers[q.qi] === oi ? "#E8F5EE" : "#fff", transition: "all .15s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: answers[q.qi] === oi ? "6px solid #1B7A4A" : "2px solid #D6E4DB", flexShrink: 0, transition: "all .15s" }} />
                      <span style={{ fontSize: 13, color: answers[q.qi] === oi ? "#1B7A4A" : "#3D5A47", fontWeight: answers[q.qi] === oi ? 600 : 400 }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #D6E4DB", display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button onClick={skipQuestionnaire}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <SkipForward size={15} /> Skip
          </button>
          <button onClick={submitAnswers}
            style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #1B7A4A, #2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 8px rgba(27,122,74,0.3)" }}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
