"use client";
import { useState } from "react";

export default function ClientApp() {
  const [count, setCount] = useState(0);
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F4F6F5",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: 40,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        textAlign: "center",
        maxWidth: 500
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(135deg, #1B7A4A, #2D9E64)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: 28,
          fontWeight: 800,
          color: "#D4C68E"
        }}>H</div>
        <h1 style={{color: "#1A2E23", fontSize: 24, fontWeight: 700, marginBottom: 8}}>
          Healthcare Investor Intelligence
        </h1>
        <p style={{color: "#6B8574", fontSize: 14, marginBottom: 24}}>
          Saudi Arabia and GCC - Platform deployed successfully
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: "12px 32px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #1B7A4A, #2D9E64)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Build verified - Click count: {count}
        </button>
        <div style={{marginTop: 20, fontSize: 11, color: "#8FA898"}}>
          Full platform loading next...
        </div>
      </div>
    </div>
  );
}
