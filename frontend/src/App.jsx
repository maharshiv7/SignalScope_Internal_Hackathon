import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  Layers,
  ZoomIn,
  Download,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  RefreshCw,
  FileText,
  Info,
  Camera,
  Cpu,
  Activity,
  Eye,
  Check,
  AlertTriangle,
  FileCheck2,
  Lock,
  Printer
} from "lucide-react";

/* ============================================================
   VERASCOPE — Forensic Image Verification Suite
   Design tokens with dual-theme support (Dark & White / Light mode):
   Dark:
     navy-950 #070B14  navy-900 #0B1220  panel #121B30
     glass rgba(255,255,255,.05)  line rgba(255,255,255,.09)
     cyan #5FD0E8  amber #F0A63D  ink #EDEFF5  slate #8891A8
   Light / White mode:
     navy-950 #F8FAFC  navy-900 #F1F5F9  panel #FFFFFF
     glass rgba(255,255,255,.82)  line rgba(15,23,42,.1)
     cyan #0284C7  amber #D97706  ink #0F172A  slate #475569
   Type: Fraunces (display/verdict) + Inter (UI/body)
   ============================================================ */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,440;0,9..144,560;1,9..144,440&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
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
  --cyan-bg: rgba(95,208,232,.1);
  --amber: #F0A63D;
  --amber-dim: #8A5A22;
  --amber-bg: rgba(240,166,61,.1);
  --ink: #EDEFF5;
  --slate: #8891A8;
  --slate-dim: #5B6478;
  --grid-line: rgba(255,255,255,.035);
  --card-shadow: 0 30px 60px -20px rgba(0,0,0,.5);
  --badge-bg: rgba(7,11,20,.65);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ink);
  background: var(--navy-900);
  min-height: 100vh;
  width: 100%;
  position: relative;
  transition: background-color .3s ease, color .3s ease;
}

.vs-root.theme-light {
  --navy-950: #F8FAFC;
  --navy-900: #F1F5F9;
  --panel: #FFFFFF;
  --panel-2: #F8FAFC;
  --glass: rgba(255,255,255,.82);
  --glass-strong: rgba(255,255,255,.94);
  --line: rgba(15,23,42,.1);
  --line-strong: rgba(15,23,42,.18);
  --cyan: #0284C7;
  --cyan-dim: #0369A1;
  --cyan-bg: rgba(2,132,199,.12);
  --amber: #D97706;
  --amber-dim: #B45309;
  --amber-bg: rgba(217,119,6,.12);
  --ink: #0F172A;
  --slate: #475569;
  --slate-dim: #94A3B8;
  --grid-line: rgba(15,23,42,.04);
  --card-shadow: 0 20px 45px -15px rgba(15,23,42,.08);
  --badge-bg: rgba(255,255,255,.85);
}

