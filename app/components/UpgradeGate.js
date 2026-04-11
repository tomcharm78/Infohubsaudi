"use client";
import { Lock, Crown, Star, ArrowRight } from "lucide-react";
import { TIERS } from "../lib/subscription";

export default function UpgradeGate({ feature, requiredTier, currentTier, onUpgrade, onClose }) {
  const required = TIERS[requiredTier] || TIERS.silver;
  const featureNames = {
    exportExcel: "Export to Excel",
    downloadReport: "Download Word Report",
    downloadMapData: "Download Map Data",
    downloadStudies: "Download Studies",
    downloadOppData: "Download Opportunity Data",
    viewQuestResults: "View Questionnaire Results",
    directoryFull: "Full Directory Access",
    aiSearch: "AI Search (Admin Only)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Lock size={28} color="#D97706" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A2E23", marginBottom: 8 }}>
          {featureNames[feature] || feature}
        </h3>
        <p style={{ fontSize: 13, color: "#6B8574", lineHeight: 1.6, marginBottom: 20 }}>
          This feature requires a <strong style={{ color: required.color }}>{required.name}</strong> subscription or higher.
          {currentTier === "basic" ? " Upgrade to unlock full access." : ` You're on ${TIERS[currentTier]?.name || currentTier}.`}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onUpgrade}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#B5A167,#D4C68E)", color: "#1A2E23",
              cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Crown size={15} /> View Plans <ArrowRight size={14} />
          </button>
          <button onClick={onClose}
            style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid #D6E4DB", background: "#fff", color: "#6B8574", cursor: "pointer", fontSize: 13 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
