"use client";
import { useState, useEffect, useMemo } from "react";
import { Check, X, Crown, Sparkles, Tag, Shield, Clock, CreditCard, AlertTriangle, CheckCircle, Star, ArrowUp, ArrowDown, Users, Copy, Lock, Gift, Bell, Search, Percent } from "lucide-react";
import { TIERS, TIER_ORDER, getPrice, applyPromo, yearlySaving } from "../lib/subscription";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export default function SubscriptionPage({ onClose }) {
  const { user, profile, isAdmin } = useAuth();
  const [period, setPeriod] = useState("monthly");
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoData, setPromoData] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // {type,tier,direction}
  const [allUsers, setAllUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const currentTier = profile?.subscription_tier || "basic";
  const isPromoActive = settings.launch_promo_active === true || settings.launch_promo_active === "true";
  const isMembershipOpen = settings.membership_open !== false && settings.membership_open !== "false";

  useEffect(() => { fetchSettings(); if (isAdmin) fetchUsers(); generateReferralCode(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("admin_settings").select("*");
      const s = {};
      (data || []).forEach(r => { try { s[r.key] = typeof r.value === "string" ? JSON.parse(r.value) : r.value; } catch(e) { s[r.key] = r.value; } });
      setSettings(s);
    } catch(e) {}
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id,email,full_name,subscription_tier,subscription_status,user_type").order("created_at", { ascending: false });
    setAllUsers(data || []);
  };

  const generateReferralCode = async () => {
    if (!user) return;
    const code = "REF-" + user.id.slice(0, 8).toUpperCase();
    setReferralCode(code);
    // Ensure code exists in promo_codes table
    try {
      const { data: existing } = await supabase.from("promo_codes").select("id").eq("code", code).limit(1);
      if (!existing?.length) {
        await supabase.from("promo_codes").insert({
          code, discount_pct: 10, discount_type: "percentage", discount_value: 10,
          max_uses: 0, target_tier: "all", is_active: true,
          valid_until: new Date(Date.now() + 365 * 86400000).toISOString(),
          created_by: user.id,
        });
      }
    } catch(e) {}
  };

  const updateSetting = async (key, value) => {
    await supabase.from("admin_settings").upsert({ key, value: JSON.stringify(value), updated_by: user.id, updated_at: new Date().toISOString() });
    setSettings(prev => ({ ...prev, [key]: value }));
    setToast("Setting updated");
  };

  // Validate promo code against promo_codes table
  const validatePromo = async () => {
    if (!promoCode.trim()) { setPromoValid(null); return; }
    try {
      const { data } = await supabase.from("promo_codes").select("*").eq("code", promoCode.trim().toUpperCase()).eq("is_active", true).limit(1);
      if (data?.length) {
        const pc = data[0];
        // Check expiry
        if (pc.valid_until && new Date(pc.valid_until) < new Date()) { setPromoValid(false); setPromoDiscount(0); return; }
        // Check max uses
        if (pc.max_uses > 0 && pc.current_uses >= pc.max_uses) { setPromoValid(false); setPromoDiscount(0); return; }
        // Check tier target
        if (pc.target_tier !== "all" && pc.target_tier !== currentTier) { setPromoValid(false); setPromoDiscount(0); return; }
        setPromoValid(true);
        setPromoDiscount(pc.discount_type === "percentage" ? Number(pc.discount_value) : 0);
        setPromoData(pc);
      } else {
        // Fallback: check legacy admin_settings code
        const legacyCode = settings.promo_code_text || "HEALTH5";
        const legacyActive = settings.promo_code_active === true || settings.promo_code_active === "true";
        if (legacyActive && promoCode.trim().toUpperCase() === legacyCode.toString().toUpperCase()) {
          setPromoValid(true); setPromoDiscount(Number(settings.promo_code_discount_pct || 5)); setPromoData(null);
        } else { setPromoValid(false); setPromoDiscount(0); }
      }
    } catch(e) { setPromoValid(false); setPromoDiscount(0); }
  };

  // Handle subscribe/upgrade/downgrade
  const handleTierChange = (tierId) => {
    if (tierId === currentTier) return;
    const currentIdx = TIER_ORDER.indexOf(currentTier);
    const newIdx = TIER_ORDER.indexOf(tierId);
    const direction = newIdx > currentIdx ? "upgrade" : "downgrade";

    // Membership closed for new signups (but existing paid members can change)
    if (!isMembershipOpen && currentTier === "basic" && !isAdmin) {
      setToast("Membership registration is currently closed. Please check back later.");
      return;
    }

    setConfirmAction({ tier: tierId, direction });
  };

  const executeChange = async () => {
    if (!confirmAction) return;
    const { tier: tierId, direction } = confirmAction;
    setProcessing(tierId);

    try {
      if (tierId === "basic") {
        // Downgrade to free
        await supabase.from("profiles").update({
          subscription_tier: "basic",
          subscription_status: "cancelled",
        }).eq("id", user.id);
        setToast("Downgraded to Basic. Paid features remain until current period ends.");
      } else {
        // Upgrade or switch paid tier
        const price = getPrice(tierId, period, isPromoActive);
        let finalUsd = price.usd;
        if (promoValid && promoDiscount > 0) finalUsd = applyPromo(price.usd, promoDiscount).final;
        const finalSar = Math.round(finalUsd * 3.75);

        await supabase.from("payments").insert({
          user_id: user.id, amount_usd: finalUsd, amount_sar: finalSar,
          tier: tierId, period, promo_code: promoValid ? promoCode : null,
          discount_pct: promoValid ? promoDiscount : 0, status: "completed",
        });

        // Track promo usage
        if (promoValid && promoData?.id) {
          await supabase.from("promo_usage").insert({ promo_id: promoData.id, code: promoData.code, user_id: user.id, user_email: user.email });
          await supabase.from("promo_codes").update({ current_uses: (promoData.current_uses || 0) + 1 }).eq("id", promoData.id);
        }

        const now = new Date();
        const expires = new Date(now);
        if (period === "yearly") expires.setFullYear(expires.getFullYear() + 1);
        else expires.setMonth(expires.getMonth() + 1);

        await supabase.from("profiles").update({
          subscription_tier: tierId, subscription_status: "active",
          subscription_period: period, subscription_started_at: now.toISOString(),
          subscription_expires_at: expires.toISOString(),
        }).eq("id", user.id);

        setToast(`${direction === "upgrade" ? "Upgraded" : "Switched"} to ${TIERS[tierId].name}!`);
      }
      setConfirmAction(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) { alert("Error: " + e.message); }
    setProcessing(null);
  };

  // Admin: change user tier
  const adminChangeTier = async (userId, email, newTier) => {
    const { error } = await supabase.from("profiles").update({ subscription_tier: newTier }).eq("id", userId);
    if (error) return alert(error.message);
    // Send notification
    await supabase.from("notifications").insert({
      user_id: userId, title: `Subscription ${TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(allUsers.find(u => u.id === userId)?.subscription_tier || "basic") ? "Upgraded" : "Changed"}`,
      message: `Your subscription has been ${newTier === "basic" ? "reset to Basic (Free)" : `changed to ${TIERS[newTier].name}`} by the administrator.`,
      type: "system",
    });
    fetchUsers(); setToast(`${email} → ${TIERS[newTier].name}`);
  };

  // Copy referral code
  const copyReferral = () => { navigator.clipboard?.writeText(referralCode); setToast(`Copied: ${referralCode}`); };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#1B7A4A" }}>Loading...</div>;

  const tierIcons = { basic: Shield, silver: Star, gold: Crown };
  const filteredUsers = adminSearch ? allUsers.filter(u => u.email?.toLowerCase().includes(adminSearch.toLowerCase()) || u.full_name?.toLowerCase().includes(adminSearch.toLowerCase())) : allUsers;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", overflowY: "auto", padding: "20px 0" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}
{confirmAction && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 420, width: "90%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: confirmAction.direction === "upgrade" ? "#E8F5EE" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            {confirmAction.direction === "upgrade" ? <ArrowUp size={28} color="#1B7A4A" /> : <ArrowDown size={28} color="#D97706" />}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A2E23", marginBottom: 8 }}>
            {confirmAction.direction === "upgrade" ? "Upgrade" : "Downgrade"} to {TIERS[confirmAction.tier].name}?
          </h3>
          {confirmAction.tier === "basic" ? (
            <p style={{ fontSize: 13, color: "#6B8574", lineHeight: 1.6, marginBottom: 20 }}>
              Your paid features will remain active until the end of your current billing period. After that, you'll revert to the Basic (free) tier with limited access. <b>No refund will be issued.</b>
            </p>
          ) : (
            <p style={{ fontSize: 13, color: "#6B8574", lineHeight: 1.6, marginBottom: 20 }}>
              You'll be {confirmAction.direction === "upgrade" ? "upgraded" : "switched"} to <b>{TIERS[confirmAction.tier].name}</b> ({period}).
              {promoValid && ` Promo code ${promoCode} applied for ${promoDiscount}% off.`}
              {" "}Your new plan starts immediately.
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={executeChange} disabled={!!processing} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: confirmAction.direction === "upgrade" ? "linear-gradient(135deg,#1B7A4A,#2D9E64)" : "linear-gradient(135deg,#D97706,#F59E0B)", color: "#fff", cursor: processing ? "wait" : "pointer", fontSize: 13, fontWeight: 700 }}>
              {processing ? "Processing..." : `Confirm ${confirmAction.direction === "upgrade" ? "Upgrade" : "Downgrade"}`}
            </button>
            <button onClick={() => setConfirmAction(null)} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      </div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 820, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
<div style={{ padding: "20px 28px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", textAlign: "center", position: "relative" }}>
          {!isMembershipOpen && <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "#DC3545", color: "#fff", padding: "4px", fontSize: 10, fontWeight: 700, textAlign: "center" }}>⚠ NEW MEMBERSHIP REGISTRATION IS CURRENTLY CLOSED</div>}
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginTop: !isMembershipOpen ? 10 : 0 }}>Choose Your Plan</h2>
          <p style={{ color: "#D4C68E", fontSize: 12, marginTop: 6 }}>
            {isPromoActive && <span style={{ background: "rgba(255,255,255,0.15)", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, marginRight: 8 }}>🎉 EARLY BIRD LAUNCH PROMO</span>}
            Upgrade, downgrade, or switch plans anytime
          </p>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>

        <div style={{ padding: "24px 28px" }}>
