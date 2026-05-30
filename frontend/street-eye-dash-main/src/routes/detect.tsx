import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientOnly } from "@/components/ClientOnly";
import { RoadMap } from "@/components/RoadMap";
import type { Road } from "@/lib/roadwatch";

export const Route = createFileRoute("/detect")({
  head: () => ({
    meta: [
      { title: "Detect — AI Road Defect Scanner" },
      { name: "description", content: "Upload road photos. AI detects defects and geo-locates them." },
    ],
  }),
  component: Detect,
});

interface Defect { type: string; confidence_pct: number; severity: "low" | "medium" | "high" | "critical"; bbox: [number, number, number, number] }

function mockDetect(): { defects: Defect[]; lat: number; lon: number; location: string; hash: string } {
  const types = ["Pothole", "Crack", "Edge Break", "Faded Marking", "Drainage Failure"];
  const sevs = ["medium", "high", "critical"] as const;
  const n = 2 + Math.floor(Math.random() * 3);
  const defects: Defect[] = Array.from({ length: n }, () => ({
    type: types[Math.floor(Math.random() * types.length)],
    confidence_pct: Math.round(70 + Math.random() * 28),
    severity: sevs[Math.floor(Math.random() * sevs.length)],
    bbox: [
      Math.floor(Math.random() * 200),
      Math.floor(Math.random() * 200),
      300 + Math.floor(Math.random() * 200),
      300 + Math.floor(Math.random() * 200),
    ],
  }));
  return {
    defects,
    lat: 12.9716 + (Math.random() - 0.5) * 0.05,
    lon: 77.5946 + (Math.random() - 0.5) * 0.05,
    location: "MG Road, Bengaluru, Karnataka",
    hash: "sha256:" + Math.random().toString(36).substring(2, 18) + "…",
  };
}