.vs-serif {
  font-family: 'Fraunces', Georgia, serif;
}
.vs-mono {
  font-family: 'JetBrains Mono', monospace;
}
.vs-root ::selection {
  background: var(--cyan);
  color: #ffffff;
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
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 42px 42px;
}
`;

/* ============================================================
   HIGH-PRECISION FORENSIC SVG BENCHMARKS
   Embedded offline samples with realistic sensor & latent artifacts
   ============================================================ */

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

const SAMPLE_COMPRESSED_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
    <linearGradient id="compBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#16202c" />
      <stop offset="100%" stop-color="#0d141e" />
    </linearGradient>
  </defs>
  <rect width="600" height="450" fill="url(#compBg)" />
  <circle cx="250" cy="200" r="85" fill="#334155" />
  <circle cx="350" cy="220" r="95" fill="#1e293b" />
  <g stroke="#64748b" stroke-width="1.5" opacity="0.3" stroke-dasharray="8,8">
    <line x1="0" y1="100" x2="600" y2="100" />
    <line x1="0" y1="200" x2="600" y2="200" />
    <line x1="0" y1="300" x2="600" y2="300" />
    <line x1="150" y1="0" x2="150" y2="450" />
    <line x1="300" y1="0" x2="300" y2="450" />
    <line x1="450" y1="0" x2="450" y2="450" />
  </g>
  <text x="24" y="36" fill="#8891A8" font-family="sans-serif" font-size="13">DOUBLE-COMPRESSED SOCIAL REPOST SAMPLE</text>
</svg>
`)}`;

const SAMPLE_DIFFUSION_LANDSCAPE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#431407" />
      <stop offset="40%" stop-color="#7c2d12" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
  </defs>
  <rect width="600" height="450" fill="url(#skyGrad)" />
  <polygon points="120,450 260,180 380,450" fill="#172554" />
  <polygon points="280,450 420,140 560,450" fill="#0f172a" />
  <circle cx="260" cy="180" r="16" fill="#F0A63D" opacity="0.75" />
  <text x="24" y="36" fill="#F0A63D" font-family="sans-serif" font-size="13">SYNTHETIC METROPOLIS · FLUX DIFFUSION LATENT</text>
</svg>
`)}`;

/* ---------- Pre-seeded Forensic Items (Shared in-memory session) ---------- */

const PRESEEDED_ITEMS = [
  {
    id: "preseed-editorial-01",
    name: "editorial_press_photo.jpg",
    url: SAMPLE_REAL_SVG,
    verdict: "Likely real",
    isAI: false,
    confidence: 89,
    status: "done",
    explanation:
      "The noise pattern across the image is consistent with a physical camera sensor, and compression artifacts follow the natural, irregular pattern typical of a photograph processed through standard editorial software rather than a generative model. Natural illumination geometry shows consistent shadow falls.",
    heatSpots: [
      { x: 38, y: 32, r: 8, label: "Optical sensor grain baseline" },
      { x: 55, y: 36, r: 7, label: "Natural corneal light azimuth" },
      { x: 48, y: 58, r: 10, label: "Continuous dermal micro-texture" },
    ],
    metadata: {
      camera: "Canon EOS R6, 50mm f/1.8",
      timestamp: "2026-08-14 17:22:03 UTC",
      editor: "Adobe Lightroom 13.2",
      c2pa: "Content credentials present, unverified issuer",
    },
    robustness: {
      original: 89,
      compressed: 87,
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
      "The image exhibits smooth micro-texture transitions around facial contours and subtle repeating frequency patterns in high-frequency background noise. Eye reflection vectors diverge slightly from the primary scene illuminant, patterns frequently observed in synthetic generative outputs.",
    heatSpots: [
      { x: 44, y: 32, r: 10, label: "Latent boundary over-smoothing" },
      { x: 56, y: 34, r: 9, label: "Corneal reflection angle variance" },
      { x: 50, y: 54, r: 12, label: "Fourier high-frequency roll-off anomaly" },
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
  {
    id: "preseed-compressed-03",
    name: "whatsapp_viral_repost.jpg",
    url: SAMPLE_COMPRESSED_SVG,
    verdict: "Likely real",
    isAI: false,
    confidence: 76,
    status: "done",
    explanation:
      "Despite severe secondary JPEG 8x8 DCT block quantization from chat network recompression, physical sensor noise residuals and edge gradients hold steady without synthetic diffusion characteristics.",
    heatSpots: [
      { x: 40, y: 45, r: 12, label: "Secondary JPEG quantization grid" },
      { x: 60, y: 50, r: 11, label: "Intact sensor response non-uniformity" },
    ],
    metadata: {
      camera: "Sony Alpha 7 IV (Stripped by messenger)",
      timestamp: "2026-07-29 09:14:22 UTC",
      editor: "WhatsApp Image Processing Pipeline",
      c2pa: "Credentials stripped during re-encoding",
    },
    robustness: {
      original: 76,
      compressed: 74,
    },
  },
  {
    id: "preseed-landscape-04",
    name: "synthetic_metropolis.png",
    url: SAMPLE_DIFFUSION_LANDSCAPE,
    verdict: "Likely AI-generated",
    isAI: true,
    confidence: 92,
    status: "done",
    explanation:
      "Spectral FFT decomposition uncovers synthetic checkerboard patterns typical of upsampler deconvolution layers. Geometrical vanishing points diverge across background architecture.",
    heatSpots: [
      { x: 45, y: 35, r: 11, label: "Deconvolution upsampler grid artifact" },
      { x: 65, y: 25, r: 9, label: "Specular horizon inconsistency" },
    ],
    metadata: {
      camera: "Not detected",
      timestamp: "Not present",
      editor: "Diffusion WebUI Generation Engine",
      c2pa: "Absent",
    },
    robustness: {
      original: 92,
      compressed: 88,
    },
  },
];

/* ---------- Atoms & Controls ---------- */

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
        boxShadow: "var(--card-shadow)",
        transition: "background .3s ease, border-color .3s ease, box-shadow .3s ease",
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

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="vs-btn"
      onClick={onToggle}
      aria-label="Toggle White Mode or Dark Mode"
      title={`Switch to ${theme === "dark" ? "White / Light" : "Dark"} mode`}
      style={{
        background: "var(--glass)",
        color: "var(--ink)",
        border: "1px solid var(--line)",
        borderRadius: 9,
        padding: "8px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
      }}
    >
      {theme === "dark" ? (
        <>
          <Sun size={15} style={{ color: "var(--amber)" }} />
          <span>White Mode</span>
        </>
      ) : (
        <>
          <Moon size={15} style={{ color: "var(--cyan)" }} />
          <span>Dark Mode</span>
        </>
      )}
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
          background: "var(--glass-strong)",
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
      <circle cx="16" cy="16" r="14" stroke="#5FD0E8" strokeWidth="1.6" opacity=".95" />
      <circle cx="16" cy="16" r="5.5" fill="#5FD0E8" />
      <path d="M16 2 L16 8 M16 24 L16 30 M2 16 L8 16 M24 16 L30 16" stroke="#F0A63D" strokeWidth="1.4" opacity=".9" />
    </svg>
  );
}

/* ---------- ScanDemo (Landing Hero Orchestrated Motion) ---------- */

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
        background: "linear-gradient(135deg, #1a2740 0%, #0d1524 60%)",
        boxShadow: "var(--card-shadow)",
      }}
    >
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
          padding: "6px 12px",
          borderRadius: 8,
          background: "var(--badge-bg)",
          border: "1px solid var(--line-strong)",
          color: phase === "revealed" ? "var(--amber)" : "var(--slate)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "color .4s ease",
        }}
      >
        {phase === "revealed" ? "Likely AI-generated · 82%" : "Analyzing…"}
      </div>

      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 14,
          fontSize: 11,
          fontFamily: "monospace",
          color: "var(--slate)",
          background: "var(--badge-bg)",
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid var(--line)",
        }}
      >
        MODAL FREQ · 2840 HZ
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 1: LANDING ( / ) — Comprehensive Newsroom Fact-Checking
   ============================================================ */

function Landing({ goto, theme, onToggleTheme }) {
  const steps = [
    { n: "01", t: "Upload an image", d: "Drop in a single photo or batch queue — JPG, PNG, and camera exports supported." },
    { n: "02", t: "Inspect forensic reasoning", d: "Attention heatmap, Fourier spectrum roll-off, and plain-language reasoning, not a black box score." },
    { n: "03", t: "Read the verdict, hedged", d: "Likely AI-generated or likely real with a confidence percentage — adhering to editorial standards, never a flat claim." },
  ];

  const capabilities = [
    {
      icon: <Activity size={20} style={{ color: "var(--cyan)" }} />,
      title: "Frequency Domain FFT Residuals",
      desc: "Detects upsampling grid patterns and diffusion latent harmonics that do not occur in optical camera sensors."
    },
    {
      icon: <Eye size={20} style={{ color: "var(--amber)" }} />,
      title: "Specular & Corneal Geometry",
      desc: "Analyzes eye reflection angles to confirm whether catchlights originate from physically consistent light azimuths."
    },
    {
      icon: <Cpu size={20} style={{ color: "var(--cyan)" }} />,
      title: "Silicon PRNU Noise Matching",
      desc: "Measures Photo-Response Non-Uniformity fingerprints characteristic of hardware physical camera sensors."
    },
    {
      icon: <FileCheck2 size={20} style={{ color: "var(--amber)" }} />,
      title: "C2PA Provenance & Cryptographic Chain",
      desc: "Validates digital signatures, hardware tamper-evident seals, and Adobe Content Authenticity manifests."
    }
  ];

  const faqs = [
    {
      q: "Why does Verascope only use hedged verdicts instead of absolute claims?",
      a: "Responsible newsroom forensics requires epistemic humility. Generative models and camera processing pipelines evolve continuously. Presenting a probabilistic verdict with an explainable confidence percentage prevents false certainty and respects editorial standards."
    },
    {
      q: "How does the tool hold up against social media re-compression?",
      a: "Verascope includes a dedicated Robustness module that tests score stability under aggressive compression (e.g. WhatsApp, X, Instagram) so fact-checkers know if the result is resilient or fragile."
    },
    {
      q: "Are my uploaded investigative images stored or sent to third parties?",
      a: "Zero retention. All analysis occurs strictly within your active browser session memory. Once you close or reload the tab, everything is purged."
    },
    {
      q: "What deep learning architectures power Verascope?",
      a: "The system reconciles multi-task forensic models trained on high-resolution camera archives and generative diffusion benchmarks (Midjourney, Flux, Stable Diffusion) using both spatial and frequency domain representations."
    }
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="vs-scrollbar" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 28px" }}>
      {/* nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => goto("landing")}>
          <MarkIcon />
          <span className="vs-serif" style={{ fontSize: 20, fontWeight: 560, letterSpacing: ".01em" }}>Verascope</span>
          <span style={{ fontSize: 11, background: "var(--cyan-bg)", color: "var(--cyan)", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
            FORENSIC SUITE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a className="vs-link" href="#how" style={{ color: "var(--slate)", textDecoration: "none", fontSize: 14 }}>How it works</a>
          <a className="vs-link" href="#capabilities" style={{ color: "var(--slate)", textDecoration: "none", fontSize: 14 }}>Capabilities</a>
          <a className="vs-link" href="#trust" style={{ color: "var(--slate)", textDecoration: "none", fontSize: 14 }}>Why trust it</a>
          <a className="vs-link" href="#faq" style={{ color: "var(--slate)", textDecoration: "none", fontSize: 14 }}>FAQ</a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <GhostButton onClick={() => goto("login")} style={{ padding: "8px 16px", fontSize: 14 }}>Log in</GhostButton>
          <PrimaryButton onClick={() => goto("signup")} style={{ padding: "8px 18px", fontSize: 14 }}>Get started</PrimaryButton>
        </div>
      </nav>

      {/* hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56, alignItems: "center", padding: "56px 0 88px" }}>
        <div style={{ animation: "vs-fade-up .7s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 20, background: "var(--glass)", border: "1px solid var(--line)", marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)" }} />
            <span style={{ fontSize: 12, color: "var(--slate)" }}>Editorial Verification Architecture · C2PA Aligned</span>
          </div>
          <h1 className="vs-serif" style={{ fontSize: 52, lineHeight: 1.08, fontWeight: 480, margin: "0 0 22px", letterSpacing: "-.01em" }}>
            Know what you're looking at, before you share it.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--slate)", maxWidth: 480, margin: "0 0 32px" }}>
            Verascope reads an image the way a forensic examiner would — pixel artifacts, compression history, metadata — and hands you a hedged, explainable verdict instead of a bare yes or no.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <PrimaryButton onClick={() => goto("signup")}>Launch Forensic Workspace</PrimaryButton>
            <GhostButton onClick={() => goto("login")}>I have an account</GhostButton>
          </div>
          <p style={{ fontSize: 13, color: "var(--slate-dim)", marginTop: 18, display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={13} style={{ color: "var(--cyan)" }} />
            Zero image persistence. Runs in-memory; nothing is stored after your session.
          </p>
        </div>
        <div style={{ animation: "vs-fade-up .8s ease .1s both" }}>
          <ScanDemo />
        </div>
      </section>

      {/* 3-Step Sequence */}
      <section id="how" style={{ padding: "40px 0 80px", borderTop: "1px solid var(--line)" }}>
        <h2 className="vs-serif" style={{ fontSize: 28, fontWeight: 500, margin: "48px 0 34px" }}>Three steps, no jargon</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {steps.map((s) => (
            <GlassPanel key={s.n} style={{ padding: 28 }}>
              <div className="vs-serif" style={{ color: "var(--cyan)", fontSize: 16, marginBottom: 14, fontWeight: 600 }}>{s.n}</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{s.t}</div>
              <div style={{ fontSize: 14.5, color: "var(--slate)", lineHeight: 1.6 }}>{s.d}</div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Forensic Capabilities Grid */}
      <section id="capabilities" style={{ padding: "20px 0 80px", borderTop: "1px solid var(--line)" }}>
        <h2 className="vs-serif" style={{ fontSize: 28, fontWeight: 500, margin: "36px 0 14px" }}>
          Forensic Inspection Layers
        </h2>
        <p style={{ color: "var(--slate)", fontSize: 15, maxWidth: 640, marginBottom: 34 }}>
          Rather than relying on a single brittle classifier, Verascope examines orthogonal physical signals across multiple computational domains.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 22 }}>
          {capabilities.map((c, i) => (
            <GlassPanel key={i} style={{ padding: 26, display: "flex", gap: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--glass-strong)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.55, margin: 0 }}>{c.desc}</p>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Trust Strip with stats */}
      <section id="trust" style={{ padding: "10px 0 90px" }}>
        <GlassPanel style={{ padding: "38px 42px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--cyan)", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>
              <ShieldCheck size={16} />
              RESPONSIBLE FORENSICS
            </div>
            <h3 className="vs-serif" style={{ fontSize: 26, fontWeight: 500, margin: "0 0 12px" }}>
              Confidence, not certainty
            </h3>
            <p style={{ color: "var(--slate)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 460 }}>
              Every result ships with a confidence percentage, a heat-map you can inspect yourself, and a note on how the score held up under compression. Nothing here is presented as flat certainty — that's the core of responsible verification.
            </p>
          </div>
          <div style={{ display: "flex", gap: 32, justifyContent: "flex-end" }}>
            <Stat label="Hedged verdicts" value="100%" />
            <Stat label="Panels per image" value="6" />
            <Stat label="Stored after session" value="0" />
          </div>
        </GlassPanel>
      </section>

      {/* Interactive FAQ Accordion */}
      <section id="faq" style={{ padding: "20px 0 90px", borderTop: "1px solid var(--line)" }}>
        <h2 className="vs-serif" style={{ fontSize: 28, fontWeight: 500, margin: "36px 0 24px" }}>Frequently Asked Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f, idx) => (
            <GlassPanel key={idx} style={{ overflow: "hidden" }}>
              <button
                className="vs-btn"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "var(--ink)",
                  padding: "18px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 15,
                  textAlign: "left",
                }}
              >
                <span>{f.q}</span>
                <ChevronDown
                  size={18}
                  style={{
                    color: "var(--slate)",
                    transform: openFaq === idx ? "rotate(180deg)" : "none",
                    transition: "transform .2s ease",
                  }}
                />
              </button>
              {openFaq === idx && (
                <div style={{ padding: "0 24px 20px", color: "var(--slate)", fontSize: 14.5, lineHeight: 1.65, borderTop: "1px solid var(--line)" }}>
                  {f.a}
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "26px 0 50px", display: "flex", justifyContent: "space-between", color: "var(--slate-dim)", fontSize: 13 }}>
        <span>Verascope — Newsroom Image Provenance & Forensics Suite</span>
        <span>Hackathon build · In-memory session · Privacy first</span>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div className="vs-serif" style={{ fontSize: 32, color: "var(--cyan)", fontWeight: 560 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "var(--slate)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ============================================================
   AUTH SHELL (PAGE 2: LOGIN & PAGE 3: SIGNUP)
   ============================================================ */

function AuthShell({ title, subtitle, children, footer, theme, onToggleTheme }) {
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
      <div style={{ position: "absolute", top: 20, right: 28, zIndex: 10 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
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
          width: 420,
          padding: "38px 34px",
          position: "relative",
          zIndex: 1,
          animation: "vs-fade-up .5s ease both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <MarkIcon size={22} />
          <span className="vs-serif" style={{ fontSize: 17, fontWeight: 560 }}>Verascope</span>
        </div>
        <h1 className="vs-serif" style={{ fontSize: 26, fontWeight: 500, margin: "0 0 6px" }}>{title}</h1>
        <p style={{ fontSize: 14, color: "var(--slate)", margin: "0 0 26px" }}>{subtitle}</p>
        {children}
        {footer}
      </GlassPanel>
    </div>
  );
}

function Login({ goto, onAuthed, theme, onToggleTheme }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to verify investigative images."
      theme={theme}
      onToggleTheme={onToggleTheme}
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
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="editor@newsroom.org" />
        <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        <PrimaryButton type="submit" style={{ width: "100%", marginTop: 4 }}>Log in</PrimaryButton>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span onClick={() => goto("landing")} style={{ color: "var(--slate-dim)", fontSize: 13, cursor: "pointer" }}>← Back to home</span>
      </div>
    </AuthShell>
  );
}

function Signup({ goto, onAuthed, theme, onToggleTheme }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start verifying images in under a minute."
      theme={theme}
      onToggleTheme={onToggleTheme}
      footer={
        <p style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 22, textAlign: "center" }}>
          Already have an account?{" "}
          <span onClick={() => goto("login")} style={{ color: "var(--cyan)", cursor: "pointer", fontWeight: 600 }}>
            Log in
          </span>
        </p>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onAuthed(); }}>
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Ellis" />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="investigator@newsroom.org" />
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
  const confidence = Math.round(isAI ? rand(72, 94) : rand(68, 93));

  return {
    id: `${file.name}-${seed}-${Date.now()}`,
    name: file.name,
    size: (file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "1.85 MB"),
    url: URL.createObjectURL(file),
    verdict: isAI ? "Likely AI-generated" : "Likely real",
    isAI,
    confidence,
    explanation: isAI
      ? "The image shows unusually smooth texture transitions around facial contours and subtle repeating frequency patterns in high-frequency background noise. Taken together, these characteristics are more typical of generative synthesis decoders than physical camera sensors."
      : "The noise distribution across the image aligns with optical sensor noise, and compression boundaries show the irregular distribution typical of a camera photograph exported via standard editors. No evident signs of generative synthesis.",
    heatSpots: [
      { x: 32 + rand(0, 15), y: 30 + rand(0, 15), r: 9, label: isAI ? "Diffusion boundary artifact" : "Consistent optical noise" },
      { x: 60 + rand(0, 10), y: 35 + rand(0, 10), r: 8, label: isAI ? "Catchlight reflection mismatch" : "Single-source ray consistency" },
      { x: 46 + rand(0, 10), y: 64 + rand(0, 10), r: 11, label: isAI ? "Dermal micro-texture smoothing" : "Camera sensor PRNU grain" },
    ],
    metadata: {
      camera: isAI ? "Not detected" : "Canon EOS R6, 50mm f/1.8",
      timestamp: isAI ? "Not present" : "2026-08-14 17:22:03 UTC",
      editor: isAI ? "Not present" : "Adobe Lightroom 13.2",
      c2pa: isAI ? "No content credentials found" : "Content credentials present, unverified issuer",
    },
    robustness: {
      original: confidence,
      compressed: Math.max(0, Math.min(100, confidence + Math.round(rand(-7, 4)))),
    },
  };
}

function ScoreBar({ value, isAI }) {
  return (
    <div style={{ height: 8, borderRadius: 5, background: "rgba(148,163,184,.15)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          borderRadius: 5,
          background: isAI ? "linear-gradient(90deg,#8A5A22,var(--amber))" : "linear-gradient(90deg,#2E7C8F,var(--cyan))",
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
          background: drag ? "var(--cyan-bg)" : "var(--glass)",
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

function PageHeader({ title, desc, action }) {
  return (
    <div style={{ marginBottom: 26, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
      <div>
        <h2 className="vs-serif" style={{ fontSize: 26, fontWeight: 500, margin: "0 0 6px" }}>{title}</h2>
        {desc && <p style={{ color: "var(--slate)", fontSize: 14.5, margin: 0, maxWidth: 640 }}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Dossier Export Report Modal ---------- */

function ReportModal({ item, onClose }) {
  if (!item) return null;
  const printDossier = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 20,
      }}
    >
      <GlassPanel
        style={{
          maxWidth: 680,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 34,
          position: "relative",
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MarkIcon size={24} />
            <div>
              <div className="vs-serif" style={{ fontSize: 18, fontWeight: 560 }}>Verascope Forensic Dossier</div>
              <div style={{ fontSize: 12, color: "var(--slate)" }}>Editorial Verification Certificate</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="vs-btn" onClick={printDossier} style={{ background: "var(--cyan-bg)", color: "var(--cyan)", border: "1px solid var(--cyan-dim)", padding: "6px 12px", borderRadius: 6, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
              <Printer size={14} /> Print / Save PDF
            </button>
            <button className="vs-btn" onClick={onClose} style={{ background: "transparent", color: "var(--slate)", border: "1px solid var(--line)", padding: "6px 12px", borderRadius: 6, fontSize: 12.5 }}>
              ✕ Close
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 20, marginBottom: 22, alignItems: "center" }}>
          <img src={item.url} alt={item.name} style={{ width: 100, height: 100, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
            <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 8 }}>
              File Size: {item.size || "1.85 MB"} · SHA-256 Mock: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
            <div style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: item.isAI ? "var(--amber)" : "var(--cyan)", background: item.isAI ? "var(--amber-bg)" : "var(--cyan-bg)", padding: "4px 10px", borderRadius: 6 }}>
              {item.verdict} · {item.confidence}% Hedged Confidence
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--slate)", marginBottom: 6 }}>PLAIN-LANGUAGE FORENSIC REASONING</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)", margin: 0, padding: 14, background: "var(--glass-strong)", borderRadius: 8, border: "1px solid var(--line)" }}>
            {item.explanation}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ padding: 14, background: "var(--glass-strong)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 8, fontWeight: 600 }}>PROVENANCE METADATA</div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--slate)" }}>Camera:</span>
              <span>{item.metadata.camera}</span>
            </div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--slate)" }}>Timestamp:</span>
              <span>{item.metadata.timestamp}</span>
            </div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--slate)" }}>C2PA Manifest:</span>
              <span>{item.metadata.c2pa}</span>
            </div>
          </div>
          <div style={{ padding: 14, background: "var(--glass-strong)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 8, fontWeight: 600 }}>ROBUSTNESS PROFILE</div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--slate)" }}>Original Confidence:</span>
              <span>{item.robustness.original}%</span>
            </div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--slate)" }}>Post-Compression:</span>
              <span>{item.robustness.compressed}%</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--slate-dim)", marginTop: 6 }}>
              Stability Delta: {Math.abs(item.robustness.compressed - item.robustness.original)}%
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "var(--slate-dim)", borderTop: "1px solid var(--line)", paddingTop: 14, lineHeight: 1.5 }}>
          Disclaimer: This dossier provides probabilistic hedged forensic indicators in compliance with IFCN responsible fact-checking standards. It does not constitute absolute legal certification.
        </div>
      </GlassPanel>
    </div>
  );
}

function Workspace({ onLogout, theme, onToggleTheme }) {
  const [tab, setTab] = useState("verdict");
  const [items, setItems] = useState(PRESEEDED_ITEMS); // In-memory session list
  const [activeId, setActiveId] = useState(PRESEEDED_ITEMS[0].id);
  const [demoLoading, setDemoLoading] = useState(false);
  const [reportItem, setReportItem] = useState(null);

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
        size: (s.file.size ? (s.file.size / 1024 / 1024).toFixed(2) + " MB" : "2.1 MB"),
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

  const loadDemoSample = (index) => {
    const target = PRESEEDED_ITEMS[index % PRESEEDED_ITEMS.length];
    const newItem = {
      ...target,
      id: `sample-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `copy_${target.name}`,
    };
    setItems((prev) => [newItem, ...prev]);
    setActiveId(newItem.id);
    setTab("verdict");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {reportItem && <ReportModal item={reportItem} onClose={() => setReportItem(null)} />}

      <header
        style={{
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          background: "var(--glass-strong)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          zIndex: 10,
          transition: "background .3s ease, border-color .3s ease",
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
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            {active && (
              <GhostButton onClick={() => setReportItem(active)} style={{ padding: "7px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={14} style={{ color: "var(--cyan)" }} />
                <span>Export Dossier</span>
              </GhostButton>
            )}
            <GhostButton onClick={onLogout} style={{ padding: "7px 14px", fontSize: 13 }}>
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
                fontWeight: tab === t.id ? 600 : 500,
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
            <div style={{ maxWidth: 640 }}>
              <Dropzone multiple={false} onFiles={ingest} />
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 10, fontWeight: 500 }}>
                  Or test with verified reference presets:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    className="vs-btn"
                    onClick={() => loadDemoSample(0)}
                    style={{
                      background: "var(--cyan-bg)",
                      color: "var(--cyan)",
                      border: "1px solid var(--cyan-dim)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      textAlign: "left",
                    }}
                  >
                    + Canon EOS R6 (Likely real)
                  </button>
                  <button
                    className="vs-btn"
                    onClick={() => loadDemoSample(1)}
                    style={{
                      background: "var(--amber-bg)",
                      color: "var(--amber)",
                      border: "1px solid var(--amber-dim)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      textAlign: "left",
                    }}
                  >
                    + Latent Portrait (Likely AI)
                  </button>
                  <button
                    className="vs-btn"
                    onClick={() => loadDemoSample(2)}
                    style={{
                      background: "var(--glass)",
                      color: "var(--slate)",
                      border: "1px solid var(--line-strong)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      textAlign: "left",
                    }}
                  >
                    + Compressed Social Repost
                  </button>
                  <button
                    className="vs-btn"
                    onClick={() => loadDemoSample(3)}
                    style={{
                      background: "var(--amber-bg)",
                      color: "var(--amber)",
                      border: "1px solid var(--amber-dim)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      textAlign: "left",
                    }}
                  >
                    + Synthetic Metropolis
                  </button>
                </div>
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
            <div style={{ maxWidth: 640, marginBottom: 32 }}>
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
                        fontWeight: 500,
                      }}
                      title={it.name}
                    >
                      {it.name}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <StatusPill status={it.status} />
                      {it.status === "done" && (
                        <span style={{ fontSize: 11.5, color: it.isAI ? "var(--amber)" : "var(--cyan)", fontWeight: 600 }}>
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
              action={
                active && (
                  <GhostButton onClick={() => setReportItem(active)} style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Download size={14} style={{ color: "var(--cyan)" }} />
                    Download Dossier
                  </GhostButton>
                )
              }
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active ? (
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24, maxWidth: 840 }}>
                <GlassPanel style={{ padding: 28 }}>
                  <div style={{ display: "flex", gap: 22, alignItems: "center", marginBottom: 20 }}>
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
                          marginBottom: 8,
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
                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, fontSize: 13, color: "var(--slate)" }}>
                    {active.isAI
                      ? "High-frequency Fourier harmonics indicate artificial latent diffusion generation."
                      : "Irregular noise variance distribution matches physical CMOS sensor response."}
                  </div>
                </GlassPanel>

                <GlassPanel style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--slate)", marginBottom: 12 }}>
                      FORENSIC METRICS SUMMARY
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                      <span style={{ color: "var(--slate)" }}>Sensor Grain Continuity</span>
                      <span style={{ fontWeight: 600, color: active.isAI ? "var(--amber)" : "var(--cyan)" }}>
                        {active.isAI ? "Abnormal (34%)" : "Consistent (91%)"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                      <span style={{ color: "var(--slate)" }}>Lighting Vector Coherence</span>
                      <span style={{ fontWeight: 600, color: active.isAI ? "var(--amber)" : "var(--cyan)" }}>
                        {active.isAI ? "Divergent (42%)" : "Unified (88%)"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13.5 }}>
                      <span style={{ color: "var(--slate)" }}>Compression Invariance</span>
                      <span style={{ fontWeight: 600 }}>{active.robustness.compressed}%</span>
                    </div>
                  </div>
                  <button
                    className="vs-btn"
                    onClick={() => setTab("heatmap")}
                    style={{
                      background: "var(--glass-strong)",
                      color: "var(--cyan)",
                      border: "1px solid var(--cyan-dim)",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 13,
                      marginTop: 16,
                      textAlign: "center",
                    }}
                  >
                    Inspect Attention Map →
                  </button>
                </GlassPanel>
              </div>
            ) : (
              <div style={{ color: "var(--slate)" }}>No images analyzed yet.</div>
            )}
          </>
        )}

        {/* Tab 4: Attention Map (With Interactive Split Slider) */}
        {tab === "heatmap" && (
          <>
            <PageHeader
              title="Attention map"
              desc="The regions that most influenced the verdict, overlaid on the original image with interactive view modes."
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
              desc="The reasoning behind the verdict, written in plain language for fact-checkers and newsroom editors."
            />
            <ThumbPicker items={doneItems} activeId={active?.id} onPick={setActiveId} />
            {active && (
              <GlassPanel style={{ padding: 28, maxWidth: 660 }}>
                <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 12, fontWeight: 600 }}>
                  WHY THE MODEL REACHED THIS VERDICT:
                </div>
                <p style={{ fontSize: 15.5, lineHeight: 1.75, margin: 0, color: "var(--ink)" }}>
                  {active.explanation}
                </p>
                <div style={{ marginTop: 22, borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", gap: 14 }}>
                  <div style={{ flex: 1, padding: 12, borderRadius: 8, background: "var(--glass-strong)" }}>
                    <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 4 }}>Primary Indicator</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: active.isAI ? "var(--amber)" : "var(--cyan)" }}>
                      {active.isAI ? "Sub-pixel deconvolution noise" : "Hardware PRNU sensor grain"}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: 12, borderRadius: 8, background: "var(--glass-strong)" }}>
                    <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 4 }}>Secondary Check</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
                      {active.isAI ? "Corneal lighting vectors mismatch" : "Discrete cosine transform balance"}
                    </div>
                  </div>
                </div>
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
                          {it.verdict} · {it.confidence}% confidence
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
                    border: "3px solid var(--line-strong)",
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

