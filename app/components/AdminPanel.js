"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { Shield, Users, Settings, Globe, LogOut, ChevronRight, AlertTriangle, Check, UserPlus, Trash2, Crown } from "lucide-react";

const ROLES = [
  { id: "admin", label: "Admin", labelAr: "مدير", color: "#DC2626", desc: "Full access: edit, delete, upload, manage users", descAr: "وصول كامل: تعديل، حذف، رفع، إدارة المستخدمين" },
  { id: "editor", label: "Editor", labelAr: "محرر", color: "#D97706", desc: "Can edit and upload data, but cannot manage users", descAr: "يمكنه التعديل والرفع لكن لا يمكنه إدارة المستخدمين" },
  { id: "viewer", label: "Viewer", labelAr: "مشاهد", color: "#1B7A4A", desc: "View only access, can export data", descAr: "عرض فقط، يمكنه التصدير" },
];

export default function AdminPanel({ lang = "en", onClose }) {
  const { user, profile, isAdmin, signOut, setLanguage } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // users|settings
  const [toast, setToast] = useState(null);
  const isAr = lang === "ar";

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  useEffect(() => { if (toast) { const t2 = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t2); } }, [toast]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) setUsers(data);
    } catch (e) {
      // Fallback: show current user only
      if (profile) setUsers([profile]);
    }
    setLoadingUsers(false);
  };

  const updateRole = async (userId, newRole) => {
    try {
      await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setToast(isAr ? "تم تحديث الدور" : "Role updated");
    } catch (e) {
      setToast(isAr ? "خطأ في التحديث" : "Error updating role");
    }
  };

  const deleteUser = async (userId) => {
    if (userId === user?.id) return alert(isAr ? "لا يمكنك حذف نفسك" : "Cannot delete yourself");
    if (!confirm(isAr ? "حذف هذا المستخدم؟" : "Delete this user?")) return;
    try {
      await supabase.from("profiles").delete().eq("id", userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setToast(isAr ? "تم الحذف" : "User removed");
    } catch (e) {
      setToast(isAr ? "خطأ" : "Error deleting");
    }
  };

  const getRoleBadge = (role) => {
    const r = ROLES.find(x => x.id === role) || ROLES[2];
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}30` }}>
      {role === "admin" && <Crown size={10} />}
      {isAr ? r.labelAr : r.label}
    </span>;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", direction: isAr ? "rtl" : "ltr" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        {toast && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, padding: "8px 16px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} />{toast}</div>}
<div style={{ padding: "18px 24px", borderBottom: "1px solid #D6E4DB", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={22} color="#D4C68E" />
            <div>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{t("settings.adminPanel", lang)}</h2>
              <div style={{ color: "#D4C68E", fontSize: 10 }}>{profile?.email} · {getRoleBadge(profile?.role)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✕ {isAr ? "إغلاق" : "Close"}</button>
        </div>
<div style={{ display: "flex", borderBottom: "1px solid #D6E4DB" }}>
          {[["users", Users, isAr ? "المستخدمين" : "Users"], ["settings", Settings, isAr ? "الإعدادات" : "Settings"]].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex: 1, padding: "12px", border: "none", borderBottom: activeTab === id ? "3px solid #1B7A4A" : "3px solid transparent", background: activeTab === id ? "#E8F5EE" : "#fff", color: activeTab === id ? "#1B7A4A" : "#6B8574", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
{activeTab === "users" && <div>
            {!isAdmin && <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", fontSize: 12, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={16} />{isAr ? "فقط المدير يمكنه إدارة المستخدمين" : "Only admins can manage users"}
            </div>}

            <div style={{ marginBottom: 16, fontSize: 12, color: "#6B8574" }}>
              {isAr ? `${users.length} مستخدم مسجل` : `${users.length} registered user(s)`}
            </div>

            {loadingUsers ? <div style={{ textAlign: "center", color: "#8FA898", padding: 30 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div> :
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {users.map(u => (
                  <div key={u.id} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #D6E4DB", background: u.id === user?.id ? "#E8F5EE" : "#FAFBFA", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2E23" }}>{u.full_name || u.email?.split("@")[0] || "User"}</div>
                      <div style={{ fontSize: 11, color: "#6B8574", marginTop: 2 }}>{u.email}</div>
                      <div style={{ marginTop: 4 }}>{getRoleBadge(u.role)}</div>
                    </div>
                    {isAdmin && u.id !== user?.id && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D6E4DB", fontSize: 11, background: "#fff" }}>
                          {ROLES.map(r => <option key={r.id} value={r.id}>{isAr ? r.labelAr : r.label}</option>)}
                        </select>
                        <button onClick={() => deleteUser(u.id)}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    {u.id === user?.id && <span style={{ fontSize: 10, color: "#1B7A4A", fontWeight: 600 }}>{isAr ? "أنت" : "You"}</span>}
                  </div>
                ))}
              </div>
            }
<div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: "#FAFBFA", border: "1px solid #E8EFE9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", marginBottom: 10 }}>{isAr ? "صلاحيات الأدوار" : "Role Permissions"}</div>
              {ROLES.map(r => (
                <div key={r.id} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  {getRoleBadge(r.id)}
                  <span style={{ fontSize: 11, color: "#6B8574" }}>{isAr ? r.descAr : r.desc}</span>
                </div>
              ))}
            </div>
          </div>}
{activeTab === "settings" && <div>
<div style={{ padding: 18, borderRadius: 10, border: "1px solid #D6E4DB", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Globe size={16} color="#1B7A4A" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23" }}>{t("settings.language", lang)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setLanguage("en")}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: lang === "en" ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: lang === "en" ? "#E8F5EE" : "#fff", color: lang === "en" ? "#1B7A4A" : "#6B8574", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                  English
                </button>
                <button onClick={() => setLanguage("ar")}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: lang === "ar" ? "2px solid #1B7A4A" : "1px solid #D6E4DB", background: lang === "ar" ? "#E8F5EE" : "#fff", color: lang === "ar" ? "#1B7A4A" : "#6B8574", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center", fontFamily: "Arial" }}>
                  العربية
                </button>
              </div>
            </div>
<button onClick={async () => { await signOut(); onClose(); }}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <LogOut size={15} /> {t("auth.logout", lang)}
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
}
