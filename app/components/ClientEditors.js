"use client";
import { useState, useRef, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { COUNTRIES, GCC_SET } from "../lib/data";

const T = {
  label: {fontSize:10, color:"#6B8574", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:5, display:"block"},
  btnP: {padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:"linear-gradient(135deg,#1B7A4A,#2D9E64)", color:"#fff"},
  btnO: {padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid #D6E4DB", background:"#fff", color:"#1B7A4A"}
};

function mkL(n) {
  return (n || "??").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
}


export function ProfileEditor({investor, onSave, onCancel}) {
  const [d, setD] = useState({...investor});
  const u = (k, v) => setD(p => ({...p, [k]: v}));
  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
        {[
          ["Company","company"],
          ["City","city"],
          ["Website","website"],
          ["Type","type"],
          ["AUM (USD)","aum"],
          ["Total Investments","totalInvestments"],
          ["Active Deals","activeDeals"]
        ].map(([l,k]) =>
          <div key={k}>
            <label style={T.label}>{l}</label>
            <input
              value={d[k] || ""}
              onChange={e => u(k, ["totalInvestments","activeDeals"].includes(k) ? parseInt(e.target.value) || 0 : e.target.value)}
              placeholder={k === "aum" ? "e.g. $2.4B" : ""}
            />
          </div>
        )}
        <div>
          <label style={T.label}>Country</label>
          <select
            value={d.country}
            onChange={e => {
              u("country", e.target.value);
              u("region", GCC_SET.has(e.target.value) ? "GCC" : "Intl");
            }}
          >
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginTop:10}}>
        <label style={T.label}>Description</label>
        <textarea
          value={d.description || ""}
          onChange={e => u("description", e.target.value)}
        />
      </div>
      <div style={{display:"flex", gap:8, marginTop:14}}>
        <button onClick={() => onSave(d)} style={T.btnP}>Save</button>
        <button onClick={onCancel} style={T.btnO}>Cancel</button>
      </div>
    </div>
  );
}

