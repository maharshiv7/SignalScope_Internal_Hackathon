import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Layers,
  SlidersHorizontal,
  History,
  ScanEye,
  Camera,
  Clock,
  PenTool,
  BadgeCheck,
  MessageSquareText,
  Grid3x3,
  RefreshCw,
} from "lucide-react";

/* ---------------------------------------------------------------
   Mock inference layer — pure front-end, no model wired up yet.
---------------------------------------------------------------- */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mockAnalyze(file) {
  const seed = hashString(file.name + file.size);
  const score = 0.12 + (seed % 8800) / 10000;
  const isAi = score > 0.5;
  const confidence = isAi ? score : 1 - score;

  const cameras = ["Canon EOS R5", "iPhone 15 Pro", "Sony A7 IV", null];
  const editors = ["Adobe Photoshop 25.3", "Lightroom Classic", null, null];
  const camera = cameras[seed % cameras.length];
  const editor = editors[(seed >> 3) % editors.length];
  const c2pa = seed % 5 === 0 ? "present" : seed % 5 === 1 ? "invalid" : "absent";

  const blobs = Array.from({ length: 4 }).map((_, i) => {
    const s = seed + i * 97;
    return {
      x: 15 + (s % 70),
      y: 15 + ((s >> 2) % 70),
      r: 18 + ((s >> 4) % 22),
      strength: 0.35 + ((s >> 6) % 60) / 100,
    };
  });

  const compressedDelta = (((seed >> 5) % 14) / 100) * (seed % 2 === 0 ? 1 : -1);
  const compressedScore = Math.min(0.99, Math.max(0.01, score + compressedDelta));

  const explanations = isAi
    ? [
        "Texture patterns in the skin and background repeat in ways that are uncommon in camera sensor noise.",
        "Lighting across the subject doesn't fully agree with the shadows in the scene, a pattern often seen in synthetic images.",
        "Fine detail around edges — hair, fabric, and reflections — looks slightly smoothed in a way generation models tend to produce.",
      ]
    : [
        "Sensor noise looks consistent across the frame, which is typical of an unaltered photo.",
        "Lighting and shadow direction agree throughout the scene.",
        "Fine detail holds up under close inspection, without the smoothing patterns generative tools tend to leave behind.",
      ];

  return {
    score,
    isAi,
    confidence,
    label: isAi ? "Likely AI-generated" : "Likely real",
    camera,
    editor,
    c2pa,
    timestamp: new Date(Date.now() - (seed % 1e10)).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    blobs,
    compressedScore,
    explanation: explanations[seed % explanations.length],
  };
}

/* ---------------------------------------------------------------
   Small shared atoms
---------------------------------------------------------------- */
function GlassPanel({ children, className = "", style = {} }) {
  return <div className={`glass ${className}`} style={style}>{children}</div>;
}