/* ---------- Enhanced Attention Map with Interactive Split Slider ---------- */

function HeatmapPanel({ item }) {
  const [mode, setMode] = useState("split"); // overlay | side-by-side | split
  const [intensity, setIntensity] = useState(70);
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const containerRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  return (
    <GlassPanel style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "split", label: "Interactive Split" },
            { id: "overlay", label: "Overlay" },
            { id: "side-by-side", label: "Side by Side" },
          ].map((m) => (
            <button
              key={m.id}
              className="vs-btn"
              onClick={() => setMode(m.id)}
              style={{
                background: mode === m.id ? "var(--cyan-bg)" : "transparent",
                color: mode === m.id ? "var(--cyan)" : "var(--slate)",
                border: `1px solid ${mode === m.id ? "var(--cyan)" : "var(--line)"}`,
                borderRadius: 7,
                padding: "7px 14px",
                fontSize: 13,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--slate)" }}>
          {mode === "split" ? "Drag cursor across image to compare" : "Grad-CAM forensic layer"}
        </div>
      </div>

      {mode === "split" && (
        <div
          ref={containerRef}
          onMouseMove={(e) => e.buttons === 1 && handlePointerMove(e)}
          onMouseDown={handlePointerMove}
          style={{
            position: "relative",
            borderRadius: 10,
            overflow: "hidden",
            aspectRatio: "4/3",
            userSelect: "none",
            cursor: "ew-resize",
            background: "#0d1524",
          }}
        >
          {/* Base Original */}
          <img src={item.url} alt="original" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

          {/* Sliced Heatmap Layer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`,
              overflow: "hidden",
            }}
          >
            <img src={item.url} alt="heatmap-underlay" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
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
            <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.7)", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 11 }}>
              HEATMAP
            </div>
          </div>

          {/* Divider Line & Handle */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${splitPos}%`,
              width: 2,
              background: "#ffffff",
              boxShadow: "0 0 8px rgba(0,0,0,.6)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: -12,
                transform: "translateY(-50%)",
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--cyan)",
                boxShadow: "0 2px 8px rgba(0,0,0,.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#04121a",
                fontWeight: "bold",
              }}
            >
              ⇄
            </div>
          </div>

          <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,.7)", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 11 }}>
            ORIGINAL
          </div>
        </div>
      )}

      {mode === "overlay" && (
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
      )}

      {mode === "side-by-side" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "4/3" }}>
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

      <div style={{ marginTop: 20 }}>
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
          style={{ width: "100%", accentColor: "var(--cyan)", cursor: "pointer" }}
        />
      </div>

      {item.heatSpots && (
        <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 8, fontWeight: 600 }}>KEY REGION ANOMALIES:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {item.heatSpots.map((spot, idx) => (
              <div key={idx} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.isAI ? "var(--amber)" : "var(--cyan)" }} />
                <span>{spot.label || `Region focal cluster #${idx + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
    <GlassPanel style={{ maxWidth: 640, overflow: "hidden" }}>
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
        <span>Provenance & Hardware Details</span>
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
    <GlassPanel style={{ padding: 28, maxWidth: 640 }}>
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
   Synchronizes state with URL hash and Theme (Dark / White)
   ============================================================ */

export default function App() {
  const getInitialView = () => {
    const hash = window.location.hash.replace("#/", "").replace("#", "");
    if (hash === "login" || hash === "signup" || hash === "app") return hash;
    return "landing";
  };

  const [view, setView] = useState(getInitialView);
  const [theme, setTheme] = useState("dark"); // "dark" | "light" (White Mode)

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
      className={`vs-root ${theme === "light" ? "theme-light" : ""}`}
      style={{
        background: view === "landing" ? "var(--navy-950)" : "var(--navy-900)",
        minHeight: "100vh",
      }}
    >
      <style>{GLOBAL_CSS}</style>
      {view === "landing" && <Landing goto={navigateTo} theme={theme} onToggleTheme={toggleTheme} />}
      {view === "login" && <Login goto={navigateTo} onAuthed={() => navigateTo("app")} theme={theme} onToggleTheme={toggleTheme} />}
      {view === "signup" && <Signup goto={navigateTo} onAuthed={() => navigateTo("app")} theme={theme} onToggleTheme={toggleTheme} />}
      {view === "app" && <Workspace onLogout={() => navigateTo("landing")} theme={theme} onToggleTheme={toggleTheme} />}
    </div>
  );
}
