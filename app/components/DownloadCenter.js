"use client";
import { useState, useEffect, useMemo } from "react";
import { Download, Upload, Trash2, FileText, Presentation, BarChart3, MapPin, Building2, X, CheckCircle, Lock, Crown, Search, Filter, Eye, FolderOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { canAccess } from "../lib/subscription";
import { SA_REGIONS, SA_CITIES } from "../lib/saudiData";

const DOC_TYPES = [
  { id: "demand_supply_study", label: "Demand & Supply Study", icon: BarChart3, color: "#1B7A4A" },
  { id: "presentation", label: "Presentation", icon: Presentation, color: "#B5A167" },
  { id: "opportunity_info", label: "Opportunity Land Info", icon: MapPin, color: "#D97706" },
  { id: "report", label: "Report", icon: FileText, color: "#6366f1" },
  { id: "other", label: "Other Document", icon: FolderOpen, color: "#6B8574" },
];

export default function DownloadCenter({ onClose }) {
  const { user, profile, isAdmin, tier } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("browse"); // browse|upload
  const [filterType, setFilterType] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upType, setUpType] = useState("demand_supply_study");
  const [upRegion, setUpRegion] = useState("");
  const [upCity, setUpCity] = useState("");
  const [upFile, setUpFile] = useState(null);

  useEffect(() => { fetchDocs(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const fetchDocs = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let f = docs;
    if (filterType !== "All") f = f.filter(d => d.doc_type === filterType);
    if (filterRegion !== "All") f = f.filter(d => d.region === filterRegion);
    if (searchQ) { const q = searchQ.toLowerCase(); f = f.filter(d => d.title.toLowerCase().includes(q) || (d.region || "").toLowerCase().includes(q) || (d.city || "").toLowerCase().includes(q)); }
    return f;
  }, [docs, filterType, filterRegion, searchQ]);

  // Group by type
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(d => {
      if (!g[d.doc_type]) g[d.doc_type] = [];
      g[d.doc_type].push(d);
    });
    return g;
  }, [filtered]);

  const handleUpload = async () => {
    if (!upTitle.trim()) return alert("Title required");
    if (!upFile) return alert("Select a file");
    setUploading(true);

    try {
      // Upload to Supabase Storage
      const ext = upFile.name.split(".").pop();
      const path = `${upType}/${Date.now()}_${upFile.name.replace(new RegExp("\\s","g"), "_")}`;

      const { data: storageData, error: storageErr } = await supabase.storage
        .from("documents")
        .upload(path, upFile, { contentType: upFile.type });

      if (storageErr) throw storageErr;

      // Get public URL
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const fileUrl = urlData?.publicUrl || path;

      // Insert record
      const { data: doc, error: dbErr } = await supabase.from("documents").insert({
        title: upTitle.trim(),
        description: upDesc.trim(),
        doc_type: upType,
        region: upRegion || null,
        city: upCity || null,
        file_url: fileUrl,
        file_name: upFile.name,
        file_size: upFile.size,
        mime_type: upFile.type,
        access_tier: "gold",
        uploaded_by: user.id,
      }).select().single();

      if (dbErr) throw dbErr;

      setDocs(prev => [doc, ...prev]);
      setToast("Document uploaded!");
      setView("browse");
      setUpTitle(""); setUpDesc(""); setUpFile(null); setUpRegion(""); setUpCity("");
    } catch (e) {
      alert("Upload error: " + e.message);
    }
    setUploading(false);
  };

  const handleDownload = async (doc) => {
    if (!canAccess("downloadStudies", tier, isAdmin)) return;

    // Log download
    try {
      await supabase.from("download_log").insert({
        document_id: doc.id,
        user_id: user.id,
        user_email: user.email,
      });
    } catch(e) {}

    // Download file
    if (doc.file_url.startsWith("http")) {
      window.open(doc.file_url, "_blank");
    } else {
      const { data } = await supabase.storage.from("documents").download(doc.file_url);
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url; a.download = doc.file_name; a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const deleteDoc = async (doc) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    // Delete from storage
    try { await supabase.storage.from("documents").remove([doc.file_url]); } catch(e) {}
    // Delete record
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    setToast("Deleted");
  };

  const canDownload = canAccess("downloadStudies", tier, isAdmin);
  const regionName = (id) => SA_REGIONS.find(r => r.id === id)?.name || id || "General";
  const formatSize = (bytes) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  const getTypeInfo = (type) => DOC_TYPES.find(t => t.id === type) || DOC_TYPES[4];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
<div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Download size={22} color="#D4C68E" />
            <div>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>{view === "upload" ? "Upload Document" : "Download Center"}</h2>
              <p style={{ color: "#D4C68E", fontSize: 10, margin: "3px 0 0" }}>{docs.length} documents available · Gold members only</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {isAdmin && view === "browse" && <button onClick={() => setView("upload")} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.15)", color: "#D4C68E", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Upload size={13} /> Upload</button>}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
{view === "upload" && isAdmin && <div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={LS}>Document Title *</label>
                <input value={upTitle} onChange={e => setUpTitle(e.target.value)} placeholder="e.g. Riyadh Healthcare Demand & Supply Study 2026" style={IS} />
              </div>
              <div>
                <label style={LS}>Description</label>
                <textarea value={upDesc} onChange={e => setUpDesc(e.target.value)} placeholder="Brief description..." style={{ ...IS, minHeight: 50, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={LS}>Document Type *</label>
                  <select value={upType} onChange={e => setUpType(e.target.value)} style={IS}>
                    {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Region (optional)</label>
                  <select value={upRegion} onChange={e => setUpRegion(e.target.value)} style={IS}>
                    <option value="">General / All Regions</option>
                    {SA_REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>City (optional)</label>
                  <input value={upCity} onChange={e => setUpCity(e.target.value)} placeholder="e.g. Riyadh" style={IS} />
                </div>
              </div>
              <div>
                <label style={LS}>File (PDF, PPTX, DOCX) *</label>
                <input type="file" accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx" onChange={e => setUpFile(e.target.files[0])}
                  style={{ fontSize: 12, padding: "10px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", background: "#FAFBFA" }} />
                {upFile && <div style={{ fontSize: 10, color: "#6B8574", marginTop: 4 }}>{upFile.name} · {formatSize(upFile.size)}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={handleUpload} disabled={uploading}
                style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: uploading ? "#8FA898" : "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: uploading ? "wait" : "pointer", fontSize: 13, fontWeight: 700 }}>
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
              <button onClick={() => setView("browse")} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>}
{view === "browse" && <div>
<div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 150px" }}>
                <Search size={13} color="#8FA898" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
                <input placeholder="Search documents..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ paddingLeft: 28, fontSize: 12, borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", padding: "8px 10px 8px 28px" }} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 11, padding: "8px 10px", borderRadius: 8, border: "1px solid #D6E4DB", minWidth: 140 }}>
                <option value="All">All Types</option>
                {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ fontSize: 11, padding: "8px 10px", borderRadius: 8, border: "1px solid #D6E4DB", minWidth: 130 }}>
                <option value="All">All Regions</option>
                {SA_REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {!canDownload && <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF3C7", border: "1px solid #FDE68A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={16} color="#D97706" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>Gold subscription required to download</div>
                <div style={{ fontSize: 10, color: "#B45309" }}>You can browse document titles but downloading requires a Gold plan.</div>
              </div>
              <button onClick={onClose} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "none", background: "#B5A167", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                <Crown size={12} /> Upgrade
              </button>
            </div>}

            {loading ? <div style={{ padding: 30, textAlign: "center", color: "#8FA898" }}>Loading...</div> :
              filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#8FA898" }}>
                <FolderOpen size={40} color="#D6E4DB" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, color: "#6B8574" }}>No documents found</div>
                {isAdmin && <div style={{ fontSize: 12, color: "#8FA898", marginTop: 4 }}>Upload studies and presentations for your subscribers</div>}
              </div> :
              Object.entries(grouped).map(([type, typeDocs]) => {
                const typeInfo = getTypeInfo(type);
                const Icon = typeInfo.icon;
                return (
                  <div key={type} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${typeInfo.color}22` }}>
                      <Icon size={16} color={typeInfo.color} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23" }}>{typeInfo.label}</span>
                      <span style={{ fontSize: 10, color: "#8FA898" }}>({typeDocs.length})</span>
                    </div>
                    {typeDocs.map(doc => (
                      <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: "1px solid #D6E4DB", marginBottom: 6, background: "#FAFBFA" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${typeInfo.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={16} color={typeInfo.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                          <div style={{ fontSize: 10, color: "#6B8574", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {doc.region && <span><MapPin size={9} /> {regionName(doc.region)}</span>}
                            {doc.city && <span><Building2 size={9} /> {doc.city}</span>}
                            <span>{formatSize(doc.file_size)}</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                          {doc.description && <div style={{ fontSize: 10, color: "#8FA898", marginTop: 2 }}>{doc.description}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {canDownload ? (
                            <button onClick={() => handleDownload(doc)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                              <Download size={12} /> Download
                            </button>
                          ) : (
                            <div style={{ padding: "6px 12px", borderRadius: 6, background: "#F4F4F5", color: "#D6E4DB", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                              <Lock size={12} /> Gold Only
                            </div>
                          )}
                          {isAdmin && <button onClick={() => deleteDoc(doc)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer" }}><Trash2 size={12} /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            }
          </div>}
        </div>
      </div>
    </div>
  );
}

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
