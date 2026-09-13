import React, { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   VERASCOPE — Forensic Image-Verification Tool
   Design tokens:
   navy-950 #070B14  navy-900 #0B1220  panel #121B30
   glass    rgba(255,255,255,.05)   line rgba(255,255,255,.09)
   cyan     #5FD0E8 (real / trust)   amber #F0A63D (AI-gen / warn)
   ink      #EDEFF5   slate #8891A8
   Type: Fraunces (display/verdict) + Inter (UI)
   ============================================================ */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,440;0,9..144,560;1,9..144,440&family=Inter:wght@400;500;600;700&display=swap');
`;

const GLOBAL_CSS = `
${FONTS}
* { box-sizing: border-box; }
.vs-root {
  --navy-950: #070B14;
  --navy-900: #0B1220;
  --panel: #121B30;
  --panel-2: #0E1729;
  --glass: rgba(255,255,255,.05);
  --glass-strong: rgba(255,255,255,.085);
  --line: rgba(255,255,255,.09);
  --line-strong: rgba(255,255,255,.16);
  --cyan: #5FD0E8;
  --cyan-dim: #2E7C8F;
  --amber: #F0A63D;
  --amber-dim: #8A5A22;
  --ink: #EDEFF5;
  --slate: #8891A8;
  --slate-dim: #5B6478;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ink);
  background: var(--navy-900);
  min-height: 100vh;
  width: 100%;
  position: relative;
}
.vs-serif {
  font-family: 'Fraunces', Georgia, serif;
}
.vs-root ::selection {
  background: var(--cyan);
  color: #04121a;
}
.vs-btn {
  cursor: pointer;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease, opacity .15s ease;
}
.vs-btn:active {
  transform: scale(.97);
}
.vs-btn:focus-visible, .vs-link:focus-visible, .vs-input:focus-visible, .vs-tab:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
.vs-input {
  font-family: 'Inter', sans-serif;
}
@media (prefers-reduced-motion: reduce) {
  .vs-root * {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
.vs-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.vs-scrollbar::-webkit-scrollbar-thumb {
  background: var(--line-strong);
  border-radius: 8px;
}
.vs-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

@keyframes vs-scan {
  0% { top: -4%; }
  100% { top: 104%; }
}
@keyframes vs-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes vs-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes vs-pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(95,208,232,.35); }
  100% { box-shadow: 0 0 0 14px rgba(95,208,232,0); }
}
@keyframes vs-drift {
  0% { background-position: 0 0; }
  100% { background-position: 120px 120px; }
}
@keyframes vs-spin {
  to { transform: rotate(360deg); }
}

.vs-grid-bg {
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 42px 42px;
}
`;

/* ---------- Sample Forensic Images for Immediate Evaluation ---------- */

const SAMPLE_REAL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14223d" />
      <stop offset="100%" stop-color="#243b55" />
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b2a38" />
      <stop offset="100%" stop-color="#0c161d" />
    </linearGradient>
    <radialGradient id="sensorNoise" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#5FD0E8" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#070B14" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="450" fill="url(#sky)" />
  <rect y="280" width="600" height="170" fill="url(#ground)" />
  <circle cx="300" cy="190" r="110" fill="#2d425b" />
  <circle cx="300" cy="180" r="75" fill="#3f5a7a" />
  <circle cx="275" cy="170" r="10" fill="#14223d" />
  <circle cx="325" cy="170" r="10" fill="#14223d" />
  <circle cx="277" cy="168" r="3" fill="#ffffff" />
  <circle cx="327" cy="168" r="3" fill="#ffffff" />
  <path d="M285 205 Q300 216 315 205" stroke="#14223d" stroke-width="3" fill="none" stroke-linecap="round" />
  <rect width="600" height="450" fill="url(#sensorNoise)" />
  <text x="24" y="36" fill="#8891A8" font-family="sans-serif" font-size="13" letter-spacing="1">CANON EOS R6 · 50MM F/1.8 · ISO 400</text>
</svg>
`)}`;

const SAMPLE_AI_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
    <linearGradient id="synthBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a1532" />
      <stop offset="50%" stop-color="#191938" />
      <stop offset="100%" stop-color="#0e172a" />
    </linearGradient>
    <radialGradient id="aiGlow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#F0A63D" stop-opacity="0.28" />
      <stop offset="50%" stop-color="#e0553f" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#070B14" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="450" fill="url(#synthBg)" />
  <ellipse cx="300" cy="220" rx="125" ry="140" fill="#2d2948" />
  <ellipse cx="300" cy="210" rx="90" ry="105" fill="#3c3761" />
  <ellipse cx="265" cy="195" rx="14" ry="9" fill="#1b1830" />
  <ellipse cx="335" cy="195" rx="14" ry="9" fill="#1b1830" />
  <circle cx="267" cy="194" r="3.5" fill="#F0A63D" />
  <circle cx="337" cy="194" r="3.5" fill="#5FD0E8" />
  <path d="M280 240 Q300 252 320 240" stroke="#1b1830" stroke-width="3" fill="none" stroke-linecap="round" />
  <rect width="600" height="450" fill="url(#aiGlow)" />
  <text x="24" y="36" fill="#F0A63D" font-family="sans-serif" font-size="13" letter-spacing="1">SYNTHETIC DIFFUSION ARTIFACT BENCHMARK</text>
</svg>
`)}`;

/* ---------- Initial Mock Items (Pre-seeded for immediate inspection) ---------- */

const PRESEEDED_ITEMS = [
  {
    id: "preseed-editorial-01",
    name: "editorial_press_photo.jpg",
    url: SAMPLE_REAL_SVG,
    verdict: "Likely real",
    isAI: false,
    confidence: 88,
    status: "done",
    explanation:
      "The noise pattern across the image is consistent with a physical camera sensor, and compression artifacts follow the natural, irregular pattern typical of a photograph processed through standard editorial software rather than a generative model. Natural illumination geometry shows consistent shadow falls.",
    heatSpots: [
      { x: 38, y: 32, r: 8 },
      { x: 55, y: 36, r: 7 },
      { x: 48, y: 58, r: 10 },
    ],
    metadata: {
      camera: "Canon EOS R6, 50mm f/1.8",
      timestamp: "2026-08-14 17:22:03 UTC",
      editor: "Adobe Lightroom 13.2",
      c2pa: "Content credentials present, unverified issuer",
    },
    robustness: {
      original: 88,
      compressed: 86,
    },
  },
  {
    id: "preseed-synthetic-02",
    name: "portrait_diffusion_sample.png",
    url: SAMPLE_AI_SVG,
    verdict: "Likely AI-generated",
    isAI: true,
    confidence: 84,
    status: "done",
    explanation:
      "The image exhibits smooth micro-texture transitions around facial contours and subtle repetition anomalies in high-frequency background noise. Eye reflection vectors diverge slightly from the primary scene illuminant, patterns frequently observed in synthetic generative outputs.",
    heatSpots: [
      { x: 44, y: 32, r: 10 },
      { x: 56, y: 34, r: 9 },
      { x: 50, y: 54, r: 12 },
    ],
    metadata: {
      camera: "Not detected",
      timestamp: "Not present",
      editor: "Not present",
      c2pa: "No content credentials found",
    },
    robustness: {
      original: 84,
      compressed: 79,
    },
  },
];

/* ---------- Tiny UI Atoms ---------- */

function GlassPanel({ children, style = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--glass)",
        border: "1px solid var(--line)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, style = {}, type = "button", disabled }) {
  return (
    <button
      type={type}
      className="vs-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "linear-gradient(180deg,#6EDCF2,#42B7CE)",
        color: "#04121a",
        padding: "13px 22px",
        borderRadius: 9,
        fontSize: 15,
        letterSpacing: ".01em",
        boxShadow: "0 1px 0 rgba(255,255,255,.35) inset, 0 8px 20px -10px rgba(95,208,232,.55)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style = {} }) {
  return (
    <button
      className="vs-btn"
      onClick={onClick}
      style={{
        background: "transparent",
        color: "var(--ink)",
        border: "1px solid var(--line-strong)",
        padding: "12px 20px",
        borderRadius: 9,
        fontSize: 15,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 18 }}>
      <span style={{ display: "block", fontSize: 13, color: "var(--slate)", marginBottom: 7, fontWeight: 500 }}>
        {label}
      </span>
      <input
        className="vs-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "rgba(255,255,255,.03)",
          border: "1px solid var(--line-strong)",
          borderRadius: 8,
          padding: "12px 14px",
          color: "var(--ink)",
          fontSize: 15,
          outline: "none",
        }}
      />
      {hint && <span style={{ display: "block", fontSize: 12, color: "var(--slate-dim)", marginTop: 6 }}>{hint}</span>}
    </label>
  );
}

function MarkIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke="#5FD0E8" strokeWidth="1.6" opacity=".85" />
      <circle cx="16" cy="16" r="5.5" fill="#5FD0E8" opacity=".9" />
      <path d="M16 2 L16 8 M16 24 L16 30 M2 16 L8 16 M24 16 L30 16" stroke="#F0A63D" strokeWidth="1.4" opacity=".8" />
    </svg>
  );
}

/* ---------- Animated Scan Demo (Hero) ---------- */

function ScanDemo() {
  const [phase, setPhase] = useState("scanning"); // scanning -> revealed
  useEffect(() => {
    const t = setTimeout(() => setPhase("revealed"), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--line-strong)",
        background: "linear-gradient(135deg,#1a2740 0%,#0d1524 60%)",
      }}
    >
      {/* portrait-ish placeholder art */}
      <svg viewBox="0 0 400 300" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <radialGradient id="face" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#3a4d6e" />
            <stop offset="100%" stopColor="#141d30" />
          </radialGradient>
          <linearGradient id="heat" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0A63D" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#e0553f" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5FD0E8" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="#0d1524" />
        <ellipse cx="200" cy="150" rx="120" ry="130" fill="url(#face)" opacity="0.9" />
        <ellipse cx="160" cy="130" rx="14" ry="9" fill="#0d1524" opacity=".55" />
        <ellipse cx="240" cy="130" rx="14" ry="9" fill="#0d1524" opacity=".55" />
        <path d="M175 190 Q200 205 225 190" stroke="#0d1524" strokeWidth="4" fill="none" opacity=".5" strokeLinecap="round" />
        {phase === "revealed" && (
          <g style={{ animation: "vs-fade .6s ease" }}>
            <ellipse cx="150" cy="120" rx="34" ry="26" fill="url(#heat)" />
            <ellipse cx="250" cy="128" rx="30" ry="22" fill="url(#heat)" />
            <ellipse cx="200" cy="195" rx="46" ry="18" fill="url(#heat)" opacity="0.6" />
          </g>
        )}
      </svg>

      {phase === "scanning" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #5FD0E8, transparent)",
            boxShadow: "0 0 18px 3px rgba(95,208,232,.7)",
            animation: "vs-scan 2.5s cubic-bezier(.65,0,.35,1) 1",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: 14,
          top: 14,
          fontSize: 12,
          fontWeight: 600,
          padding: "5px 10px",
          borderRadius: 6,
          background: "rgba(7,11,20,.65)",
          border: "1px solid var(--line-strong)",
          color: phase === "revealed" ? "var(--amber)" : "var(--slate)",
          transition: "color .4s ease",
        }}
      >
        {phase === "revealed" ? "Likely AI-generated · 82%" : "Analyzing…"}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 1: LANDING ( / )
   ============================================================ */

function Landing({ goto }) {
  const steps = [
    { n: "01", t: "Upload an image", d: "Drop in a single photo, or a batch — JPG or PNG formats supported." },
    { n: "02", t: "See the reasoning", d: "A heat-map and a plain-language explanation, not just an unexplained score." },
    { n: "03", t: "Read the verdict, hedged", d: "Likely AI-generated or likely real, with a confidence percentage — never an absolute claim." },
  ];

  return (
    <div className="vs-scrollbar" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 28px" }}>
      {/* nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MarkIcon />
          <span className="vs-serif" style={{ fontSize: 20, fontWeight: 560, letterSpacing: ".01em" }}>Verascope</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a className="vs-link" href="#how" style={{ color: "var(--slate)", textDecoration: "none", fontSize: 14 }}>How it works</a>
          <a className="vs-link" href="#trust" style={{ color: "var(--slate)", textDecoration: "none", fontSize: 14 }}>Why trust it</a>
          <GhostButton onClick={() => goto("login")} style={{ padding: "9px 16px", fontSize: 14 }}>Log in</GhostButton>
          <PrimaryButton onClick={() => goto("signup")} style={{ padding: "9px 18px", fontSize: 14 }}>Get started</PrimaryButton>
        </div>
      </nav>

      {/* hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56, alignItems: "center", padding: "56px 0 88px" }}>
        <div style={{ animation: "vs-fade-up .7s ease both" }}>
          <h1 className="vs-serif" style={{ fontSize: 52, lineHeight: 1.08, fontWeight: 480, margin: "0 0 22px", letterSpacing: "-.01em" }}>
            Know what you're looking at, before you share it.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--slate)", maxWidth: 480, margin: "0 0 32px" }}>
            Verascope reads an image the way a forensic examiner would — pixel artifacts, compression history, metadata — and hands you a hedged, explainable verdict instead of a bare yes or no.
          </p>
          <div style={{ display: "flex", gap: 14 }}>
            <PrimaryButton onClick={() => goto("signup")}>Try it on an image</PrimaryButton>
            <GhostButton onClick={() => goto("login")}>I have an account</GhostButton>
          </div>
          <p style={{ fontSize: 13, color: "var(--slate-dim)", marginTop: 18 }}>
            Built for journalists and newsroom fact-checkers. No image leaves your session.
          </p>
        </div>
        <div style={{ animation: "vs-fade-up .8s ease .1s both" }}>
          <ScanDemo />
        </div>
      </section>

      {/* how it works */}
      <section id="how" style={{ padding: "40px 0 80px", borderTop: "1px solid var(--line)" }}>
        <h2 className="vs-serif" style={{ fontSize: 28, fontWeight: 500, margin: "48px 0 34px" }}>Three steps, no jargon</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {steps.map((s) => (
            <GlassPanel key={s.n} style={{ padding: 26 }}>
              <div className="vs-serif" style={{ color: "var(--cyan)", fontSize: 15, marginBottom: 14 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontSize: 14.5, color: "var(--slate)", lineHeight: 1.55 }}>{s.d}</div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* trust strip */}
      <section id="trust" style={{ padding: "10px 0 90px" }}>
        <GlassPanel style={{ padding: "36px 40px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <h3 className="vs-serif" style={{ fontSize: 24, fontWeight: 500, margin: "0 0 12px" }}>Confidence, not certainty</h3>
            <p style={{ color: "var(--slate)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 460 }}>
              Every result ships with a confidence percentage, a heat-map you can inspect yourself, and a note on how the score held up under compression. Nothing here is presented as fact — that's the point.
            </p>
          </div>
          <div style={{ display: "flex", gap: 28, justifyContent: "flex-end" }}>
            <Stat label="Hedged verdicts" value="100%" />
            <Stat label="Panels per image" value="6" />
            <Stat label="Stored after session" value="0" />
          </div>
        </GlassPanel>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "26px 0 50px", display: "flex", justifyContent: "space-between", color: "var(--slate-dim)", fontSize: 13 }}>
        <span>Verascope — image provenance workspace</span>
        <span>Hackathon build · not a production forensic tool</span>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div className="vs-serif" style={{ fontSize: 30, color: "var(--cyan)" }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "var(--slate)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ============================================================
   AUTH SHELL (PAGE 2: LOGIN & PAGE 3: SIGNUP)
   ============================================================ */

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div
      className="vs-grid-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        animation: "vs-drift 6s linear infinite",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(95,208,232,.12), transparent 70%)",
          top: "-10%",
          left: "-8%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(240,166,61,.09), transparent 70%)",
          bottom: "-12%",
          right: "-6%",
        }}
      />
      <GlassPanel
        style={{
          width: 400,
          padding: "38px 34px",
          position: "relative",
          zIndex: 1,
          animation: "vs-fade-up .5s ease both",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <MarkIcon size={22} />
          <span className="vs-serif" style={{ fontSize: 17 }}>Verascope</span>
        </div>
        <h1 className="vs-serif" style={{ fontSize: 26, fontWeight: 500, margin: "0 0 6px" }}>{title}</h1>
        <p style={{ fontSize: 14, color: "var(--slate)", margin: "0 0 26px" }}>{subtitle}</p>
        {children}
        {footer}
      </GlassPanel>
    </div>
  );
}

function Login({ goto, onAuthed }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep checking images."
      footer={
        <p style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 22, textAlign: "center" }}>
          No account?{" "}
          <span onClick={() => goto("signup")} style={{ color: "var(--cyan)", cursor: "pointer", fontWeight: 600 }}>
            Sign up
          </span>
        </p>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onAuthed(); }}>
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@newsroom.com" />
        <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        <PrimaryButton type="submit" style={{ width: "100%", marginTop: 4 }}>Log in</PrimaryButton>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span onClick={() => goto("landing")} style={{ color: "var(--slate-dim)", fontSize: 13, cursor: "pointer" }}>← Back to home</span>
      </div>
    </AuthShell>
  );
}

function Signup({ goto, onAuthed }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start verifying images in under a minute."
      footer={
        <p style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 22, textAlign: "center" }}>
          Already have one?{" "}
          <span onClick={() => goto("login")} style={{ color: "var(--cyan)", cursor: "pointer", fontWeight: 600 }}>
            Log in
          </span>
        </p>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onAuthed(); }}>
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Ellis" />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@newsroom.com" />
        <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 8 characters." placeholder="••••••••" />
        <PrimaryButton type="submit" style={{ width: "100%", marginTop: 4 }}>Create account</PrimaryButton>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span onClick={() => goto("landing")} style={{ color: "var(--slate-dim)", fontSize: 13, cursor: "pointer" }}>← Back to home</span>
      </div>
    </AuthShell>
  );
}

/* ============================================================
   PAGE 4: WORKSPACE (The 9-Page Analyzer, Behind Auth)
   Tabs:
   1. Upload
   2. Batch
   3. Verdict
   4. Attention map
   5. Explanation
   6. Metadata
   7. Robustness
   8. History
   9. Loading state
   ============================================================ */

const TABS = [
  { id: "upload", label: "Upload" },
  { id: "batch", label: "Batch" },
  { id: "verdict", label: "Verdict" },
  { id: "heatmap", label: "Attention map" },
  { id: "explanation", label: "Explanation" },
  { id: "metadata", label: "Metadata" },
  { id: "robustness", label: "Robustness" },
  { id: "history", label: "History" },
  { id: "loading", label: "Loading state" },
];

function mockAnalyze(file, seedOverride) {
  const seed = seedOverride ?? Array.from(file.name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min, max) => min + (((seed * 9301 + 49297) % 233280) / 233280) * (max - min);
  const isAI = seed % 2 === 0;
  const confidence = Math.round(isAI ? rand(68, 92) : rand(64, 91));
  return {
    id: `${file.name}-${seed}-${Date.now()}`,
    name: file.name,
    url: URL.createObjectURL(file),
    verdict: isAI ? "Likely AI-generated" : "Likely real",
    isAI,
    confidence,
    explanation: isAI
      ? "The image shows unusually smooth texture transitions around facial contours and subtle repeating frequency patterns in the background. Taken together, these characteristics are typical of generative synthesis models rather than physical camera sensors."
      : "The noise distribution across the image aligns with optical sensor noise, and compression boundaries show the irregular distribution typical of a camera photograph exported via standard editors. No evident signs of generative synthesis.",
    heatSpots: [
      { x: 32 + rand(0, 15), y: 30 + rand(0, 15), r: 9 },
      { x: 60 + rand(0, 10), y: 35 + rand(0, 10), r: 8 },
      { x: 46 + rand(0, 10), y: 64 + rand(0, 10), r: 11 },
    ],
    metadata: {
      camera: isAI ? "Not detected" : "Canon EOS R6, 50mm f/1.8",
      timestamp: isAI ? "Not present" : "2026-08-14 17:22:03 UTC",
      editor: isAI ? "Not present" : "Adobe Lightroom 13.2",
      c2pa: isAI ? "No content credentials found" : "Content credentials present, unverified issuer",
    },
    robustness: {
      original: confidence,
      compressed: Math.max(0, Math.min(100, confidence + Math.round(rand(-7, 5)))),
    },
  };
}

function ScoreBar({ value, isAI }) {
  return (
    <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          borderRadius: 5,
          background: isAI ? "linear-gradient(90deg,#8A5A22,#F0A63D)" : "linear-gradient(90deg,#2E7C8F,#5FD0E8)",
          transition: "width .5s ease",
        }}
      />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { c: "var(--slate)", t: "Pending" },
    analyzing: { c: "var(--cyan)", t: "Analyzing" },
    done: { c: "var(--amber)", t: "Done" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: s.c,
        border: `1px solid ${s.c}55`,
        padding: "3px 9px",
        borderRadius: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {status === "analyzing" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.c,
            display: "inline-block",
            animation: "vs-pulse-ring 1.2s infinite",
          }}
        />
      )}
      {s.t}
    </span>
  );
}

function Dropzone({ onFiles, multiple }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const accept = (fileList) => {
    const files = Array.from(fileList);
    const valid = files.filter((f) => ["image/jpeg", "image/png", "image/jpg"].includes(f.type));
    if (valid.length !== files.length) {
      setError("Only JPG and PNG files are supported — other file types were skipped.");
    } else {
      setError("");
    }
    if (valid.length) {
      onFiles(multiple ? valid : [valid[0]]);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${drag ? "var(--cyan)" : "var(--line-strong)"}`,
          borderRadius: 14,
          padding: "56px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? "rgba(95,208,232,.06)" : "rgba(255,255,255,.02)",
          transition: "border-color .15s ease, background .15s ease",
        }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple={multiple} hidden onChange={(e) => accept(e.target.files)} />
        <div style={{ fontSize: 34, marginBottom: 12 }}>⤒</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          {multiple ? "Drop images here, or click to browse" : "Drop an image here, or click to browse"}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--slate)" }}>
          JPG or PNG {multiple ? "· multiple files supported" : "· single file"}
        </div>
      </div>
      {error && <div style={{ color: "var(--amber)", fontSize: 13, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

function ThumbPicker({ items, activeId, onPick }) {
  if (!items.length) {
    return <div style={{ color: "var(--slate)", fontSize: 14 }}>No analyzed images yet — upload one first.</div>;
  }
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
      <span style={{ fontSize: 12.5, color: "var(--slate)", marginRight: 4 }}>Select target:</span>
      {items.map((it) => (
        <button
          key={it.id}
          className="vs-btn"
          onClick={() => onPick(it.id)}
          style={{
            width: 58,
            height: 58,
            borderRadius: 8,
            overflow: "hidden",
            padding: 0,
            border: `2px solid ${activeId === it.id ? "var(--cyan)" : "var(--line)"}`,
            background: `url(${it.url}) center/cover`,
            boxShadow: activeId === it.id ? "0 0 10px rgba(95,208,232,0.4)" : "none",
          }}
          title={`${it.name} (${it.verdict})`}
        />
      ))}
    </div>
  );
}

function PageHeader({ title, desc }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 className="vs-serif" style={{ fontSize: 26, fontWeight: 500, margin: "0 0 6px" }}>{title}</h2>
      {desc && <p style={{ color: "var(--slate)", fontSize: 14.5, margin: 0, maxWidth: 600 }}>{desc}</p>}
    </div>
  );
}

function Workspace({ onLogout }) {
  const [tab, setTab] = useState("verdict");
  const [items, setItems] = useState(PRESEEDED_ITEMS); // In-memory session list
  const [activeId, setActiveId] = useState(PRESEEDED_ITEMS[0].id);
  const [demoLoading, setDemoLoading] = useState(false);

  const doneItems = items.filter((i) => i.status === "done");
  const active = doneItems.find((i) => i.id === activeId) || doneItems[0];

  const ingest = (files) => {
    const seeds = files.map((f, idx) => ({
      file: f,
      status: "pending",
      id: `${f.name}-${Date.now()}-${idx}`,
    }));
    setItems((prev) => [
      ...prev,
      ...seeds.map((s) => ({
        id: s.id,
        name: s.file.name,
        url: URL.createObjectURL(s.file),
        status: "pending",
      })),
    ]);
    seeds.forEach((s, i) => {
      setTimeout(() => {
        setItems((prev) => prev.map((p) => (p.id === s.id ? { ...p, status: "analyzing" } : p)));
      }, 300 + i * 200);
      setTimeout(() => {
        const result = mockAnalyze(s.file, Array.from(s.file.name).reduce((a, c) => a + c.charCodeAt(0), 0) + i);
        setItems((prev) => prev.map((p) => (p.id === s.id ? { ...result, id: s.id, status: "done" } : p)));
        setActiveId(s.id);
      }, 1400 + i * 500);
    });
    if (files.length === 1) setTab("verdict");
    else setTab("batch");
  };

  const loadDemoSample = (type) => {
    if (type === "real") {
      const realItem = {
        ...PRESEEDED_ITEMS[0],
        id: `editorial-sample-${Date.now()}`,
        name: `press_wire_${Math.floor(Math.random() * 899 + 100)}.jpg`,
      };
      setItems((prev) => [realItem, ...prev]);
      setActiveId(realItem.id);
      setTab("verdict");
    } else {
      const aiItem = {
        ...PRESEEDED_ITEMS[1],
        id: `diffusion-sample-${Date.now()}`,
        name: `synthetic_diffusion_${Math.floor(Math.random() * 899 + 100)}.png`,
      };
      setItems((prev) => [aiItem, ...prev]);
      setActiveId(aiItem.id);
      setTab("verdict");
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          background: "rgba(11,18,32,.85)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <MarkIcon size={22} />
            <span className="vs-serif" style={{ fontSize: 17, fontWeight: 560 }}>Verascope</span>
            <span style={{ fontSize: 11.5, color: "var(--slate-dim)", marginLeft: 6, borderLeft: "1px solid var(--line)", paddingLeft: 10 }}>
              Forensic Workspace
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <GhostButton onClick={onLogout} style={{ padding: "8px 14px", fontSize: 13 }}>
              Log out
            </GhostButton>
          </div>
        </div>
        <div
          className="vs-scrollbar"
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              className="vs-tab vs-btn"
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                color: tab === t.id ? "var(--ink)" : "var(--slate)",
                padding: "12px 14px",
                fontSize: 13.5,
                borderBottom: `2px solid ${tab === t.id ? "var(--cyan)" : "transparent"}`,
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 80px" }}>
        {/* Tab 1: Upload */}
        {tab === "upload" && (
          <>
            <PageHeader
              title="Upload an image"
              desc="Single-image check. Drop a JPG or PNG to run it through the forensic reasoning pipeline."
            />
            <div style={{ maxWidth: 620 }}>
              <Dropzone multiple={false} onFiles={ingest} />
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--slate)" }}>Quick test presets:</span>
                <button
                  className="vs-btn"
                  onClick={() => loadDemoSample("real")}
                  style={{
                    background: "rgba(95,208,232,0.1)",
                    color: "var(--cyan)",
                    border: "1px solid var(--cyan-dim)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12.5,
                  }}
                >
                  + Add sample photo (likely real)
                </button>
                <button
                  className="vs-btn"
                  onClick={() => loadDemoSample("ai")}
                  style={{
                    background: "rgba(240,166,61,0.1)",
                    color: "var(--amber)",
                    border: "1px solid var(--amber-dim)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12.5,
                  }}
                >
                  + Add sample portrait (likely AI)
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Batch */}
        {tab === "batch" && (
          <>
            <PageHeader
              title="Batch upload"
              desc="Check several images at once. Each gets its own status as it moves through the queue."
            />
            <div style={{ maxWidth: 620, marginBottom: 32 }}>
              <Dropzone multiple onFiles={ingest} />
            </div>
            {items.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16 }}>
                {items.map((it) => (
                  <GlassPanel
                    key={it.id}
                    style={{
                      padding: 10,
                      cursor: it.status === "done" ? "pointer" : "default",
                      borderColor: activeId === it.id ? "var(--cyan)" : "var(--line)",
                    }}
                  >
                    <div
                      onClick={() => {
                        if (it.status === "done") {
                          setActiveId(it.id);
                          setTab("verdict");
                        }
                      }}
                      style={{
                        borderRadius: 8,
                        overflow: "hidden",
                        aspectRatio: "1/1",
                        background: `url(${it.url}) center/cover`,
                        marginBottom: 10,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 12.5,
                        marginBottom: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={it.name}
                    >
                      {it.name}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <StatusPill status={it.status} />
                      {it.status === "done" && (
                        <span style={{ fontSize: 11.5, color: it.isAI ? "var(--amber)" : "var(--cyan)" }}>
                          {it.confidence}%
                        </span>
                      )}
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 3: Verdict */}
        {tab === "verdict" && (
          <>
            <PageHeader
              title="Verdict"
              desc="Always hedged — a likelihood label with a confidence percentage, never an absolute claim."
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active ? (
              <GlassPanel style={{ padding: 30, maxWidth: 580 }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 10,
                      overflow: "hidden",
                      flexShrink: 0,
                      background: `url(${active.url}) center/cover`,
                      border: "1px solid var(--line-strong)",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="vs-serif"
                      style={{
                        fontSize: 24,
                        fontWeight: 500,
                        color: active.isAI ? "var(--amber)" : "var(--cyan)",
                        marginBottom: 10,
                      }}
                    >
                      {active.verdict}
                    </div>
                    <ScoreBar value={active.confidence} isAI={active.isAI} />
                    <div style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                      <span>Hedged model confidence</span>
                      <strong style={{ color: "var(--ink)" }}>{active.confidence}%</strong>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ) : (
              <div style={{ color: "var(--slate)" }}>No images analyzed yet.</div>
            )}
          </>
        )}

        {/* Tab 4: Attention Map */}
        {tab === "heatmap" && (
          <>
            <PageHeader
              title="Attention map"
              desc="The regions that most influenced the verdict, overlaid on the original image."
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active && <HeatmapPanel item={active} />}
          </>
        )}

        {/* Tab 5: Explanation */}
        {tab === "explanation" && (
          <>
            <PageHeader
              title="Explanation"
              desc="The reasoning behind the verdict, written in plain language for fact-checkers and editors."
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active && (
              <GlassPanel style={{ padding: 28, maxWidth: 640 }}>
                <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 12 }}>
                  Why the model reached this verdict:
                </div>
                <p style={{ fontSize: 15.5, lineHeight: 1.7, margin: 0, color: "var(--ink)" }}>
                  {active.explanation}
                </p>
              </GlassPanel>
            )}
          </>
        )}

        {/* Tab 6: Metadata */}
        {tab === "metadata" && (
          <>
            <PageHeader
              title="Metadata & provenance"
              desc="Camera, timestamp, editing history, and C2PA content-credential status. Structured placeholder fields ready for live EXIF/C2PA parsers."
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active && <MetadataPanel item={active} />}
          </>
        )}

        {/* Tab 7: Robustness */}
        {tab === "robustness" && (
          <>
            <PageHeader
              title="Robustness check"
              desc="Comparison between original and compressed/resized confidence to evaluate stability under platform re-encoding."
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active && <RobustnessPanel item={active} />}
          </>
        )}

        {/* Tab 8: History */}
        {tab === "history" && (
          <>
            <PageHeader
              title="Session history"
              desc="Every image checked during this active session. Nothing persists after you close or refresh."
            />
            {doneItems.length === 0 ? (
              <div style={{ color: "var(--slate)" }}>Nothing checked yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
                {doneItems.slice().reverse().map((it) => (
                  <GlassPanel
                    key={it.id}
                    style={{
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      cursor: "pointer",
                      borderColor: activeId === it.id ? "var(--cyan)" : "var(--line)",
                    }}
                  >
                    <div
                      onClick={() => {
                        setActiveId(it.id);
                        setTab("verdict");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 7,
                          overflow: "hidden",
                          background: `url(${it.url}) center/cover`,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{it.name}</div>
                        <div style={{ fontSize: 12.5, color: it.isAI ? "var(--amber)" : "var(--cyan)", marginTop: 2 }}>
                          {it.verdict} · {it.confidence}%
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--slate-dim)" }}>View details →</span>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 9: Loading State */}
        {tab === "loading" && (
          <>
            <PageHeader
              title="Loading state"
              desc="What the interface shows while predict() runs asynchronously across the forensic pipeline."
            />
            <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
              <PrimaryButton
                onClick={() => {
                  setDemoLoading(true);
                  setTimeout(() => setDemoLoading(false), 2200);
                }}
              >
                Simulate processing
              </PrimaryButton>
            </div>
            {demoLoading ? (
              <GlassPanel style={{ padding: 40, maxWidth: 420, textAlign: "center" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,.12)",
                    borderTopColor: "var(--cyan)",
                    animation: "vs-spin .8s linear infinite",
                  }}
                />
                <div style={{ fontSize: 14.5, color: "var(--slate)" }}>Running forensic analysis…</div>
                <div style={{ fontSize: 12, color: "var(--slate-dim)", marginTop: 6 }}>
                  Extracting sensor noise & latent diffusion residuals
                </div>
              </GlassPanel>
            ) : (
              <div style={{ color: "var(--slate)", fontSize: 14 }}>
                Idle. Click above to preview the simulated processing spinner.
              </div>
            )}
            {items.some((i) => i.status !== "done") && (
              <div style={{ marginTop: 30 }}>
                <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 10 }}>Currently mid-analysis:</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {items.filter((i) => i.status !== "done").map((i) => (
                    <StatusPill key={i.id} status={i.status} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function HeatmapPanel({ item }) {
  const [mode, setMode] = useState("overlay");
  const [intensity, setIntensity] = useState(70);

  return (
    <GlassPanel style={{ padding: 24, maxWidth: 680 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["overlay", "side-by-side"].map((m) => (
          <button
            key={m}
            className="vs-btn"
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? "rgba(95,208,232,.14)" : "transparent",
              color: mode === m ? "var(--cyan)" : "var(--slate)",
              border: `1px solid ${mode === m ? "var(--cyan)" : "var(--line)"}`,
              borderRadius: 7,
              padding: "7px 14px",
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "overlay" ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", background: "#0d1524" }}>
          <img src={item.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <svg viewBox="0 0 100 75" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: intensity / 100 }}>
            {item.heatSpots.map((s, i) => (
              <ellipse
                key={i}
                cx={s.x}
                cy={s.y * 0.75}
                rx={s.r}
                ry={s.r * 0.75}
                fill={item.isAI ? "#F0A63D" : "#5FD0E8"}
                opacity="0.55"
              />
            ))}
          </svg>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", background: "#0d1524" }}>
            <img src={item.url} alt="original" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", background: "#0d1524" }}>
            <img src={item.url} alt="heatmap" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
            <svg viewBox="0 0 100 75" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {item.heatSpots.map((s, i) => (
                <ellipse
                  key={i}
                  cx={s.x}
                  cy={s.y * 0.75}
                  rx={s.r}
                  ry={s.r * 0.75}
                  fill={item.isAI ? "#F0A63D" : "#5FD0E8"}
                  opacity="0.65"
                />
              ))}
            </svg>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>Overlay intensity</span>
          <span>{intensity}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={intensity}
          onChange={(e) => setIntensity(+e.target.value)}
          style={{ width: "100%", accentColor: "#5FD0E8", cursor: "pointer" }}
        />
      </div>
    </GlassPanel>
  );
}

function MetadataPanel({ item }) {
  const [open, setOpen] = useState(true);
  const rows = [
    ["Camera make / model", item.metadata.camera],
    ["Timestamp", item.metadata.timestamp],
    ["Editing software detected", item.metadata.editor],
    ["C2PA content credentials", item.metadata.c2pa],
  ];

  return (
    <GlassPanel style={{ maxWidth: 620, overflow: "hidden" }}>
      <button
        className="vs-btn"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "transparent",
          color: "var(--ink)",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 15,
        }}
      >
        <span>Provenance details</span>
        <span style={{ color: "var(--slate)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid var(--line)" }}>
          {rows.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 24px",
                borderBottom: "1px solid var(--line)",
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--slate)" }}>{k}</span>
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

function RobustnessPanel({ item }) {
  const delta = item.robustness.compressed - item.robustness.original;

  return (
    <GlassPanel style={{ padding: 28, maxWidth: 620 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 10 }}>Original image</div>
          <div className="vs-serif" style={{ fontSize: 28, marginBottom: 8 }}>{item.robustness.original}%</div>
          <ScoreBar value={item.robustness.original} isAI={item.isAI} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 10 }}>Compressed / resized</div>
          <div className="vs-serif" style={{ fontSize: 28, marginBottom: 8 }}>{item.robustness.compressed}%</div>
          <ScoreBar value={item.robustness.compressed} isAI={item.isAI} />
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 22, marginBottom: 0, lineHeight: 1.55 }}>
        {Math.abs(delta) <= 5
          ? "The score held steady under compression — indicating the verdict does not rely on fragile or easily destroyed pixel artifacts."
          : "The score shifted noticeably after compression, which should be considered when assessing the weight of this result."}
      </p>
    </GlassPanel>
  );
}

/* ============================================================
   ROOT APPLICATION
   Synchronizes local state with URL hash (#/, #/login, #/signup, #/app)
   ============================================================ */

export default function App() {
  const getInitialView = () => {
    const hash = window.location.hash.replace("#/", "").replace("#", "");
    if (hash === "login" || hash === "signup" || hash === "app") return hash;
    return "landing";
  };

  const [view, setView] = useState(getInitialView);

  const navigateTo = (nextView) => {
    setView(nextView);
    window.location.hash = `#/${nextView === "landing" ? "" : nextView}`;
  };

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.replace("#/", "").replace("#", "");
      if (h === "login" || h === "signup" || h === "app") {
        setView(h);
      } else {
        setView("landing");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div
      className="vs-root"
      style={{
        background: view === "landing" ? "var(--navy-950)" : "var(--navy-900)",
        minHeight: "100vh",
      }}
    >
      <style>{GLOBAL_CSS}</style>
      {view === "landing" && <Landing goto={navigateTo} />}
      {view === "login" && <Login goto={navigateTo} onAuthed={() => navigateTo("app")} />}
      {view === "signup" && <Signup goto={navigateTo} onAuthed={() => navigateTo("app")} />}
      {view === "app" && <Workspace onLogout={() => navigateTo("landing")} />}
    </div>
  );
}
