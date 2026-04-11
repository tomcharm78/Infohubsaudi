"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle, ChevronRight, KeyRound, Mail, CheckCircle } from "lucide-react";

const PATHWAYS = [
  { id: "investor", icon: "💰", label: "Healthcare Investor", labelAr: "مستثمر صحي", desc: "PE, VC, Family Office, Sovereign Fund, CSR Fund", color: "#1B7A4A" },
  { id: "seeker", icon: "🏥", label: "Healthcare Seeker", labelAr: "باحث عن تمويل", desc: "Hospital, Clinic, Startup, Developer, Operator", color: "#3B82F6" },
  { id: "partner", icon: "🤝", label: "NGO / Impact Partner", labelAr: "شريك / منظمة غير ربحية", desc: "NGO, Foundation, Development Agency, Impact Fund", color: "#8B5CF6" },
];

export default function AuthScreen({ lang = "en" }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("login"); // login|signup|forgot|reset_sent
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const isAr = lang === "ar";

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return setError("Email and password required");
    setError(""); setLoading(true);
    try { await signIn(email, password); } catch (e) {
      if (e.message?.includes("Invalid login")) setError("Incorrect email or password. Try again or reset your password.");
      else if (e.message?.includes("Email not confirmed")) setError("Please check your email and click the verification link before logging in.");
      else setError(e.message);
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!userType) return setError("Please select your pathway");
    if (!name.trim()) return setError("Name is required");
    if (!email.trim()) return setError("Email is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setError(""); setLoading(true);
    try {
      const { data } = await signUp(email, password, name);
      if (data?.user?.id) {
        // Wait for profile to be created by trigger, then update it
        setTimeout(async () => {
          try {
            // Check if this is the first user → make admin
            const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
            const isFirstUser = count <= 1;

            await supabase.from("profiles").update({
              user_type: userType,
              organization: org,
              phone: phone,
              full_name: name,
              ...(isFirstUser ? { role: "admin" } : {}),
            }).eq("id", data.user.id);
          } catch(e) {}
        }, 1500);
      }

      if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setSuccess("Account created! Check your email for a verification link, then log in.");
        setMode("login");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return setError("Enter your email address first");
    setError(""); setLoading(true);
    try {
      await resetPassword(email);
      setMode("reset_sent");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (mode === "forgot") handleForgotPassword();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0D3D24, #1B7A4A, #145C38)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", direction: isAr ? "rtl" : "ltr" }}>
      <div style={{ width: "100%", maxWidth: mode === "signup" && step === 1 ? 560 : 420, padding: 32, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", margin: 20, transition: "max-width .3s" }}>
<div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#1B7A4A,#2D9E64)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>H</span>
          </div>
          <h1 style={{ color: "#1B7A4A", fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{t("app.title", lang)}</h1>
          <p style={{ color: "#B5A167", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{t("app.subtitle", lang)}</p>
        </div>
{(mode === "login" || mode === "signup") && <div style={{ display: "flex", marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1px solid #D6E4DB" }}>
          <button onClick={() => { setMode("login"); setStep(1); setError(""); setSuccess(""); }} style={{ flex: 1, padding: "10px", border: "none", background: mode === "login" ? "#1B7A4A" : "#fff", color: mode === "login" ? "#fff" : "#6B8574", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <LogIn size={15} /> {t("auth.login", lang)}
          </button>
          <button onClick={() => { setMode("signup"); setStep(1); setError(""); setSuccess(""); }} style={{ flex: 1, padding: "10px", border: "none", background: mode === "signup" ? "#1B7A4A" : "#fff", color: mode === "signup" ? "#fff" : "#6B8574", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <UserPlus size={15} /> {t("auth.signup", lang)}
          </button>
        </div>}

        {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 12, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 6 }}><AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}</div>}
        {success && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#E8F5EE", border: "1px solid #B8DCC8", color: "#1B7A4A", fontSize: 12, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 6 }}><CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{success}</div>}
{mode === "login" && <div style={{ display: "flex", flexDirection: "column", gap: 14 }} onKeyDown={handleKeyDown}>
          <div><label style={LS}>{t("auth.email", lang)}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={IS} /></div>
          <div><label style={LS}>{t("auth.password", lang)}</label>
            <div style={{ position: "relative" }}><input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...IS, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8FA898" }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button onClick={() => { setMode("forgot"); setError(""); }} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "right", padding: 0 }}>Forgot password?</button>
          <button onClick={handleLogin} disabled={loading} style={BTN}>{loading ? "Signing in..." : t("auth.login", lang)}</button>
        </div>}
{mode === "forgot" && <div style={{ display: "flex", flexDirection: "column", gap: 14 }} onKeyDown={handleKeyDown}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <KeyRound size={32} color="#1B7A4A" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2E23" }}>Reset Your Password</div>
            <div style={{ fontSize: 12, color: "#6B8574", marginTop: 4 }}>Enter your email and we'll send a reset link</div>
          </div>
          <div><label style={LS}>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={IS} /></div>
          <button onClick={handleForgotPassword} disabled={loading} style={BTN}>
            <Mail size={16} /> {loading ? "Sending..." : "Send Reset Link"}
          </button>
          <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#6B8574", cursor: "pointer", fontSize: 12 }}>← Back to login</button>
        </div>}
{mode === "reset_sent" && <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircle size={48} color="#1B7A4A" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A2E23", marginTop: 16 }}>Check Your Email</h3>
          <p style={{ fontSize: 13, color: "#6B8574", marginTop: 8, lineHeight: 1.6 }}>We've sent a password reset link to <b>{email}</b>. Click the link in the email to set a new password.</p>
          <p style={{ fontSize: 11, color: "#8FA898", marginTop: 12 }}>Didn't receive it? Check your spam folder or wait a few minutes.</p>
          <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={{ ...BTN, marginTop: 20 }}>Back to Login</button>
        </div>}
{mode === "signup" && step === 1 && <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2E23", marginBottom: 14, textAlign: "center" }}>{isAr ? "أنا..." : "I am a..."}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {PATHWAYS.map(p => (
              <button key={p.id} onClick={() => setUserType(p.id)}
                style={{ padding: "16px 18px", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all .15s", display: "flex", alignItems: "center", gap: 14,
                  border: userType === p.id ? `2px solid ${p.color}` : "1px solid #D6E4DB",
                  background: userType === p.id ? `${p.color}08` : "#fff" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: userType === p.id ? p.color : "#1A2E23" }}>{isAr ? p.labelAr : p.label}</div>
                  <div style={{ fontSize: 11, color: "#6B8574", marginTop: 2 }}>{p.desc}</div>
                </div>
                {userType === p.id && <div style={{ width: 20, height: 20, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>}
              </button>
            ))}
          </div>
          <button onClick={() => { if (!userType) { setError("Please select your pathway"); return; } setError(""); setStep(2); }} disabled={!userType}
            style={{ ...BTN, opacity: userType ? 1 : 0.5 }}>
            Continue <ChevronRight size={16} />
          </button>
        </div>}
{mode === "signup" && step === 2 && <div>
          <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#1B7A4A", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 12, padding: 0 }}>← Back to pathway selection</button>

          <div style={{ padding: "8px 14px", borderRadius: 8, background: `${PATHWAYS.find(p => p.id === userType)?.color}10`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{PATHWAYS.find(p => p.id === userType)?.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: PATHWAYS.find(p => p.id === userType)?.color }}>{PATHWAYS.find(p => p.id === userType)?.label}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={LS}>{isAr ? "الاسم الكامل" : "Full Name"} *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={IS} /></div>
            <div><label style={LS}>{isAr ? "المؤسسة" : "Organization"}</label><input value={org} onChange={e => setOrg(e.target.value)} placeholder={userType === "investor" ? "e.g. Al Rajhi Capital" : userType === "seeker" ? "e.g. Riyadh Medical Center" : "e.g. Saudi Red Crescent"} style={IS} /></div>
            <div><label style={LS}>{isAr ? "رقم الجوال" : "Phone"}</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5XX XXX XXXX" style={IS} /></div>
            <div><label style={LS}>{t("auth.email", lang)} *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={IS} /></div>
            <div><label style={LS}>{t("auth.password", lang)} *</label>
              <div style={{ position: "relative" }}><input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" style={{ ...IS, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8FA898" }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "#DBEAFE", border: "1px solid #93C5FD", fontSize: 10, color: "#1E40AF" }}>
              📧 You'll receive a verification email after signing up. Please click the link to activate your account before logging in.
            </div>
            <button onClick={handleSignup} disabled={loading} style={BTN}>{loading ? "Creating account..." : "Create Account"}</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

const LS = { fontSize: 11, color: "#6B8574", fontWeight: 600, display: "block", marginBottom: 5 };
const IS = { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #D6E4DB", fontSize: 13, outline: "none" };
const BTN = { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1B7A4A, #2D9E64)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(27,122,74,0.3)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