export function ContactsEditor({investor, onSave, onCancel}) {
  const [cs, setCs] = useState(investor.cSuite.map(c => ({...c})));
  return (
    <div>
      {cs.map((c, i) =>
        <div key={i} style={{
          padding:12, marginBottom:8, borderRadius:10,
          border:"1px solid #D6E4DB", background:"#FAFBFA"
        }}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
            <span style={{color:"#6B8574", fontSize:10, fontWeight:600}}>#{i+1}</span>
            {cs.length > 1 &&
              <button
                onClick={() => setCs(cs.filter((_, j) => j !== i))}
                style={{background:"none", border:"none", color:"#DC3545", cursor:"pointer"}}
              >
                <Trash2 size={12}/>
              </button>
            }
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
            {[
              ["Name","name"],
              ["Title","title"],
              ["Email","email"],
              ["Phone","phone"],
              ["LinkedIn URL","linkedin"]
            ].map(([pl, k]) =>
              <input
                key={k}
                placeholder={pl}
                value={c[k] || ""}
                onChange={e => {
                  const n = [...cs];
                  n[i] = {...n[i], [k]: e.target.value};
                  setCs(n);
                }}
                style={{fontSize:12, padding:"8px 10px"}}
              />
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setCs([...cs, {name:"",title:"",email:"",phone:"",linkedin:""}])}
        style={{
          padding:"8px", borderRadius:8, border:"1px dashed #D6E4DB",
          background:"transparent", color:"#1B7A4A", cursor:"pointer",
          fontSize:11, fontWeight:600, width:"100%", textAlign:"center"
        }}
      >
        + Add Contact
      </button>
      <div style={{display:"flex", gap:8, marginTop:14}}>
        <button onClick={() => onSave({...investor, cSuite:cs})} style={T.btnP}>Save</button>
        <button onClick={onCancel} style={T.btnO}>Cancel</button>
      </div>
    </div>
  );
}

export function ImportModal({
  investors, setInvestors, setLogs, onClose, setToast, checkDuplicates
}) {
  const [src, setSrc] = useState("GHE");
  const ref = useRef();
  const [step, setStep] = useState(1);
  const [fd, setFd] = useState(null);
  const [map, setMap] = useState({});

  const EF = [
    {k:"company", l:"Company *"},
    {k:"country", l:"Country"},
    {k:"city", l:"City"},
    {k:"website", l:"Website"},
    {k:"type", l:"Type"},
    {k:"aum", l:"AUM"},
    {k:"domains", l:"Domains"},
    {k:"description", l:"Description"},
    {k:"contact_name", l:"Contact Name"},
    {k:"contact_title", l:"Title"},
    {k:"contact_email", l:"Email"},
    {k:"contact_phone", l:"Phone"}
  ];

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    import("xlsx").then(X => {
      const r = new FileReader();
      r.onload = ev => {
        const wb = X.read(ev.target.result, {type:"array"});
        const d = X.utils.sheet_to_json(
          wb.Sheets[wb.SheetNames[0]], {defval:""}
        );
        if (!d.length) return alert("Empty");
        const h = Object.keys(d[0]);
        const am = {};
        EF.forEach(ef => {
          const m = h.find(hh =>
            hh.toLowerCase()
              .replace(new RegExp("[_\\-\\s]","g"), "")
              .includes(ef.k.replace(new RegExp("_","g"), ""))
          );
          if (m) am[ef.k] = m;
        });
        setFd({headers:h, rows:d, count:d.length, name:f.name});
        setMap(am);
        setStep(2);
      };
      r.readAsArrayBuffer(f);
    });
  };

  const doImport = () => {
    if (!fd || !map.company) return alert("Map Company Name");
    const now = new Date().toISOString();
    let added = 0;
    fd.rows.forEach((r, i) => {
      const g = k => map[k] ? String(r[map[k]] || "") : "";
      const co = g("company").trim();
      if (!co) return;
      const cn = g("country") || "Unknown";
      investors.push({
        id: Date.now() + i,
        company: co,
        country: cn,
        city: g("city"),
        website: g("website"),
        type: g("type") || "Unknown",
        aum: g("aum") || "N/A",
        region: GCC_SET.has(cn) ? "GCC" : "Intl",
        domains: g("domains")
          ? g("domains").split(new RegExp("[;,|]")).map(x => x.trim()).filter(Boolean)
          : [],
        stages: [],
        description: g("description"),
        portfolio: [],
        cSuite: g("contact_name")
          ? [{
              name: g("contact_name"),
              title: g("contact_title"),
              email: g("contact_email"),
              phone: g("contact_phone")
            }]
          : [],
        totalInvestments: 0,
        activeDeals: 0,
        status: "Active",
        source: src,
        logo: mkL(co),
        createdAt: now,
        lastUpdated: now
      });
      added++;
    });
    setInvestors([...investors]);
    setLogs(p => [...p, {date:now, added, source:src}]);
    onClose();
    setToast(added + " imported!");
    setTimeout(() => checkDuplicates(), 300);
  };

  return (
    <div
      style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
        zIndex:1000, display:"flex", alignItems:"center",
        justifyContent:"center", backdropFilter:"blur(6px)"
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:"#fff", borderRadius:16, width:"92%",
        maxWidth:640, maxHeight:"85vh", overflowY:"auto",
        padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.15)"
      }}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:18}}>
          <h3 style={{color:"#1A2E23", fontSize:17, fontWeight:700}}>Import Excel</h3>
          <button
            onClick={onClose}
            style={{background:"none", border:"none", color:"#8FA898", cursor:"pointer"}}
          >
            <X size={18}/>
          </button>
        </div>

        {step === 1 &&
          <div>
            <div style={{marginBottom:14}}>
              <label style={T.label}>Source</label>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {["GHE","Crunchbase","PitchBook","LinkedIn","Custom"].map(s =>
                  <button
                    key={s}
                    onClick={() => setSrc(s)}
                    style={{
                      padding:"7px 16px", borderRadius:8, fontSize:12,
                      fontWeight:600, cursor:"pointer",
                      border: src === s ? "2px solid #1B7A4A" : "1px solid #D6E4DB",
                      background: src === s ? "#E8F5EE" : "#fff",
                      color: src === s ? "#1B7A4A" : "#6B8574"
                    }}
                  >
                    {s}
                  </button>
                )}
              </div>
            </div>
            <div
              onClick={() => ref.current?.click()}
              style={{
                border:"2px dashed #D6E4DB", borderRadius:14,
                padding:"50px 20px", textAlign:"center",
                cursor:"pointer", background:"#FAFBFA"
              }}
            >
              <div style={{fontSize:36, marginBottom:10}}>[File]</div>
              <div style={{color:"#1A2E23", fontSize:14, fontWeight:600}}>
                Upload Excel or CSV
              </div>
              <input
                ref={ref}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                style={{display:"none"}}
              />
            </div>
          </div>
        }

        {step === 2 && fd &&
          <div>
            <div style={{
              padding:"10px 14px", borderRadius:8, marginBottom:14,
              background:"#E8F5EE", color:"#1B7A4A", fontSize:12, fontWeight:600
            }}>
              {fd.name} -- {fd.count} rows
            </div>
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:8, maxHeight:260, overflowY:"auto"
            }}>
              {EF.map(ef =>
                <div key={ef.k}>
                  <label style={{
                    fontSize:9, color:"#6B8574",
                    fontWeight:600, textTransform:"uppercase"
                  }}>
                    {ef.l}
                  </label>
                  <select
                    style={{fontSize:12, marginTop:3}}
                    value={map[ef.k] || ""}
                    onChange={e => setMap({...map, [ef.k]: e.target.value})}
                  >
                    <option value="">-- Skip --</option>
                    {fd.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:16}}>
              <button onClick={onClose} style={T.btnO}>Cancel</button>
              <button
                onClick={doImport}
                style={{...T.btnP, opacity: map.company ? 1 : 0.5}}
              >
                Import {fd.count}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
