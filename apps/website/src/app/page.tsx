import React from "react";

const features = [
  {
    title: "Privacy first",
    body: "Zero network requests. No tracking. No analytics about your analytics. Everything stays on your machine.",
  },
  {
    title: "Local first",
    body: "All data lives in IndexedDB on your device. Your usage never leaves your computer.",
  },
  {
    title: "Open source",
    body: "MIT licensed. Fork it, extend it, and ship your own provider adapter in minutes.",
  },
  {
    title: "Extensible",
    body: "Adding a provider means implementing one interface — ProviderPlugin. That's it.",
  },
];

const providers = [
  "Claude Code",
  "Codex",
  "Cursor",
  "Gemini CLI",
  "GitHub Copilot",
  "Cline",
  "Roo Code",
  "Continue.dev",
  "Aider",
];

const questions = [
  "How many tokens did I burn this week?",
  "What's my estimated cost per provider?",
  "What percentage of completions do I actually accept?",
  "When am I most productive with AI?",
];

export default function HomePage() {
  return (
    <main
      style={{
        margin: 0,
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#e6e6e6",
        background:
          "radial-gradient(1200px 600px at 50% -10%, #1b2a4a 0%, #0a0e17 55%, #060810 100%)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>⬡</span>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>METER</span>
        </div>
        <a
          href="https://github.com/Hashtag-Irfan/meter"
          style={{
            color: "#9fb3d1",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid #2a3450",
            padding: "8px 14px",
            borderRadius: 8,
          }}
        >
          GitHub
        </a>
      </header>

      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "80px 24px 40px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: 13,
            fontWeight: 600,
            color: "#7fd1ff",
            background: "rgba(127,209,255,0.1)",
            border: "1px solid rgba(127,209,255,0.25)",
            padding: "6px 12px",
            borderRadius: 999,
            marginBottom: 24,
          }}
        >
          Privacy-first analytics for AI coding assistants
        </span>
        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 68px)",
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
            background: "linear-gradient(180deg, #ffffff 0%, #9fb3d1 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Know your AI coding footprint.
          <br />
          Without giving up your data.
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#9aa7bd",
            maxWidth: 620,
            margin: "0 auto 32px",
          }}
        >
          METER tracks your usage of Claude Code, Codex, Cursor and more — tokens, cost,
          acceptance rate and productivity. All computed locally. No accounts, no telemetry,
          no cloud.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="https://github.com/Hashtag-Irfan/meter"
            style={{
              background: "#3b82f6",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
              padding: "13px 22px",
              borderRadius: 10,
            }}
          >
            Get started
          </a>
          <a
            href="https://github.com/Hashtag-Irfan/meter"
            style={{
              color: "#cdd7e6",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
              padding: "13px 22px",
              borderRadius: 10,
              border: "1px solid #2a3450",
            }}
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1e2840",
                borderRadius: 14,
                padding: 22,
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#9aa7bd" }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 64px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Questions METER answers
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 10 }}>
          {questions.map((q) => (
            <li
              key={q}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #1e2840",
                borderRadius: 10,
                padding: "14px 18px",
                fontSize: 15,
                color: "#cdd7e6",
              }}
            >
              {q}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Supported providers
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {providers.map((p) => (
            <span
              key={p}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#9fb3d1",
                background: "rgba(127,209,255,0.06)",
                border: "1px solid #243049",
                padding: "7px 13px",
                borderRadius: 999,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid #141c2e",
          padding: "28px 24px",
          textAlign: "center",
          color: "#5e6b85",
          fontSize: 13,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        METER — MIT © METER Contributors. Built local-first.
      </footer>
    </main>
  );
}