function ConfidenceBar({ value, tone }) {
  return (
    <div className="conf-track">
      <div
        className="conf-fill"
        style={{ width: `${Math.round(value * 100)}%`, background: tone === "ai" ? "var(--accent-ai)" : "var(--accent-real)" }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "pending") return <span className="badge badge-pending">Queued</span>;
  if (status === "processing") return <span className="badge badge-processing"><Loader2 size={11} className="spin" /> Analyzing</span>;
  return <span className="badge badge-done"><CheckCircle2 size={11} /> Done</span>;
}

function EmptyState({ icon: Icon, text, cta, onCta }) {
  return (
    <GlassPanel className="panel" style={{ textAlign: "center", padding: "48px 24px", color: "var(--ink-muted)" }}>
      <Icon size={22} style={{ marginBottom: 12, opacity: 0.8 }} />
      <p style={{ margin: "0 0 16px", fontSize: 14 }}>{text}</p>
      {cta && <button className="ghost-btn" onClick={onCta}>{cta}</button>}
    </GlassPanel>
  );
}

/* Horizontal strip for picking which analyzed image a page refers to */
function ImagePicker({ items, selectedId, onSelect }) {
  const done = items.filter((i) => i.status === "done");
  if (!done.length) return null;
  return (
    <div className="image-picker">
      {done.map((item) => (
        <button
          key={item.id}
          className={`picker-thumb ${selectedId === item.id ? "picker-active" : ""}`}
          onClick={() => onSelect(item.id)}
          title={item.name}
        >
          <img src={item.url} alt={item.name} />
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   Upload zone
---------------------------------------------------------------- */
function UploadZone({ onFiles, compact }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validate = (files) => {
    const accepted = [];
    let rejected = 0;
    Array.from(files).forEach((f) => {
      if (["image/jpeg", "image/png", "image/jpg"].includes(f.type)) accepted.push(f);
      else rejected++;
    });
    if (rejected > 0) {
      setError(`${rejected} file${rejected > 1 ? "s" : ""} skipped — only JPG and PNG are supported.`);
      setTimeout(() => setError(""), 4000);
    }
    if (accepted.length) onFiles(accepted);
  };

  return (
    <div
      className={`upload-zone ${dragOver ? "drag" : ""} ${compact ? "compact" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); validate(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/png, image/jpeg" multiple hidden
        onChange={(e) => { validate(e.target.files); e.target.value = ""; }} />
      <div className="upload-inner">
        <UploadCloud size={compact ? 20 : 30} strokeWidth={1.5} />
        <div>
          <p className="upload-title">{compact ? "Add more images" : "Drop images to examine"}</p>
          {!compact && <p className="upload-sub">or click to browse — JPG or PNG, one or many at once</p>}
        </div>
      </div>
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}

/* =================================================================
   PAGE 1 — Upload
================================================================= */
function UploadPage({ onFiles, items }) {
  return (
    <div className="page">
      <PageHeading title="Upload" sub="Bring in the image you want examined. JPG and PNG only — anything else is rejected before it reaches analysis." />
      <UploadZone onFiles={onFiles} />
      {items.length > 0 && (
        <p className="page-footnote">{items.length} image{items.length > 1 ? "s" : ""} added this session — check the Batch tab to see where each one stands.</p>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 2 — Batch upload view
================================================================= */
function BatchPage({ items, onFiles, selectedId, onSelect, goToVerdict }) {
  return (
    <div className="page">
      <PageHeading title="Batch" sub="Every image added this session, with where it stands in the pipeline." />
      <UploadZone onFiles={onFiles} compact />
      {items.length === 0 ? (
        <EmptyState icon={Grid3x3} text="Nothing uploaded yet — add images from the Upload tab." />
      ) : (
        <div className="batch-grid">
          {items.map((item) => (
            <button
              key={item.id}
              className={`thumb ${selectedId === item.id ? "thumb-active" : ""}`}
              onClick={() => { onSelect(item.id); if (item.status === "done") goToVerdict(); }}
            >
              <img src={item.url} alt={item.name} />
              <div className="thumb-overlay"><StatusBadge status={item.status} /></div>
              {item.status === "done" && (
                <div className={`thumb-tag ${item.result.isAi ? "tag-ai" : "tag-real"}`}>
                  {item.result.isAi ? "AI" : "Real"} · {Math.round(item.result.confidence * 100)}%
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 3 — Verdict display
================================================================= */
function VerdictPage({ items, selectedId, onSelect }) {
  const item = items.find((i) => i.id === selectedId && i.status === "done");
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setRevealed(false); const t = setTimeout(() => setRevealed(true), 40); return () => clearTimeout(t); }, [selectedId]);

  return (
    <div className="page">
      <PageHeading title="Verdict" sub="The headline read on an image — always hedged, never absolute." />
      <ImagePicker items={items} selectedId={selectedId} onSelect={onSelect} />
      {!item ? (
        <EmptyState icon={ShieldCheck} text="Pick a finished image above, or upload one first." />
      ) : (
        <GlassPanel className={`verdict-card ${revealed ? "reveal" : ""} ${item.result.isAi ? "tone-ai" : "tone-real"}`}>
          <div className="verdict-top">
            <div className="verdict-icon">{item.result.isAi ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}</div>
            <div>
              <p className="verdict-label">{item.result.label}</p>
              <p className="verdict-sub">Confidence {Math.round(item.result.confidence * 100)}%</p>
            </div>
          </div>
          <ConfidenceBar value={item.result.confidence} tone={item.result.isAi ? "ai" : "real"} />
        </GlassPanel>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 4 — Heat-map display
================================================================= */
function HeatmapPage({ items, selectedId, onSelect }) {
  const item = items.find((i) => i.id === selectedId && i.status === "done");
  const [mode, setMode] = useState("overlay");
  const [intensity, setIntensity] = useState(0.7);

  return (
    <div className="page">
      <PageHeading title="Attention map" sub="Where the model's attention concentrated most when forming its verdict." />
      <ImagePicker items={items} selectedId={selectedId} onSelect={onSelect} />
      {!item ? (
        <EmptyState icon={Layers} text="Pick a finished image above, or upload one first." />
      ) : (
        <GlassPanel className="panel">
          <div className="panel-head">
            <div className="panel-head-title"><Layers size={15} /> {item.name}</div>
            <div className="seg">
              <button className={mode === "overlay" ? "seg-active" : ""} onClick={() => setMode("overlay")}>Overlay</button>
              <button className={mode === "side" ? "seg-active" : ""} onClick={() => setMode("side")}>Side by side</button>
            </div>
          </div>
          {mode === "overlay" ? (
            <div className="heatmap-frame">
              <img src={item.url} alt="" />
              <div className="heatmap-layer" style={{ backgroundImage: gradientLayers(item.result.blobs, intensity) }} />
            </div>
          ) : (
            <div className="heatmap-side">
              <div className="heatmap-frame small"><img src={item.url} alt="original" /><span className="frame-label">Original</span></div>
              <div className="heatmap-frame small">
                <img src={item.url} alt="heatmap" />
                <div className="heatmap-layer" style={{ backgroundImage: gradientLayers(item.result.blobs, intensity) }} />
                <span className="frame-label">Regions flagged</span>
              </div>
            </div>
          )}
          <div className="slider-row">
            <SlidersHorizontal size={13} />
            <input type="range" min="0.2" max="1" step="0.05" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} />
            <span className="slider-label">Highlight strength</span>
          </div>
          <p className="panel-note">Brighter regions drew the most attention — not necessarily proof of manipulation on their own.</p>
        </GlassPanel>
      )}
    </div>
  );
}
function gradientLayers(blobs, intensity) {
  return blobs.map((b) => `radial-gradient(circle at ${b.x}% ${b.y}%, rgba(242,166,90,${b.strength * intensity}) 0%, rgba(242,166,90,0) ${b.r}%)`).join(", ");
}

/* =================================================================
   PAGE 5 — Explanation text box
================================================================= */
function ExplanationPage({ items, selectedId, onSelect }) {
  const item = items.find((i) => i.id === selectedId && i.status === "done");
  return (
    <div className="page">
      <PageHeading title="Explanation" sub="A plain-language reason behind the verdict — written for someone without a technical background." />
      <ImagePicker items={items} selectedId={selectedId} onSelect={onSelect} />
      {!item ? (
        <EmptyState icon={MessageSquareText} text="Pick a finished image above, or upload one first." />
      ) : (
        <GlassPanel className="panel">
          <div className="panel-head-title" style={{ marginBottom: 12 }}><MessageSquareText size={15} /> Why this verdict</div>
          <p className="verdict-explanation" style={{ margin: 0 }}>{item.result.explanation}</p>
        </GlassPanel>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 6 — Metadata / provenance
================================================================= */
function MetadataPage({ items, selectedId, onSelect }) {
  const item = items.find((i) => i.id === selectedId && i.status === "done");
  const [open, setOpen] = useState(true);
  const r = item?.result;
  const c2paLabel = r && {
    present: { text: "Content credentials verified", icon: BadgeCheck, tone: "real" },
    invalid: { text: "Content credentials found but invalid", icon: ShieldAlert, tone: "ai" },
    absent: { text: "No content credentials found", icon: ShieldAlert, tone: "muted" },
  }[r.c2pa];

  return (
    <div className="page">
      <PageHeading title="Metadata & provenance" sub="What the file itself says about where it came from — one signal among several." />
      <ImagePicker items={items} selectedId={selectedId} onSelect={onSelect} />
      {!item ? (
        <EmptyState icon={ScanEye} text="Pick a finished image above, or upload one first." />
      ) : (
        <GlassPanel className="panel">
          <button className="panel-head collapsible" onClick={() => setOpen(!open)}>
            <div className="panel-head-title"><ScanEye size={15} /> {item.name}</div>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {open && (
            <div className="meta-body">
              <div className="meta-row"><Camera size={14} /><span className="meta-label">Camera</span><span className="meta-value">{r.camera || "Not present in file"}</span></div>
              <div className="meta-row"><Clock size={14} /><span className="meta-label">Captured</span><span className="meta-value">{r.timestamp}</span></div>
              <div className="meta-row"><PenTool size={14} /><span className="meta-label">Editing software</span><span className="meta-value">{r.editor || "None detected"}</span></div>
              <div className={`meta-c2pa tone-${c2paLabel.tone}`}><c2paLabel.icon size={14} />{c2paLabel.text}</div>
              <p className="panel-note">Metadata can be stripped or edited, so treat this as one signal among several, not a verdict on its own.</p>
            </div>
          )}
        </GlassPanel>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 7 — Robustness comparison
================================================================= */
function RobustnessPage({ items, selectedId, onSelect }) {
  const item = items.find((i) => i.id === selectedId && i.status === "done");
  const [showCompressed, setShowCompressed] = useState(false);

  return (
    <div className="page">
      <PageHeading title="Stability under compression" sub="Whether the verdict holds up after the image is re-compressed or resized — a quick check against fragile signals." />
      <ImagePicker items={items} selectedId={selectedId} onSelect={onSelect} />
      {!item ? (
        <EmptyState icon={RefreshCw} text="Pick a finished image above, or upload one first." />
      ) : (
        <GlassPanel className="panel">
          <div className="panel-head">
            <div className="panel-head-title"><RefreshCw size={15} /> {item.name}</div>
            <div className="seg">
              <button className={!showCompressed ? "seg-active" : ""} onClick={() => setShowCompressed(false)}>Original</button>
              <button className={showCompressed ? "seg-active" : ""} onClick={() => setShowCompressed(true)}>Compressed</button>
            </div>
          </div>
          <div className="robust-frame">
            <img src={item.url} alt="" style={showCompressed ? { filter: "contrast(0.88) saturate(0.8) blur(0.4px)" } : {}} />
          </div>
          <div className="robust-scores">
            <div>
              <span className="meta-label">Original confidence</span>
              <ConfidenceBar value={item.result.confidence} tone={item.result.isAi ? "ai" : "real"} />
              <span className="score-num">{Math.round(item.result.confidence * 100)}%</span>
            </div>
            <div>
              <span className="meta-label">After re-compression</span>
              <ConfidenceBar value={item.result.compressedScore > 0.5 ? item.result.compressedScore : 1 - item.result.compressedScore} tone={item.result.compressedScore > 0.5 ? "ai" : "real"} />
              <span className="score-num">{Math.round((item.result.compressedScore > 0.5 ? item.result.compressedScore : 1 - item.result.compressedScore) * 100)}%</span>
            </div>
          </div>
          <p className="panel-note">
            {Math.abs(item.result.compressedScore - item.result.score) < 0.08
              ? "The verdict held steady after compression, which suggests the signal isn't a fragile artifact."
              : "The verdict shifted noticeably after compression — worth treating this result with extra caution."}
          </p>
        </GlassPanel>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 8 — Result history / session view
================================================================= */
function HistoryPage({ items, selectedId, onSelect, goToVerdict }) {
  const done = items.filter((i) => i.status === "done");
  return (
    <div className="page">
      <PageHeading title="Session history" sub="Every image checked so far in this session." />
      {done.length === 0 ? (
        <EmptyState icon={History} text="Nothing finished yet — analyzed images will show up here." />
      ) : (
        <div className="history-list wide">
          {done.map((item) => (
            <button key={item.id} className={`history-item wide ${selectedId === item.id ? "history-active" : ""}`}
              onClick={() => { onSelect(item.id); goToVerdict(); }}>
              <img src={item.url} alt="" />
              <div className="history-meta">
                <span className="history-name">{item.name}</span>
                <span className={`history-verdict ${item.result.isAi ? "tag-ai" : "tag-real"}`}>
                  {item.result.isAi ? "Likely AI" : "Likely real"} · {Math.round(item.result.confidence * 100)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =================================================================
   PAGE 9 — Loading / processing state (standalone demo)
================================================================= */
function LoadingPage({ items }) {
  const inFlight = items.filter((i) => i.status !== "done");
  const [demoStep, setDemoStep] = useState(null); // null | 'queued' | 'processing' | 'done'

  const runDemo = () => {
    setDemoStep("queued");
    setTimeout(() => setDemoStep("processing"), 700);
    setTimeout(() => setDemoStep("done"), 2600);
  };

  return (
    <div className="page">
      <PageHeading title="Loading state" sub="What someone sees while predict() is running — a short simulated delay so the real thing won't feel abrupt." />

      {inFlight.length > 0 && (
        <>
          <p className="page-footnote" style={{ marginBottom: 12 }}>Currently in the pipeline:</p>
          <div className="batch-grid" style={{ marginBottom: 24 }}>
            {inFlight.map((item) => (
              <div key={item.id} className="thumb" style={{ cursor: "default" }}>
                <img src={item.url} alt={item.name} />
                <div className="thumb-overlay"><StatusBadge status={item.status} /></div>
              </div>
            ))}
          </div>
        </>
      )}

      <GlassPanel className="panel">
        <div className="panel-head-title" style={{ marginBottom: 16 }}><Loader2 size={15} /> Try the loading sequence</div>
        {!demoStep && <button className="ghost-btn" onClick={runDemo}>Simulate processing</button>}
        {demoStep && (
          <div className="demo-loading">
            <div className={`demo-row ${demoStep === "queued" ? "demo-active" : ""}`}><StatusBadge status="pending" /><span>Waiting in the queue</span></div>
            <div className={`demo-row ${demoStep === "processing" ? "demo-active" : ""}`}><StatusBadge status="processing" /><span>Checking pixel patterns, metadata, and provenance</span></div>
            <div className={`demo-row ${demoStep === "done" ? "demo-active" : ""}`}><StatusBadge status="done" /><span>Ready to view</span></div>
            {demoStep === "done" && <button className="ghost-btn" style={{ marginTop: 14 }} onClick={runDemo}>Run again</button>}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

/* ---------------------------------------------------------------
   Shared page heading
---------------------------------------------------------------- */
function PageHeading({ title, sub }) {
  return (
    <div className="page-heading">
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
  );
}

/* ---------------------------------------------------------------
   Root app — tab navigation across all pages
---------------------------------------------------------------- */
const TABS = [
  { id: "upload", label: "Upload", icon: UploadCloud },
  { id: "batch", label: "Batch", icon: Grid3x3 },
  { id: "verdict", label: "Verdict", icon: ShieldCheck },
  { id: "heatmap", label: "Attention map", icon: Layers },
  { id: "explanation", label: "Explanation", icon: MessageSquareText },
  { id: "metadata", label: "Metadata", icon: ScanEye },
  { id: "robustness", label: "Robustness", icon: RefreshCw },
  { id: "history", label: "History", icon: History },
  { id: "loading", label: "Loading state", icon: Loader2 },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("upload");

  const handleFiles = useCallback((files) => {
    const newItems = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file, name: file.name, url: URL.createObjectURL(file),
      status: "pending", result: null,
    }));
    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item, idx) => {
      setTimeout(() => {
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "processing" } : p)));
      }, 150 + idx * 120);

      const delay = 1100 + (idx % 3) * 350 + Math.random() * 500;
      setTimeout(() => {
        const result = mockAnalyze(item.file);
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "done", result } : p)));
        setSelectedId((curr) => curr || item.id);
      }, delay);
    });
  }, []);

  const goToVerdict = () => setTab("verdict");
  const pageProps = { items, selectedId, onSelect: setSelectedId };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --bg: #0a0f1a; --bg-2: #0d1524;
          --ink: #e9edf5; --ink-muted: #8d98af;
          --glass-bg: rgba(255,255,255,0.055); --glass-border: rgba(255,255,255,0.12);
          --accent-real: #49d3c0; --accent-real-soft: rgba(73,211,192,0.15);
          --accent-ai: #f2a65a; --accent-ai-soft: rgba(242,166,90,0.15);
        }
        * { box-sizing: border-box; }
        .app {
          min-height: 100vh;
          background:
            radial-gradient(1100px 480px at 12% -10%, rgba(73,211,192,0.10), transparent 60%),
            radial-gradient(900px 420px at 100% 0%, rgba(242,166,90,0.09), transparent 55%),
            var(--bg);
          color: var(--ink); font-family: 'Inter', sans-serif;
          padding: 24px 20px 64px;
        }
        .glass { background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); border-radius: 16px; }

        .brand { display: flex; align-items: center; gap: 10px; max-width: 980px; margin: 0 auto 20px; }
        .brand-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, var(--accent-real), var(--accent-ai)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .brand-name { font-family: 'Fraunces', serif; font-size: 19px; }
        .brand-tag { color: var(--ink-muted); font-size: 12.5px; margin-left: 4px; }

        .tabbar { max-width: 980px; margin: 0 auto 28px; display: flex; gap: 4px; padding: 5px; overflow-x: auto; }
        .tabbar::-webkit-scrollbar { display: none; }
        .tab-btn {
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          font-family: inherit; font-size: 12.5px; font-weight: 500; color: var(--ink-muted);
          background: none; border: none; border-radius: 10px; padding: 8px 12px; cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .tab-btn:hover { background: rgba(255,255,255,0.06); color: var(--ink); }
        .tab-active { background: rgba(255,255,255,0.12) !important; color: var(--ink) !important; }

        .page { max-width: 780px; margin: 0 auto; }
        .page-heading { margin-bottom: 20px; }
        .page-heading h2 { font-family: 'Fraunces', serif; font-weight: 500; font-size: 26px; margin: 0 0 6px; }
        .page-heading p { color: var(--ink-muted); font-size: 13.5px; margin: 0; max-width: 56ch; line-height: 1.5; }
        .page-footnote { color: var(--ink-muted); font-size: 12.5px; margin-top: 14px; }

        .ghost-btn {
          font-family: inherit; font-size: 13px; font-weight: 600; color: var(--ink);
          background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 9px 16px; cursor: pointer; transition: background 0.2s ease;
        }
        .ghost-btn:hover { background: rgba(255,255,255,0.16); }

        .upload-zone { border: 1.5px dashed var(--glass-border); border-radius: 18px; background: var(--glass-bg); backdrop-filter: blur(18px); padding: 44px 24px; cursor: pointer; transition: border-color 0.25s ease, background 0.25s ease, transform 0.15s ease; margin-bottom: 6px; }
        .upload-zone.compact { padding: 16px 20px; border-radius: 14px; margin-bottom: 18px; }
        .upload-zone:hover { border-color: rgba(255,255,255,0.28); }
        .upload-zone.drag { border-color: var(--accent-real); background: rgba(73,211,192,0.08); transform: scale(1.01); }
        .upload-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--ink); }
        .upload-zone.compact .upload-inner { flex-direction: row; gap: 12px; }
        .upload-title { font-weight: 600; font-size: 15px; margin: 0; }
        .upload-sub { color: var(--ink-muted); font-size: 13px; margin: 2px 0 0; }
        .upload-error { margin-top: 14px; font-size: 12.5px; color: var(--accent-ai); background: var(--accent-ai-soft); border-radius: 8px; padding: 8px 12px; }

        .image-picker { display: flex; gap: 8px; margin-bottom: 18px; overflow-x: auto; padding-bottom: 2px; }
        .picker-thumb { width: 52px; height: 52px; flex-shrink: 0; border-radius: 10px; overflow: hidden; border: 2px solid transparent; padding: 0; cursor: pointer; opacity: 0.7; transition: opacity 0.2s ease, border-color 0.2s ease; }
        .picker-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .picker-thumb:hover { opacity: 1; }
        .picker-active { border-color: var(--accent-real); opacity: 1; }

        .batch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
        .thumb { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--glass-border); background: var(--bg-2); aspect-ratio: 1; padding: 0; cursor: pointer; transition: transform 0.15s ease, border-color 0.2s ease; }
        .thumb:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.3); }
        .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0.85; }
        .thumb-active { outline: 2px solid var(--accent-real); outline-offset: -1px; }
        .thumb-overlay { position: absolute; top: 6px; left: 6px; }
        .thumb-tag { position: absolute; bottom: 6px; left: 6px; right: 6px; font-size: 10.5px; padding: 2px 6px; border-radius: 20px; background: rgba(10,15,26,0.75); backdrop-filter: blur(4px); text-align: center; }

        .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 2px 7px; border-radius: 20px; background: rgba(10,15,26,0.75); backdrop-filter: blur(4px); }
        .badge-processing { color: #fff; } .badge-done { color: var(--accent-real); } .badge-pending { color: var(--ink-muted); }
        .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
        .tag-ai { background: var(--accent-ai-soft); color: var(--accent-ai); }
        .tag-real { background: var(--accent-real-soft); color: var(--accent-real); }

        .verdict-card { padding: 22px 24px; opacity: 0; transform: scale(0.98) translateY(6px); transition: opacity 0.45s ease, transform 0.45s ease; }
        .verdict-card.reveal { opacity: 1; transform: scale(1) translateY(0); }
        .verdict-top { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .verdict-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tone-ai .verdict-icon { background: var(--accent-ai-soft); color: var(--accent-ai); }
        .tone-real .verdict-icon { background: var(--accent-real-soft); color: var(--accent-real); }
        .verdict-label { font-family: 'Fraunces', serif; font-size: 22px; margin: 0; font-weight: 500; }
        .verdict-sub { color: var(--ink-muted); font-size: 13px; margin: 2px 0 0; }
        .verdict-explanation { color: var(--ink); font-size: 14.5px; line-height: 1.65; max-width: 62ch; }

        .conf-track { height: 7px; border-radius: 20px; background: rgba(255,255,255,0.08); overflow: hidden; }
        .conf-fill { height: 100%; border-radius: 20px; transition: width 0.6s ease; }

        .panel { padding: 18px 20px; }
        .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; width: 100%; background: none; border: none; color: var(--ink); cursor: default; padding: 0; font-family: inherit; }
        .panel-head.collapsible { cursor: pointer; margin-bottom: 0; }
        .panel-head-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; }
        .panel-note { font-size: 12px; color: var(--ink-muted); line-height: 1.55; margin: 12px 0 0; }

        .seg { display: flex; gap: 2px; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 2px; }
        .seg button { font-size: 11.5px; padding: 5px 10px; border-radius: 8px; border: none; background: none; color: var(--ink-muted); cursor: pointer; font-family: inherit; transition: background 0.2s ease, color 0.2s ease; }
        .seg-active { background: rgba(255,255,255,0.14) !important; color: var(--ink) !important; }

        .heatmap-frame { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; }
        .heatmap-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .heatmap-layer { position: absolute; inset: 0; mix-blend-mode: screen; }
        .heatmap-side { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .heatmap-frame.small { aspect-ratio: 1; }
        .frame-label { position: absolute; bottom: 6px; left: 6px; font-size: 10px; background: rgba(10,15,26,0.75); padding: 2px 6px; border-radius: 20px; }
        .slider-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; color: var(--ink-muted); }
        .slider-row input[type="range"] { flex: 1; accent-color: var(--accent-ai); }
        .slider-label { font-size: 11.5px; white-space: nowrap; }

        .meta-body { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
        .meta-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); }
        .meta-label { color: var(--ink-muted); min-width: 108px; font-size: 12.5px; }
        .meta-value { font-weight: 500; }
        .meta-c2pa { display: flex; align-items: center; gap: 8px; font-size: 12.5px; padding: 8px 10px; border-radius: 10px; margin-top: 4px; }
        .meta-c2pa.tone-real { background: var(--accent-real-soft); color: var(--accent-real); }
        .meta-c2pa.tone-ai { background: var(--accent-ai-soft); color: var(--accent-ai); }
        .meta-c2pa.tone-muted { background: rgba(255,255,255,0.06); color: var(--ink-muted); }

        .robust-frame { border-radius: 12px; overflow: hidden; aspect-ratio: 16/7; margin-bottom: 14px; }
        .robust-frame img { width: 100%; height: 100%; object-fit: cover; display: block; transition: filter 0.3s ease; }
        .robust-scores { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .robust-scores > div { display: flex; flex-direction: column; gap: 6px; }
        .score-num { font-size: 12.5px; color: var(--ink-muted); }

        .history-list.wide { display: flex; flex-direction: column; gap: 10px; }
        .history-item.wide { display: flex; align-items: center; gap: 14px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px; padding: 10px 14px; cursor: pointer; text-align: left; transition: border-color 0.2s ease, background 0.2s ease; }
        .history-item.wide:hover { background: rgba(255,255,255,0.09); }
        .history-item.wide img { width: 48px; height: 48px; object-fit: cover; border-radius: 10px; }
        .history-meta { display: flex; flex-direction: column; gap: 4px; }
        .history-name { font-size: 13px; }
        .history-verdict { font-size: 11px; width: fit-content; padding: 2px 8px; border-radius: 20px; }
        .history-active { border-color: rgba(255,255,255,0.35); }

        .demo-loading { display: flex; flex-direction: column; gap: 12px; }
        .demo-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-muted); opacity: 0.4; transition: opacity 0.3s ease; }
        .demo-row.demo-active { opacity: 1; color: var(--ink); }

        @media (max-width: 640px) { .detail-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; } }
      `}</style>

      <div className="brand">
        <div className="brand-mark"><ScanEye size={16} color="#0a0f1a" /></div>
        <span className="brand-name">Verascope</span>
        <span className="brand-tag">— image authenticity, examined</span>
      </div>

      <div className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "tab-active" : ""}`} onClick={() => setTab(t.id)}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "upload" && <UploadPage onFiles={handleFiles} items={items} />}
      {tab === "batch" && <BatchPage items={items} onFiles={handleFiles} selectedId={selectedId} onSelect={setSelectedId} goToVerdict={goToVerdict} />}
      {tab === "verdict" && <VerdictPage {...pageProps} />}
      {tab === "heatmap" && <HeatmapPage {...pageProps} />}
      {tab === "explanation" && <ExplanationPage {...pageProps} />}
      {tab === "metadata" && <MetadataPage {...pageProps} />}
      {tab === "robustness" && <RobustnessPage {...pageProps} />}
      {tab === "history" && <HistoryPage items={items} selectedId={selectedId} onSelect={setSelectedId} goToVerdict={goToVerdict} />}
      {tab === "loading" && <LoadingPage items={items} />}
    </div>
  );
}
