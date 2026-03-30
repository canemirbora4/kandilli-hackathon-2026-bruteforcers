"use client";

import Link from "next/link";

export default function Landing() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      gap: 0,
    }}>
      {/* Logo / başlık */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: 18,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M8 13h2" /><path d="M8 17h2" />
            <path d="M14 13h2" /><path d="M14 17h2" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.5px" }}>
          Kandilli Archive
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 15 }}>
          115 Years of Climate Records
        </p>
      </div>

      {/* Butonlar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 300 }}>
        <Link href="/arsiv" style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "18px 24px",
            borderRadius: 14,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#6366f1")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>Archive Viewer</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Browse chart papers</div>
            </div>
          </div>
        </Link>

        <Link href="/admin" style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "18px 24px",
            borderRadius: 14,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#8b5cf6")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #ef4444, #f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>Data Entry</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Digitization and annotation</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}