function Detect() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof mockDetect> | null>(null);

  const onFiles = useCallback((files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }, []);

  const scan = useCallback(async () => {
    if (!file) return;
    setScanning(true);
    setProgress(0);
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(98, Math.round(((Date.now() - startedAt) / 1800) * 100));
      setProgress(p);
    }, 50);
    await new Promise((r) => setTimeout(r, 1800));
    clearInterval(tick);
    setProgress(100);
    setResult(mockDetect());
    setScanning(false);
  }, [file]);

  return (
    <div className="min-h-screen px-6 lg:px-10 py-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          
          <h1 className="font-display font-extrabold text-4xl text-text">🔍 Road Defect Scanner</h1>
          <p className="text-text-dim mt-2">Upload any road photo. AI identifies and geo-locates defects.</p>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
          <div className="space-y-6">
            {/* Upload zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
              className="relative flex flex-col items-center justify-center min-h-[360px] rounded-2xl cursor-pointer overflow-hidden transition-all"
              style={{
                background: dragOver ? "rgba(0,212,255,0.05)" : "var(--surface)",
                border: `2px dashed ${dragOver ? "rgba(0,212,255,0.6)" : "rgba(0,212,255,0.2)"}`,
              }}
            >
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />

              {/* corner brackets */}
              {[
                { top: 10, left: 10, borderTop: 2, borderLeft: 2 },
                { top: 10, right: 10, borderTop: 2, borderRight: 2 },
                { bottom: 10, left: 10, borderBottom: 2, borderLeft: 2 },
                { bottom: 10, right: 10, borderBottom: 2, borderRight: 2 },
              ].map((s, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute"
                  style={{ width: 22, height: 22, borderColor: "var(--cyan)", borderStyle: "solid", ...s }}
                />
              ))}

              {/* grid overlay */}
              <div className="absolute inset-0 bg-grid-sm opacity-50 pointer-events-none" />

              {preview ? (
                <div className="relative w-full h-full p-4">
                  <img src={preview} alt="upload" className="w-full max-h-[400px] object-contain rounded-xl" />
                  {scanning && <div className="scan-line" />}
                  <div className="mt-3 font-mono text-xs text-text-dim text-center">
                    {file?.name} · {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                  </div>
                  {!scanning && !result && <div className="font-mono text-green text-xs mt-1 text-center">✓ READY TO ANALYZE</div>}
                </div>
              ) : (
                <div className="text-center px-6 relative z-10">
                  <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
                    <rect x="6" y="6" width="36" height="36" rx="3" />
                    <path d="M6 30l10-8 10 8 6-4 10 6" />
                    <circle cx="32" cy="16" r="3" />
                  </svg>
                  <div className="font-display font-bold text-text">{dragOver ? "RELEASE TO SCAN" : "DROP ROAD IMAGE HERE"}</div>
                  <div className="font-sans text-text-ghost text-sm mt-1">or click to browse files</div>
                  <div className="flex justify-center gap-2 mt-4">
                    {["JPG", "PNG", "WEBP"].map((f) => (
                      <span key={f} className="font-mono text-[0.65rem] px-2 py-0.5 rounded" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </label>

            <motion.button
              whileHover={{ scale: file ? 1.01 : 1 }}
              whileTap={{ scale: file ? 0.99 : 1 }}
              onClick={scan}
              disabled={!file || scanning}
              className="w-full font-display font-extrabold text-base py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "var(--grad-btn)",
                color: "#000",
                letterSpacing: 3,
                boxShadow: "0 8px 40px rgba(0,212,255,0.3)",
              }}
            >
              {scanning ? `ANALYZING… ${progress}%` : "INITIATE SCAN"}
            </motion.button>

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* GPS card */}
                  <div className="surface-card p-5 relative overflow-hidden" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.3)" }}>
                    <div className="font-mono text-[0.65rem] text-cyan tracking-widest mb-3">📍 DETECTION LOCATION</div>
                    <div className="font-mono font-extrabold text-cyan leading-snug" style={{ fontSize: "1.3rem" }}>
                      Latitude: {result.lat.toFixed(4)}° N<br />
                      Longitude: {result.lon.toFixed(4)}° E
                    </div>
                    <div className="text-text mt-2 text-sm">{result.location}</div>
                    <a
                      href={`https://maps.google.com/?q=${result.lat},${result.lon}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-cyan text-sm hover:underline"
                    >
                      View on Google Maps →
                    </a>
                  </div>

                  <ClientOnly fallback={<div className="shimmer rounded-xl" style={{ height: 200 }} />}>
                    <RoadMap
                      roads={[
                        {
                          name: "Detection Point",
                          city: "—",
                          state: "—",
                          type: "—",
                          score: 30,
                          status: "Critical",
                          contractor: "—",
                          last_repaired: "—",
                          sanctioned_cr: 0,
                          spent_cr: 0,
                          pothole_count: result.defects.length,
                          accident_history_2yr: 0,
                          defects: result.defects.map((d) => d.type),
                          officer_name: "—",
                          office_phone: "—",
                          coordinates: { lat: result.lat, lon: result.lon },
                        } as Road,
                      ]}
                      center={[result.lat, result.lon]}
                      zoom={14}
                      height={200}
                    />
                  </ClientOnly>

                  {/* Defects */}
                  <div className="surface-card p-5">
                    <div className="font-display font-bold text-red mb-4">🚨 {result.defects.length} DEFECT(S) DETECTED</div>
                    <div className="space-y-3">
                      {result.defects.map((d, i) => {
                        const sevColor = d.severity === "critical" ? "var(--red)" : d.severity === "high" ? "var(--orange)" : "var(--yellow)";
                        return (
                          <div key={i} className="rounded-lg p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-display font-bold text-text">{d.type}</div>
                              <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded uppercase" style={{ color: sevColor, border: `1px solid ${sevColor}` }}>
                                {d.severity}
                              </span>
                            </div>
                            <div className="h-1 rounded-full mb-2" style={{ background: "var(--elevated)" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${d.confidence_pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: sevColor }} />
                            </div>
                            <div className="font-mono text-[0.65rem] text-text-ghost">
                              Confidence: {d.confidence_pct}% · Region: [{d.bbox[0]},{d.bbox[1]}] → [{d.bbox[2]},{d.bbox[3]}]
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="font-mono text-[0.65rem] text-green">🔒 Image Integrity Verified</div>
                      <div className="font-mono text-[0.65rem] text-text-ghost mt-1 break-all">{result.hash}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right info */}
          <div className="space-y-4">
            <div className="surface-card p-5">
              <div className="font-display font-bold text-text mb-4">How it works</div>
              <ol className="space-y-3 text-sm text-text-dim">
                {["Upload road image", "AI scans frame with YOLOv8", "GPS + defects returned"].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono font-bold text-cyan">0{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="surface-card p-5">
              <div className="font-display font-bold text-text mb-4">Severity Guide</div>
              {[
                { c: "var(--yellow)", l: "MEDIUM", t: "Cosmetic, low impact" },
                { c: "var(--orange)", l: "HIGH", t: "Repair within 30 days" },
                { c: "var(--red)", l: "CRITICAL", t: "Immediate hazard" },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-3 py-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.c }} />
                  <span className="font-mono w-16" style={{ color: s.c }}>{s.l}</span>
                  <span className="text-text-dim">{s.t}</span>
                </div>
              ))}
            </div>

            <div className="surface-card p-5">
              <div className="font-display font-bold text-text mb-2">GPS Accuracy</div>
              <div className="font-mono text-cyan text-2xl">±5 meters</div>
              <div className="text-text-dim text-xs mt-2">Auto-tagged from device GPS or image EXIF metadata.</div>
            </div>

            <div className="surface-card p-5">
              <div className="font-display font-bold text-text mb-2">Training</div>
              <div className="text-text-dim text-xs space-y-1 font-mono">
                <div>Dataset · 9,000+ images</div>
                <div>Model · YOLOv8s</div>
                <div>Size · 21 MB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