<div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", borderRadius: 10, border: "1px solid #D6E4DB", overflow: "hidden" }}>
              <button onClick={() => setPeriod("monthly")} style={{ padding: "10px 24px", border: "none", background: period === "monthly" ? "#1B7A4A" : "#fff", color: period === "monthly" ? "#fff" : "#6B8574", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Monthly</button>
              <button onClick={() => setPeriod("yearly")} style={{ padding: "10px 24px", border: "none", background: period === "yearly" ? "#1B7A4A" : "#fff", color: period === "yearly" ? "#fff" : "#6B8574", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Yearly <span style={{ fontSize: 10, color: period === "yearly" ? "#D4C68E" : "#D97706", marginLeft: 4 }}>Save up to {yearlySaving("gold", isPromoActive)}%</span>
              </button>
            </div>
          </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {TIER_ORDER.map(tid => {
              const tier = TIERS[tid];
              const Icon = tierIcons[tid];
              const price = getPrice(tid, period, isPromoActive);
              const regPrice = getPrice(tid, period, false);
              const isCurrent = currentTier === tid;
              const currentIdx = TIER_ORDER.indexOf(currentTier);
              const thisIdx = TIER_ORDER.indexOf(tid);
              const isUpgrade = thisIdx > currentIdx;
              const isDowngrade = thisIdx < currentIdx;
              let finalPrice = price;
              if (promoValid && promoDiscount > 0 && tid !== "basic") {
                const applied = applyPromo(price.usd, promoDiscount);
                finalPrice = { usd: applied.final, sar: Math.round(applied.final * 3.75) };
              }
              const saving = yearlySaving(tid, isPromoActive);
              const isPopular = tid === "gold";

              return (
                <div key={tid} style={{
                  padding: "24px 20px", borderRadius: 14, textAlign: "center", position: "relative",
                  border: isPopular ? "2px solid #B5A167" : isCurrent ? "2px solid #1B7A4A" : "1px solid #D6E4DB",
                  background: isPopular ? "#FFFBF0" : isCurrent ? "#E8F5EE" : "#fff",
                  boxShadow: isPopular ? "0 4px 20px rgba(181,161,103,0.15)" : "none",
                }}>
                  {isPopular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#B5A167", color: "#fff", padding: "3px 14px", borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>MOST POPULAR</div>}
                  {isCurrent && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#1B7A4A", color: "#fff", padding: "3px 14px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>CURRENT PLAN</div>}

                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tier.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Icon size={22} color={tier.color} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A2E23" }}>{tier.name}</h3>
                  <div style={{ fontSize: 11, color: "#8FA898", marginBottom: 12 }}>{tier.nameAr}</div>

                  {tid === "basic" ? <div style={{ fontSize: 28, fontWeight: 800, color: "#1B7A4A", marginBottom: 16 }}>Free</div> : <div>
                    {isPromoActive && regPrice.usd > price.usd && <div style={{ fontSize: 13, color: "#DC3545", textDecoration: "line-through" }}>${regPrice.usd}/{period === "yearly" ? "yr" : "mo"}</div>}
                    <div style={{ fontSize: 28, fontWeight: 800, color: tid === "gold" ? "#B5A167" : "#1A2E23", marginBottom: 4 }}>${Math.round(finalPrice.usd)}<span style={{ fontSize: 13, fontWeight: 500, color: "#6B8574" }}>/{period === "yearly" ? "yr" : "mo"}</span></div>
                    <div style={{ fontSize: 11, color: "#B5A167", fontWeight: 600 }}>{finalPrice.sar} SAR</div>
                    {period === "yearly" && saving > 0 && <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, marginTop: 4 }}>Save {saving}%</div>}
                    {isPromoActive && <div style={{ fontSize: 9, color: "#D97706", fontWeight: 600, marginTop: 2 }}>🎉 Launch promo</div>}
                    {promoValid && promoDiscount > 0 && <div style={{ fontSize: 9, color: "#16A34A", fontWeight: 600 }}>+{promoDiscount}% promo applied</div>}
                  </div>}

                  <div style={{ textAlign: "left", margin: "16px 0" }}>
                    {[["Dashboard & Map", true], ["Directory", tid === "basic" ? "Fuzzy" : "Full"], ["AI Advisor", tid === "basic" ? false : tid === "silver" ? "2 Q/mo" : "15 Q/mo"], ["Deal Flow", tid === "basic" ? "Browse" : true], ["Export Excel/Report", tid !== "basic"], ["Contracts (MOU)", tid !== "basic"], ["All Contract Types", tid === "gold"], ["Download Studies/PDF", tid === "gold"], ["Admin Consultation", tid === "gold"]
                    ].map(([feat, avail], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontSize: 10, color: avail === true || avail === "Full" ? "#3D5A47" : avail === "Fuzzy" ? "#D97706" : "#D6E4DB" }}>
                        {avail === true || avail === "Full" ? <Check size={12} color="#1B7A4A" /> : avail === "Fuzzy" || avail === "Browse" ? <AlertTriangle size={12} color="#D97706" /> : typeof avail === "string" ? <Check size={12} color="#1B7A4A" /> : <X size={12} color="#D6E4DB" />}
                        <span>{feat}{avail === "Fuzzy" ? " (blurred)" : avail === "Browse" ? " (browse only)" : typeof avail === "string" && avail !== "Full" ? ` (${avail})` : ""}</span>
                      </div>
                    ))}
                  </div>
{isCurrent ? <div style={{ padding: "10px", borderRadius: 8, background: "#E8F5EE", color: "#1B7A4A", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Check size={14} /> Current Plan</div>
                  : isUpgrade ? <button onClick={() => handleTierChange(tid)} disabled={!!processing || (!isMembershipOpen && currentTier === "basic" && !isAdmin)}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: (!isMembershipOpen && currentTier === "basic" && !isAdmin) ? "#D6E4DB" : tid === "gold" ? "linear-gradient(135deg,#B5A167,#D4C68E)" : "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: tid === "gold" ? "#1A2E23" : "#fff", cursor: (!isMembershipOpen && currentTier === "basic" && !isAdmin) ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <ArrowUp size={14} /> Upgrade
                    </button>
                  : <button onClick={() => handleTierChange(tid)} disabled={!!processing}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D97706", background: "#FFFBEB", color: "#D97706", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <ArrowDown size={14} /> Downgrade
                    </button>}
                </div>
              );
            })}
          </div>
<div style={{ padding: 16, borderRadius: 10, border: "1px solid #D6E4DB", background: "#FAFBFA", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Tag size={13} /> Have a promo or referral code?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={promoCode} onChange={e => { setPromoCode(e.target.value); setPromoValid(null); }} placeholder="Enter code (e.g. GHE2025, REF-XXXXXXXX)" style={{ flex: 1, fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB" }} />
              <button onClick={validatePromo} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1B7A4A", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Apply</button>
            </div>
            {promoValid === true && <div style={{ marginTop: 6, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>✅ Code applied! {promoDiscount}% discount{promoData?.discount_type === "free_trial_days" ? ` + ${promoData.discount_value} days free trial` : ""}</div>}
            {promoValid === false && <div style={{ marginTop: 6, fontSize: 11, color: "#DC3545", fontWeight: 600 }}>❌ Invalid, expired, or already used code</div>}
          </div>
{(currentTier === "silver" || currentTier === "gold") && <div style={{ padding: 16, borderRadius: 10, border: "1px solid #B5A167", background: "#FFFBF0", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A167", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Gift size={13} /> Your Referral Code -- Share & Earn</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #D4C68E", fontSize: 16, fontWeight: 800, color: "#B5A167", letterSpacing: 2, fontFamily: "monospace" }}>{referralCode}</div>
              <button onClick={copyReferral} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#B5A167", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Copy size={14} /> Copy</button>
            </div>
            <div style={{ fontSize: 10, color: "#8C7B4A", marginTop: 6 }}>Share this code with others. When they subscribe using your code, you get 1 month free and they get 10% off their first subscription.</div>
          </div>}
{currentTier !== "basic" && <CancelSubscription user={user} profile={profile} currentTier={currentTier} setToast={setToast} />}
<EmailPreferences user={user} profile={profile} setToast={setToast} />
<ComparisonTable />
{isAdmin && <div>
            <button onClick={() => setShowAdmin(!showAdmin)} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "2px solid #B5A167", background: "#F9F5EA", color: "#8C7B4A", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              <Shield size={14} /> {showAdmin ? "Hide" : "Show"} Admin Controls
            </button>

            {showAdmin && <div style={{ padding: 18, borderRadius: 10, border: "2px solid #B5A167", background: "#FFFBF0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8C7B4A", marginBottom: 14 }}>Admin Subscription Controls</div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E8EFE9" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>🚪 Membership Registration</div>
                  <div style={{ fontSize: 10, color: "#6B8574" }}>
                    {isMembershipOpen ? "New users CAN register and upgrade" : "New users CANNOT upgrade (existing paid members unaffected)"}
                  </div>
                </div>
                <button onClick={() => {
                  const msg = isMembershipOpen
                    ? "Close membership registration? New Basic users will NOT be able to upgrade to paid tiers. Existing Silver/Gold members will NOT be affected -- their access continues normally."
                    : "Open membership registration? New users will be able to upgrade to paid tiers again.";
                  if (confirm(msg)) updateSetting("membership_open", !isMembershipOpen);
                }}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: isMembershipOpen ? "#1B7A4A" : "#DC3545", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  {isMembershipOpen ? "✅ OPEN" : "🔒 CLOSED"}
                </button>
              </div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E8EFE9" }}>
                <div><div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>🎉 Launch Promo</div><div style={{ fontSize: 10, color: "#6B8574" }}>Early bird pricing</div></div>
                <button onClick={() => updateSetting("launch_promo_active", !isPromoActive)} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: isPromoActive ? "#1B7A4A" : "#D6E4DB", color: isPromoActive ? "#fff" : "#6B8574", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{isPromoActive ? "ON" : "OFF"}</button>
              </div>
<div style={{ padding: "12px 0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23", marginBottom: 8 }}>👥 Manage Member Tiers</div>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <Search size={13} color="#8FA898" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="Search by email or name..." style={{ width: "100%", paddingLeft: 28, fontSize: 12, padding: "8px 10px 8px 28px", borderRadius: 6, border: "1px solid #D6E4DB" }} />
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #D6E4DB", borderRadius: 8 }}>
                  {filteredUsers.slice(0, 20).map(u => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: "1px solid #F0F4F1", fontSize: 11 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#1A2E23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name || u.email}</div>
                        <div style={{ fontSize: 9, color: "#8FA898" }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                        {["basic", "silver", "gold"].map(t => (
                          <button key={t} onClick={() => adminChangeTier(u.id, u.email, t)}
                            style={{ padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: "pointer",
                              border: u.subscription_tier === t ? `2px solid ${TIERS[t].color}` : "1px solid #D6E4DB",
                              background: u.subscription_tier === t ? `${TIERS[t].color}15` : "#fff",
                              color: u.subscription_tier === t ? TIERS[t].color : "#8FA898" }}>
                            {TIERS[t].badge}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: "#8FA898", marginTop: 4 }}>Click a tier badge to change a user's subscription. User will be notified.</div>
              </div>
            </div>}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ===== CANCEL SUBSCRIPTION =====
function CancelSubscription({ user, profile, currentTier, setToast }) {
  const [showCancel, setShowCancel] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState("");

  const expiresAt = profile?.subscription_expires_at;
  const expiresDate = expiresAt ? new Date(expiresAt) : null;
  const daysLeft = expiresDate ? Math.max(0, Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const isCancelled = profile?.subscription_status === "cancelled";

  const handleCancel = async () => {
    if (confirmText !== "CANCEL") return;
    setProcessing(true);
    try {
      // Mark subscription as cancelled -- access continues until expiry
      await supabase.from("profiles").update({
        subscription_status: "cancelled",
        auto_renew: false,
      }).eq("id", user.id);

      // Record cancellation
      await supabase.from("visitor_log").insert({
        user_id: user.id, user_email: user.email,
        subscription_tier: currentTier, page: "subscription",
        action: "unsubscribe", metadata: { reason, tier: currentTier, expires: expiresAt },
      });

      // Notify admins
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      for (const a of (admins || [])) {
        await supabase.from("notifications").insert({
          user_id: a.id,
          title: `⚠️ Subscription Cancelled -- ${profile?.full_name || user.email}`,
          message: `${profile?.full_name || user.email} (${currentTier}) has cancelled their subscription. Reason: ${reason || "Not provided"}. Access continues until ${expiresDate ? expiresDate.toLocaleDateString() : "end of period"}.`,
          type: "system",
        });
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Subscription Cancelled",
        message: `Your ${currentTier} subscription has been cancelled. You will retain full access until ${expiresDate ? expiresDate.toLocaleDateString() : "the end of your billing period"}. After that, your account will revert to Basic (free). Your card will NOT be charged again.`,
        type: "system",
      });

      setToast("Subscription cancelled. Access continues until " + (expiresDate ? expiresDate.toLocaleDateString() : "end of period"));
      setShowCancel(false);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) { alert("Error: " + e.message); }
    setProcessing(false);
  };

  if (isCancelled) {
    return (
      <div style={{ padding: 16, borderRadius: 10, border: "1px solid #FDE68A", background: "#FFFBEB", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={14} /> Subscription Cancelled
        </div>
        <div style={{ fontSize: 11, color: "#B45309", lineHeight: 1.6 }}>
          Your {currentTier} access continues until <b>{expiresDate ? expiresDate.toLocaleDateString() : "end of billing period"}</b> ({daysLeft} days remaining). After that, your account will revert to Basic (free). Your card will not be charged again.
        </div>
        <div style={{ fontSize: 10, color: "#8C7B4A", marginTop: 8 }}>Changed your mind? You can upgrade again anytime from the plans above.</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {!showCancel ? (
        <button onClick={() => setShowCancel(true)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #FCA5A5", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <X size={14} /> Cancel Subscription
        </button>
      ) : (
        <div style={{ padding: 18, borderRadius: 10, border: "2px solid #DC3545", background: "#FEF2F2" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#DC3545", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={18} /> Cancel Your Subscription
          </div>
          <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.7, marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #FECACA" }}>
            <b>What happens when you cancel:</b><br />
            • Your {currentTier} access continues until <b>{expiresDate ? expiresDate.toLocaleDateString() : "end of your current billing period"}</b><br />
            • After that date, your account reverts to <b>Basic (free)</b><br />
            • Your card will <b>NOT</b> be charged again<br />
            • Your marketplace cards, contracts, and data are preserved<br />
            • You lose access to premium features (full directory, contracts, downloads, AI advisor quota)<br />
            • You can re-subscribe anytime
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, color: "#6B8574", fontWeight: 600, display: "block", marginBottom: 4 }}>Why are you cancelling? (optional)</label>
            <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D6E4DB", fontSize: 12 }}>
              <option value="">Select a reason...</option>
              <option value="too_expensive">Too expensive</option>
              <option value="not_using">Not using the features enough</option>
              <option value="found_alternative">Found an alternative</option>
              <option value="missing_features">Missing features I need</option>
              <option value="temporary">Temporary -- I'll come back later</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, color: "#DC3545", fontWeight: 700, display: "block", marginBottom: 4 }}>Type CANCEL to confirm</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value.toUpperCase())} placeholder="Type CANCEL" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: confirmText === "CANCEL" ? "2px solid #DC3545" : "1px solid #D6E4DB", fontSize: 14, fontWeight: 700, textAlign: "center", letterSpacing: 4 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCancel} disabled={confirmText !== "CANCEL" || processing}
              style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: confirmText === "CANCEL" ? "#DC3545" : "#FCA5A5", color: "#fff", cursor: confirmText === "CANCEL" ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, opacity: confirmText === "CANCEL" ? 1 : 0.5 }}>
              {processing ? "Cancelling..." : "Confirm Cancellation"}
            </button>
            <button onClick={() => { setShowCancel(false); setConfirmText(""); setReason(""); }}
              style={{ padding: "12px 24px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Keep Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== EMAIL PREFERENCES =====
function EmailPreferences({ user, profile, setToast }) {
  const [prefs, setPrefs] = useState({
    email_promos: profile?.email_promos !== false,
    email_alerts: profile?.email_alerts !== false,
    email_deals: profile?.email_deals !== false,
    email_digest: profile?.email_digest !== false,
  });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const savePrefs = async (newPrefs) => {
    setSaving(true);
    setPrefs(newPrefs);
    await supabase.from("profiles").update(newPrefs).eq("id", user.id);
    setToast("Email preferences updated");
    setSaving(false);
  };

  const unsubscribeAll = async () => {
    const allOff = { email_promos: false, email_alerts: false, email_deals: false, email_digest: false };
    await savePrefs(allOff);
  };

  return (
    <div style={{ marginBottom: 16, borderRadius: 10, border: "1px solid #D6E4DB", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "12px 16px", background: "#FAFBFA", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23", display: "flex", alignItems: "center", gap: 6 }}>
          <Bell size={14} color="#6B8574" /> Email & Notification Preferences
        </span>
        <span style={{ fontSize: 11, color: "#6B8574" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "12px 16px", borderTop: "1px solid #D6E4DB" }}>
        {[
          { key: "email_promos", label: "Promotional emails", desc: "Promo codes, special offers, launch announcements" },
          { key: "email_alerts", label: "Regulatory alerts", desc: "MOH, MISA, SFDA regulation changes and updates" },
          { key: "email_deals", label: "Deal notifications", desc: "New deals matching your interests, expressions of interest" },
          { key: "email_digest", label: "Weekly digest", desc: "Weekly summary of platform activity, news, and opportunities" },
        ].map(item => (
          <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #E8EFE9" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2E23" }}>{item.label}</div>
              <div style={{ fontSize: 10, color: "#8FA898" }}>{item.desc}</div>
            </div>
            <button onClick={() => savePrefs({ ...prefs, [item.key]: !prefs[item.key] })} disabled={saving}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background .2s",
                background: prefs[item.key] ? "#1B7A4A" : "#D6E4DB" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "left .2s",
                left: prefs[item.key] ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <button onClick={unsubscribeAll} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #DC3545", background: "#FFF5F5", color: "#DC3545", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
            Unsubscribe from all emails
          </button>
          <div style={{ fontSize: 9, color: "#8FA898", alignSelf: "center" }}>In-app notifications are always on</div>
        </div>
      </div>}
    </div>
  );
}

// ===== FEATURE COMPARISON TABLE =====
function ComparisonTable() {
  const [open, setOpen] = useState(false);

  const Y = <span style={{ color: "#1B7A4A", fontWeight: 700 }}>✓</span>;
  const N = <span style={{ color: "#D6E4DB" }}>--</span>;
  const G = (t) => <span style={{ color: "#B5A167", fontWeight: 600, fontSize: 9 }}>{t}</span>;

  const SECTIONS = [
    { title: "📊 Core Intelligence", rows: [
      ["Interactive Dashboard & Charts", Y, Y, Y],
      ["Investor Directory (400+ investors)", "Fuzzy/blurred", "Full access", "Full access"],
      ["Saudi Healthcare Map (18K+ providers)", Y, Y, Y],
      ["Map: 4 layers (providers, lands, PPP, assets)", Y, Y, Y],
      ["Healthcare News Feed + Stock Ticker", Y, Y, Y],
    ]},
    { title: "📈 Deal Flow & Marketplace", rows: [
      ["Browse deals and opportunities", Y, Y, Y],
      ["Post deals on the pipeline", N, Y, G("✓ Featured")],
      ["Express interest in deals", N, Y, Y],
      ["Investor Readiness Score", "View only", Y, Y],
      ["Marketplace cards", "1 card", "Multiple", G("Multiple + Featured + Priority")],
      ["Receive card inquiries", Y, Y, Y],
    ]},
    { title: "📝 Contracts & Documents", rows: [
      ["Sign received contracts", Y, Y, Y],
      ["Create Partnership MOU", N, Y, Y],
      ["Create Investment / Funding / Service contracts", N, N, Y],
      ["Contract audit trail", N, Y, Y],
      ["Download contract PDF", N, Y, Y],
      ["Download studies & presentations", N, N, Y],
      ["Export Excel / Word reports", N, Y, Y],
      ["Export PDF reports", N, N, Y],
    ]},
    { title: "🤝 Communication & Networking", rows: [
      ["Direct messaging to users", N, Y, Y],
      ["Admin-facilitated introductions", N, G("Upgrade nudge"), Y],
      ["Request government meeting", N, N, Y],
      ["Notification bell (promos, updates)", Y, Y, Y],
    ]},
    { title: "🤖 AI Investment Advisor", rows: [
      ["Access to advisor interface", Y, Y, Y],
      ["Ask questions", N, "2/month", G("15/month")],
      ["After limit reached", "Upgrade to Silver", "Upgrade to Gold", G("Admin consultation")],
      ["15 Saudi government entities knowledge", "View only", Y, Y],
      ["Request meeting with officials", N, N, Y],
    ]},
    { title: "📋 Regulatory & Insights", rows: [
      ["View regulatory alerts", Y, Y, Y],
      ["Impact analysis on your investments", N, N, G("Gold exclusive")],
      ["Urgent alert notifications", N, N, Y],
      ["Questionnaire results & insights", N, N, Y],
    ]},
    { title: "🎁 Account & Extras", rows: [
      ["Referral code (10% off for friends)", N, Y, Y],
      ["Submit testimonials", Y, Y, Y],
      ["EN/AR bilingual interface", Y, Y, Y],
      ["Saudi E-Commerce Law compliant refund", "--", "7-day window", "7-day window"],
      ["Priority customer support", N, N, Y],
    ]},
  ];

  return (
    <div style={{ marginBottom: 16, borderRadius: 12, border: "1px solid #D6E4DB", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "14px 20px", background: "#FAFBFA", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23", display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={16} color="#1B7A4A" /> Full Feature Comparison
        </span>
        <span style={{ fontSize: 11, color: "#6B8574" }}>{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #0D3D24, #1B7A4A)" }}>
              <th style={{ ...TH, textAlign: "left", minWidth: 200, color: "#fff" }}>Feature</th>
              <th style={{ ...TH, width: 90, color: "#fff" }}><Shield size={12} style={{ verticalAlign: "middle" }} /> Basic</th>
              <th style={{ ...TH, width: 90, color: "#fff" }}><Star size={12} style={{ verticalAlign: "middle" }} /> Silver</th>
              <th style={{ ...TH, width: 90, color: "#D4C68E" }}><Crown size={12} style={{ verticalAlign: "middle" }} /> Gold</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section, si) => (
              <div>
                <tr key={`s-${si}`}>
                  <td colSpan={4} style={{ padding: "10px 16px", background: "#E8F5EE", fontWeight: 700, color: "#1B7A4A", fontSize: 11, borderBottom: "1px solid #D6E4DB" }}>{section.title}</td>
                </tr>
                {section.rows.map((row, ri) => (
                  <tr key={`r-${si}-${ri}`} style={{ background: ri % 2 === 0 ? "#fff" : "#FAFBFA" }}>
                    <td style={{ ...TD, fontWeight: 500, color: "#1A2E23" }}>{row[0]}</td>
                    <td style={{ ...TD, textAlign: "center" }}>{typeof row[1] === "string" ? <span style={{ fontSize: 9, color: row[1] === "Fuzzy/blurred" ? "#D97706" : "#6B8574" }}>{row[1]}</span> : row[1]}</td>
                    <td style={{ ...TD, textAlign: "center" }}>{typeof row[2] === "string" ? <span style={{ fontSize: 9, color: "#3D5A47" }}>{row[2]}</span> : row[2]}</td>
                    <td style={{ ...TD, textAlign: "center", background: ri % 2 === 0 ? "#FFFBF0" : "#FFF8E7" }}>{typeof row[3] === "string" ? <span style={{ fontSize: 9, color: "#B5A167", fontWeight: 600 }}>{row[3]}</span> : row[3]}</td>
                  </tr>
                ))}
              </div>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

const TH = { padding: "10px 12px", fontSize: 11, fontWeight: 700, textAlign: "center", borderBottom: "2px solid #B5A167" };
const TD = { padding: "8px 12px", fontSize: 10, borderBottom: "1px solid #E8EFE9" };
