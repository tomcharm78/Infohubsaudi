"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FileText, Plus, X, CheckCircle, Send, Pencil, Trash2, Eye, Clock, Users, Shield, Download, AlertTriangle, Check, ChevronRight, PenTool, Type, Calendar, DollarSign, Building2, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const TYPES = [
  { id: "investment_agreement", label: "Investment Agreement", icon: "💰", color: "#1B7A4A" },
  { id: "service_agreement", label: "Service / Operating Agreement", icon: "🏥", color: "#3B82F6" },
  { id: "partnership_mou", label: "Partnership MOU", icon: "🤝", color: "#8B5CF6" },
  { id: "funding_agreement", label: "Funding Agreement", icon: "🎯", color: "#D97706" },
];

const STATUS_MAP = {
  draft: { label: "Draft", color: "#6B8574", bg: "#F4F6F5" },
  sent: { label: "Sent", color: "#3B82F6", bg: "#DBEAFE" },
  party_a_signed: { label: "Party A Signed", color: "#D97706", bg: "#FEF3C7" },
  party_b_signed: { label: "Party B Signed", color: "#D97706", bg: "#FEF3C7" },
  active: { label: "Active", color: "#1B7A4A", bg: "#E8F5EE" },
  completed: { label: "Completed", color: "#6B8574", bg: "#F4F6F5" },
  terminated: { label: "Terminated", color: "#DC2626", bg: "#FEF2F2" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2" },
};

// ===== SIGNATURE PAD =====
function SignaturePad({ onSave, onCancel, signerName }) {
  const [mode, setMode] = useState("draw"); // draw|type
  const [typedName, setTypedName] = useState(signerName || "");
  const [typedFont, setTypedFont] = useState("cursive");
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 400, 150);
      ctx.strokeStyle = "#1A2E23";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [mode]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e); };
  const moveDraw = (e) => {
    if (!drawing.current) return; e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };
  const endDraw = () => { drawing.current = false; };
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 400, 150);
  };

  const handleSave = () => {
    if (mode === "draw") {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSave({ type: "draw", data: dataUrl, name: signerName });
    } else {
      onSave({ type: "typed", name: typedName, font: typedFont });
    }
  };

  return (
    <div style={{ padding: 20, background: "#fff", borderRadius: 14, border: "1px solid #D6E4DB" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 14 }}>Sign this contract</div>
<div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setMode("draw")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: mode === "draw" ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: mode === "draw" ? "#E8F5EE" : "#fff", color: mode === "draw" ? "#1B7A4A" : "#6B8574", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <PenTool size={14} /> Draw Signature
        </button>
        <button onClick={() => setMode("type")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: mode === "type" ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: mode === "type" ? "#E8F5EE" : "#fff", color: mode === "type" ? "#1B7A4A" : "#6B8574", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Type size={14} /> Type Signature
        </button>
      </div>
{mode === "draw" && <div>
        <div style={{ border: "2px solid #D6E4DB", borderRadius: 10, overflow: "hidden", marginBottom: 8, background: "#fff" }}>
          <canvas ref={canvasRef} width={400} height={150} style={{ width: "100%", height: 150, cursor: "crosshair", touchAction: "none" }}
            onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} />
        </div>
        <button onClick={clearCanvas} style={{ fontSize: 10, color: "#6B8574", background: "none", border: "1px solid #D6E4DB", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>Clear</button>
      </div>}
{mode === "type" && <div>
        <input value={typedName} onChange={e => setTypedName(e.target.value)} placeholder="Type your full name"
          style={{ fontSize: 14, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {["cursive", "'Dancing Script', cursive", "'Pacifico', cursive", "serif"].map((f, i) => (
            <button key={i} onClick={() => setTypedFont(f)} style={{ flex: 1, padding: "10px 6px", borderRadius: 8, border: typedFont === f ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: typedFont === f ? "#E8F5EE" : "#fff", cursor: "pointer", fontFamily: f, fontSize: 16, color: "#1A2E23" }}>
              {typedName || "Signature"}
            </button>
          ))}
        </div>
        <div style={{ padding: "16px", borderRadius: 10, background: "#FAFBFA", border: "1px dashed #D6E4DB", textAlign: "center" }}>
          <div style={{ fontFamily: typedFont, fontSize: 28, color: "#1A2E23" }}>{typedName || "Your Name"}</div>
          <div style={{ fontSize: 9, color: "#8FA898", marginTop: 4 }}>Signature Preview</div>
        </div>
      </div>}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={handleSave} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Confirm Signature</button>
        <button onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ===== CONTRACT FORM =====
function ContractForm({ onSave, onCancel, existing, users, allowedTypes = TYPES }) {
  const [type, setType] = useState(existing?.contract_type || "investment_agreement");
  const [title, setTitle] = useState(existing?.title || "");
  const [desc, setDesc] = useState(existing?.description || "");
  const [terms, setTerms] = useState(existing?.terms || "");
  const [partyAEmail, setPartyAEmail] = useState(existing?.party_a_email || "");
  const [partyAName, setPartyAName] = useState(existing?.party_a_name || "");
  const [partyAOrg, setPartyAOrg] = useState(existing?.party_a_org || "");
  const [partyBEmail, setPartyBEmail] = useState(existing?.party_b_email || "");
  const [partyBName, setPartyBName] = useState(existing?.party_b_name || "");
  const [partyBOrg, setPartyBOrg] = useState(existing?.party_b_org || "");
  const [amount, setAmount] = useState(existing?.amount || "");
  const [currency, setCurrency] = useState(existing?.currency || "USD");
  const [payTerms, setPayTerms] = useState(existing?.payment_terms || "");
  const [startDate, setStartDate] = useState(existing?.start_date || "");
  const [endDate, setEndDate] = useState(existing?.end_date || "");
  const [saving, setSaving] = useState(false);

  const fillParty = (email, setter, nameSetter, orgSetter) => {
    const u = users.find(u => u.email === email);
    if (u) { nameSetter(u.full_name || ""); orgSetter(u.organization || ""); }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Title required");
    if (!partyAEmail.trim() || !partyBEmail.trim()) return alert("Both party emails required");
    setSaving(true);
    const partyA = users.find(u => u.email === partyAEmail);
    const partyB = users.find(u => u.email === partyBEmail);
    await onSave({
      ...(existing || {}),
      contract_type: type, title: title.trim(), description: desc, terms,
      party_a_id: partyA?.id || null, party_a_email: partyAEmail, party_a_name: partyAName, party_a_org: partyAOrg,
      party_b_id: partyB?.id || null, party_b_email: partyBEmail, party_b_name: partyBName, party_b_org: partyBOrg,
      amount, currency, payment_terms: payTerms,
      start_date: startDate || null, end_date: endDate || null,
    });
    setSaving(false);
  };

  const typeInfo = TYPES.find(t => t.id === type);

  return (
    <div style={{ maxHeight: "72vh", overflowY: "auto" }}>
{allowedTypes.length === 1 && <div style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${allowedTypes[0].color}`, background: `${allowedTypes[0].color}08`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{allowedTypes[0].icon}</span>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: allowedTypes[0].color }}>{allowedTypes[0].label}</div>
        <div style={{ fontSize: 10, color: "#8FA898" }}>Your subscription tier allows this contract type</div></div>
      </div>}
      {allowedTypes.length > 1 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {allowedTypes.map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ padding: "12px", borderRadius: 10, border: type === t.id ? `2px solid ${t.color}` : "1px solid #D6E4DB", background: type === t.id ? `${t.color}08` : "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: type === t.id ? t.color : "#6B8574" }}>{t.label}</span>
          </button>
        ))}
      </div>}

      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={LS}>Contract Title *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder={`e.g. ${typeInfo?.label} -- ${new Date().getFullYear()}`} style={IS} /></div>
        <div><label style={LS}>Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of the agreement..." style={{ ...IS, minHeight: 50 }} /></div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 10, border: "1px solid #1B7A4A33", background: "#E8F5EE08" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>Party A (Initiator)</div>
            <div style={{ marginBottom: 6 }}><label style={LS}>Email *</label>
              <select value={partyAEmail} onChange={e => { setPartyAEmail(e.target.value); fillParty(e.target.value, setPartyAEmail, setPartyAName, setPartyAOrg); }} style={IS}>
                <option value="">Select user...</option>
                {users.map(u => <option key={u.id} value={u.email}>{u.email} ({u.full_name || u.user_type})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 6 }}><label style={LS}>Name</label><input value={partyAName} onChange={e => setPartyAName(e.target.value)} style={IS} /></div>
            <div><label style={LS}>Organization</label><input value={partyAOrg} onChange={e => setPartyAOrg(e.target.value)} style={IS} /></div>
          </div>
          <div style={{ padding: 14, borderRadius: 10, border: "1px solid #3B82F633", background: "#DBEAFE08" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", marginBottom: 8 }}>Party B (Counterparty)</div>
            <div style={{ marginBottom: 6 }}><label style={LS}>Email *</label>
              <select value={partyBEmail} onChange={e => { setPartyBEmail(e.target.value); fillParty(e.target.value, setPartyBEmail, setPartyBName, setPartyBOrg); }} style={IS}>
                <option value="">Select user...</option>
                {users.map(u => <option key={u.id} value={u.email}>{u.email} ({u.full_name || u.user_type})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 6 }}><label style={LS}>Name</label><input value={partyBName} onChange={e => setPartyBName(e.target.value)} style={IS} /></div>
            <div><label style={LS}>Organization</label><input value={partyBOrg} onChange={e => setPartyBOrg(e.target.value)} style={IS} /></div>
          </div>
        </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10 }}>
          <div><label style={LS}>Amount</label><input value={amount} onChange={e => setAmount(e.target.value)} placeholder="$500,000" style={IS} /></div>
          <div><label style={LS}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={IS}><option>USD</option><option>SAR</option><option>EUR</option><option>GBP</option></select></div>
          <div><label style={LS}>Payment Terms</label><input value={payTerms} onChange={e => setPayTerms(e.target.value)} placeholder="e.g. 50% upfront, 50% on completion" style={IS} /></div>
        </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={LS}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={IS} /></div>
          <div><label style={LS}>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={IS} /></div>
        </div>
<div><label style={LS}>Terms & Conditions</label><textarea value={terms} onChange={e => setTerms(e.target.value)} placeholder="Enter the full terms of this agreement..." style={{ ...IS, minHeight: 120, resize: "vertical" }} /></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: saving ? "#8FA898" : "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 700 }}>
          {saving ? "Saving..." : existing?.id ? "Update Contract" : "Create Contract"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ===== CONTRACT DETAIL VIEW =====
function ContractDetail({ contract, onBack, onUpdate, currentUserId, isAdmin }) {
  const [showSign, setShowSign] = useState(false);
  const [audit, setAudit] = useState([]);
  const isPartyA = currentUserId === contract.party_a_id;
  const isPartyB = currentUserId === contract.party_b_id;
  const canSign = (isPartyA && !contract.party_a_signature) || (isPartyB && !contract.party_b_signature);
  const needsSign = contract.status === "sent" || contract.status === "party_a_signed" || contract.status === "party_b_signed";
  const typeInfo = TYPES.find(t => t.id === contract.contract_type) || TYPES[0];
  const statusInfo = STATUS_MAP[contract.status] || STATUS_MAP.draft;

  useEffect(() => {
    supabase.from("contract_audit").select("*").eq("contract_id", contract.id).order("created_at", { ascending: false }).then(({ data }) => setAudit(data || []));
  }, [contract.id]);

  const handleSign = async (sigData) => {
    const updates = {};
    if (isPartyA) { updates.party_a_signature = sigData; updates.party_a_signed_at = new Date().toISOString(); }
    else if (isPartyB) { updates.party_b_signature = sigData; updates.party_b_signed_at = new Date().toISOString(); }

    // Determine new status
    const aSigned = isPartyA ? true : !!contract.party_a_signature;
    const bSigned = isPartyB ? true : !!contract.party_b_signature;
    if (aSigned && bSigned) updates.status = "active";
    else if (aSigned) updates.status = "party_a_signed";
    else if (bSigned) updates.status = "party_b_signed";

    updates.updated_at = new Date().toISOString();
    await supabase.from("contracts").update(updates).eq("id", contract.id);
    await supabase.from("contract_audit").insert({ contract_id: contract.id, action: "signed", performed_by: currentUserId, details: { party: isPartyA ? "A" : "B" } });
    setShowSign(false);
    onUpdate();
  };

  const renderSignature = (sig) => {
    if (!sig) return <div style={{ color: "#8FA898", fontSize: 11, fontStyle: "italic" }}>Not yet signed</div>;
    if (sig.type === "draw") return <img src={sig.data} alt="Signature" style={{ maxHeight: 50, borderRadius: 4 }} />;
    return <div style={{ fontFamily: sig.font || "cursive", fontSize: 22, color: "#1A2E23" }}>{sig.name}</div>;
  };

  const downloadPDF = () => {
    const h = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:20mm}body{font-family:Arial;color:#1A2E23;font-size:12px;line-height:1.6}.hdr{background:#1B7A4A;color:#fff;padding:20px;border-radius:8px;margin-bottom:14px}.hdr h1{font-size:18px;margin:0}.hdr p{color:#D4C68E;font-size:10px;margin:3px 0 0}.gb{height:3px;background:linear-gradient(90deg,#B5A167,#D4C68E);margin-bottom:16px}h2{color:#1B7A4A;font-size:14px;border-bottom:2px solid #B5A167;padding-bottom:5px;margin-top:20px}.row{display:flex;gap:20px;margin-bottom:10px}.col{flex:1}.lbl{font-size:9px;color:#6B8574;text-transform:uppercase;font-weight:bold}.val{font-size:12px;color:#1A2E23;margin-top:2px}.sig{border:1px solid #D6E4DB;border-radius:8px;padding:16px;margin-top:10px;text-align:center}.ft{margin-top:30px;border-top:2px solid #B5A167;padding-top:8px;font-size:8px;color:#8FA898;text-align:center}.terms{background:#FAFBFA;padding:16px;border-radius:8px;border:1px solid #D6E4DB;white-space:pre-wrap}</style></head><body>`;
    const c = contract;
    let b = `<div class="hdr"><h1>${typeInfo.icon} ${c.title}</h1><p>Contract #${c.contract_number} · Status: ${statusInfo.label} · Generated ${new Date().toLocaleDateString()}</p></div><div class="gb"></div>`;
    b += `<div class="row"><div class="col"><div class="lbl">Contract Type</div><div class="val">${typeInfo.label}</div></div><div class="col"><div class="lbl">Amount</div><div class="val">${c.amount || "--"} ${c.currency}</div></div></div>`;
    b += `<div class="row"><div class="col"><div class="lbl">Start Date</div><div class="val">${c.start_date || "--"}</div></div><div class="col"><div class="lbl">End Date</div><div class="val">${c.end_date || "--"}</div></div></div>`;
    b += `<h2>Party A</h2><div class="row"><div class="col"><div class="lbl">Name</div><div class="val">${c.party_a_name}</div></div><div class="col"><div class="lbl">Organization</div><div class="val">${c.party_a_org || "--"}</div></div><div class="col"><div class="lbl">Email</div><div class="val">${c.party_a_email}</div></div></div>`;
    b += `<h2>Party B</h2><div class="row"><div class="col"><div class="lbl">Name</div><div class="val">${c.party_b_name}</div></div><div class="col"><div class="lbl">Organization</div><div class="val">${c.party_b_org || "--"}</div></div><div class="col"><div class="lbl">Email</div><div class="val">${c.party_b_email}</div></div></div>`;
    if (c.terms) b += `<h2>Terms & Conditions</h2><div class="terms">${c.terms}</div>`;
    b += `<h2>Signatures</h2><div class="row"><div class="col sig"><div class="lbl">Party A: ${c.party_a_name}</div>${c.party_a_signature ? (c.party_a_signature.type === "draw" ? `<img src="${c.party_a_signature.data}" style="max-height:50px">` : `<div style="font-family:${c.party_a_signature.font};font-size:24px">${c.party_a_signature.name}</div>`) : "<div style='color:#8FA898'>Not signed</div>"}<div style="font-size:9px;color:#8FA898;margin-top:4px">${c.party_a_signed_at ? new Date(c.party_a_signed_at).toLocaleString() : ""}</div></div>`;
    b += `<div class="col sig"><div class="lbl">Party B: ${c.party_b_name}</div>${c.party_b_signature ? (c.party_b_signature.type === "draw" ? `<img src="${c.party_b_signature.data}" style="max-height:50px">` : `<div style="font-family:${c.party_b_signature.font};font-size:24px">${c.party_b_signature.name}</div>`) : "<div style='color:#8FA898'>Not signed</div>"}<div style="font-size:9px;color:#8FA898;margin-top:4px">${c.party_b_signed_at ? new Date(c.party_b_signed_at).toLocaleString() : ""}</div></div></div>`;
    b += `<div class="ft">Healthcare Investor Intelligence Platform · Contract #${c.contract_number} · CONFIDENTIAL</div></body></html>`;
    const blob = new Blob([h + b], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Contract_${c.contract_number}.html`; a.click();
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14, padding: 0 }}>← Back to contracts</button>
<div style={{ padding: 18, borderRadius: 12, background: `${typeInfo.color}08`, border: `1px solid ${typeInfo.color}22`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{typeInfo.icon}</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A2E23", margin: 0 }}>{contract.title}</h3>
            </div>
            <div style={{ fontSize: 11, color: "#6B8574" }}>#{contract.contract_number} · {typeInfo.label}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
            <button onClick={downloadPDF} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><Download size={12} /> PDF</button>
          </div>
        </div>
      </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 14, borderRadius: 10, border: "1px solid #D6E4DB" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>Party A</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2E23" }}>{contract.party_a_name}</div>
          <div style={{ fontSize: 11, color: "#6B8574" }}>{contract.party_a_org}</div>
          <div style={{ fontSize: 11, color: "#8FA898" }}>{contract.party_a_email}</div>
          <div style={{ marginTop: 8 }}>{renderSignature(contract.party_a_signature)}</div>
          {contract.party_a_signed_at && <div style={{ fontSize: 9, color: "#1B7A4A", marginTop: 4 }}>✅ Signed {new Date(contract.party_a_signed_at).toLocaleString()}</div>}
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: "1px solid #D6E4DB" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", marginBottom: 8 }}>Party B</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2E23" }}>{contract.party_b_name}</div>
          <div style={{ fontSize: 11, color: "#6B8574" }}>{contract.party_b_org}</div>
          <div style={{ fontSize: 11, color: "#8FA898" }}>{contract.party_b_email}</div>
          <div style={{ marginTop: 8 }}>{renderSignature(contract.party_b_signature)}</div>
          {contract.party_b_signed_at && <div style={{ fontSize: 9, color: "#1B7A4A", marginTop: 4 }}>✅ Signed {new Date(contract.party_b_signed_at).toLocaleString()}</div>}
        </div>
      </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["Amount", contract.amount ? `${contract.amount} ${contract.currency}` : "--", DollarSign], ["Payment Terms", contract.payment_terms || "--", FileText], ["Start", contract.start_date || "--", Calendar], ["End", contract.end_date || "--", Calendar]].map(([l, v, I], i) => (
          <div key={i} style={{ padding: 12, borderRadius: 8, background: "#FAFBFA", border: "1px solid #E8EFE9", textAlign: "center" }}>
            <I size={14} color="#6B8574" style={{ marginBottom: 4 }} /><div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>{v}</div><div style={{ fontSize: 8, color: "#8FA898", textTransform: "uppercase" }}>{l}</div>
          </div>
        ))}
      </div>
{contract.terms && <div style={{ padding: 16, borderRadius: 10, border: "1px solid #D6E4DB", background: "#FAFBFA", marginBottom: 16, whiteSpace: "pre-wrap", fontSize: 12, color: "#3D5A47", lineHeight: 1.7 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>Terms & Conditions</div>
        {contract.terms}
      </div>}
{needsSign && canSign && !showSign && (
        <button onClick={() => setShowSign(true)} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          <PenTool size={16} /> Sign this Contract
        </button>
      )}

      {showSign && <div style={{ marginBottom: 16 }}><SignaturePad signerName={isPartyA ? contract.party_a_name : contract.party_b_name} onSave={handleSign} onCancel={() => setShowSign(false)} /></div>}
{audit.length > 0 && <div style={{ padding: 14, borderRadius: 10, border: "1px solid #D6E4DB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 8 }}>Audit Trail</div>
        {audit.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 8, fontSize: 11, color: "#6B8574", marginBottom: 4, alignItems: "center" }}>
            <Clock size={10} /> <span>{new Date(a.created_at).toLocaleString()}</span> · <span style={{ fontWeight: 600, color: "#1A2E23" }}>{a.action}</span>
            {a.performed_by_email && <span>by {a.performed_by_email}</span>}
          </div>
        ))}
      </div>}
    </div>
  );
}

// ===== MAIN CONTRACT MANAGER =====
export default function ContractManager({ onClose }) {
  const { user, profile, isAdmin } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selContract, setSelContract] = useState(null);
  const [editContract, setEditContract] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchAll = async () => {
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from("contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,email,full_name,organization,user_type,subscription_tier"),
    ]);
    setContracts(c || []); setUsers(u || []); setLoading(false);
  };

  const filtered = useMemo(() => {
    let f = contracts;
    if (filterStatus !== "All") f = f.filter(c => c.status === filterStatus);
    if (filterType !== "All") f = f.filter(c => c.contract_type === filterType);
    if (searchQ) { const q = searchQ.toLowerCase(); f = f.filter(c => c.title.toLowerCase().includes(q) || c.party_a_name?.toLowerCase().includes(q) || c.party_b_name?.toLowerCase().includes(q) || c.contract_number?.toLowerCase().includes(q)); }
    return f;
  }, [contracts, filterStatus, filterType, searchQ]);

  const createContract = async (data) => {
    const { data: created, error } = await supabase.from("contracts").insert({ ...data, contract_number: "", created_by: user.id, status: "draft" }).select().single();
    if (error) return alert("Error: " + error.message);
    await supabase.from("contract_audit").insert({ contract_id: created.id, action: "created", performed_by: user.id, performed_by_email: user.email });
    setContracts(prev => [created, ...prev]); setView("list"); setToast("Contract created!");
  };

  const updateContract = async (data) => {
    const { error } = await supabase.from("contracts").update({ ...data, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) return alert("Error: " + error.message);
    await supabase.from("contract_audit").insert({ contract_id: data.id, action: "updated", performed_by: user.id, performed_by_email: user.email });
    fetchAll(); setView("list"); setEditContract(null); setToast("Updated!");
  };

  const sendContract = async (c) => {
    await supabase.from("contracts").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", c.id);
    await supabase.from("contract_audit").insert({ contract_id: c.id, action: "sent", performed_by: user.id, performed_by_email: user.email });
    fetchAll(); setToast("Contract sent to parties!");
  };

  const deleteContract = async (id) => {
    if (!confirm("Delete this contract?")) return;
    await supabase.from("contract_audit").delete().eq("contract_id", id);
    await supabase.from("contracts").delete().eq("id", id);
    setContracts(prev => prev.filter(c => c.id !== id)); setToast("Deleted");
  };

  const changeStatus = async (id, status) => {
    await supabase.from("contracts").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("contract_audit").insert({ contract_id: id, action: `status_changed_to_${status}`, performed_by: user.id, performed_by_email: user.email });
    fetchAll(); setToast(`Status: ${status}`);
  };

  // Stats
  const stats = useMemo(() => {
    const byStatus = {}; contracts.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
    const byType = {}; contracts.forEach(c => { byType[c.contract_type] = (byType[c.contract_type] || 0) + 1; });
    return { total: contracts.length, byStatus, byType };
  }, [contracts]);

  // Access control
  const userTier = profile?.subscription_tier || "basic";
  const userType = profile?.user_type || "investor";
  const isSilver = userTier === "silver";
  const isGold = userTier === "gold";
  const canCreateAll = isAdmin || isGold || ["investor","partner"].includes(userType);
  const canCreateMOU = isSilver; // Silver can ONLY create MOU
  const canCreate = canCreateAll || canCreateMOU;

  // Silver: filter to only MOU types they can create
  const allowedTypes = canCreateAll ? TYPES : canCreateMOU ? TYPES.filter(t => t.id === "partnership_mou") : [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={22} color="#D4C68E" />
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>
              {view === "create" ? "New Contract" : view === "edit" ? "Edit Contract" : view === "detail" ? "Contract Details" : "Contracts"}
            </h2>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {view === "list" && <span style={{ color: "#D4C68E", fontSize: 11, background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 6 }}>{stats.total} total</span>}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {view === "create" && <ContractForm users={users} allowedTypes={allowedTypes} onSave={createContract} onCancel={() => setView("list")} />}
          {view === "edit" && editContract && <ContractForm existing={editContract} users={users} allowedTypes={allowedTypes} onSave={updateContract} onCancel={() => { setView("list"); setEditContract(null); }} />}
          {view === "detail" && selContract && <ContractDetail contract={selContract} currentUserId={user.id} isAdmin={isAdmin} onBack={() => { setView("list"); setSelContract(null); }} onUpdate={fetchAll} />}

          {view === "list" && <div>
{canCreate && <button onClick={() => setView("create")} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              <Plus size={16} /> {canCreateMOU && !canCreateAll ? "New Partnership MOU" : "New Contract"}
            </button>}
            {!canCreate && <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF3C7", border: "1px solid #FDE68A", marginBottom: 16, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} /> Upgrade to Silver (MOU only) or Gold (all contract types) to create contracts. You can still view and sign contracts sent to you.
            </div>}
<div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 150px" }}><Search size={13} color="#8FA898" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
                <input placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ paddingLeft: 28, fontSize: 12, borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", padding: "8px 10px 8px 28px" }} /></div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 11, padding: "8px 10px", borderRadius: 8, border: "1px solid #D6E4DB" }}>
                <option value="All">All Status</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 11, padding: "8px 10px", borderRadius: 8, border: "1px solid #D6E4DB" }}>
                <option value="All">All Types</option>{TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            </div>
{isAdmin && <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {Object.entries(stats.byStatus).map(([s, n]) => {
                const si = STATUS_MAP[s]; return <span key={s} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: si?.bg, color: si?.color }}>{si?.label}: {n}</span>;
              })}
            </div>}
{loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              !filtered.length ? <div style={{ padding: 40, textAlign: "center", color: "#8FA898" }}><FileText size={40} color="#D6E4DB" /><div style={{ marginTop: 8, fontSize: 14, color: "#6B8574" }}>No contracts</div></div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(c => {
                  const ti = TYPES.find(t => t.id === c.contract_type) || TYPES[0];
                  const si = STATUS_MAP[c.status] || STATUS_MAP.draft;
                  return (
                    <div key={c.id} style={{ padding: "14px 18px", borderRadius: 10, border: `1px solid ${ti.color}22`, background: "#FAFBFA", cursor: "pointer" }} onClick={() => { setSelContract(c); setView("detail"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{ti.icon}</span>
                          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23" }}>{c.title}</div>
                            <div style={{ fontSize: 10, color: "#8FA898" }}>#{c.contract_number} · {ti.label}</div></div>
                        </div>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: si.bg, color: si.color, flexShrink: 0 }}>{si.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#6B8574", marginBottom: 8 }}>
                        <span>A: {c.party_a_name} {c.party_a_signature ? "✅" : "⏳"}</span>
                        <span>B: {c.party_b_name} {c.party_b_signature ? "✅" : "⏳"}</span>
                        {c.amount && <span>{c.amount} {c.currency}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                        {c.status === "draft" && (c.created_by === user.id || isAdmin) && (canCreateAll || (canCreateMOU && c.contract_type === "partnership_mou")) && <button onClick={() => sendContract(c)} style={LBT}><Send size={11} /> Send</button>}
                        {c.status === "draft" && (c.created_by === user.id || isAdmin) && (canCreateAll || (canCreateMOU && c.contract_type === "partnership_mou")) && <button onClick={() => { setEditContract(c); setView("edit"); }} style={LBT}><Pencil size={11} /> Edit</button>}
                        {isAdmin && <div>
                          {c.status === "active" && <button onClick={() => changeStatus(c.id, "completed")} style={LBT}>Complete</button>}
                          {c.status === "active" && <button onClick={() => changeStatus(c.id, "terminated")} style={{ ...LBT, color: "#DC3545", border: "1px solid #DC3545" }}>Terminate</button>}
                          <button onClick={() => deleteContract(c.id)} style={{ ...LBT, color: "#DC3545", border: "1px solid #DC3545" }}><Trash2 size={11} /></button>
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

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
const LBT = { padding: "5px 12px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 };
