import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PotholeRecord {
  id: string;
  road: string;
  city: string;
  reportedAt: string;
  status: "Reported" | "In Progress" | "Fixed";
}

const MOCK: PotholeRecord[] = [
  { id: "CMP-9F2A1B", road: "MG Road", city: "Bengaluru", reportedAt: "2026-05-12", status: "In Progress" },
  { id: "CMP-7C81D0", road: "Outer Ring Road", city: "Bengaluru", reportedAt: "2026-05-18", status: "Reported" },
  { id: "CMP-22ABE4", road: "NH-44", city: "New Delhi", reportedAt: "2026-04-30", status: "Fixed" },
  { id: "CMP-44ZQ09", road: "Park Street", city: "Kolkata", reportedAt: "2026-05-22", status: "Reported" },
  { id: "CMP-91KLO2", road: "Hosur Road", city: "Bengaluru", reportedAt: "2026-05-25", status: "In Progress" },
  { id: "CMP-12MNB7", road: "Anna Salai", city: "Chennai", reportedAt: "2026-05-20", status: "Reported" },
  { id: "CMP-55QRT8", road: "Western Express Hwy", city: "Mumbai", reportedAt: "2026-05-15", status: "Fixed" },
];

const statusColor = (s: PotholeRecord["status"]) =>
  s === "Fixed" ? "var(--green)" : s === "In Progress" ? "var(--yellow)" : "var(--red)";

export function PotholeStatus() {
  const [open, setOpen] = useState(false);
  const recent = MOCK.slice(0, 4);

  const counts = {
    fixed: MOCK.filter((m) => m.status === "Fixed").length,
    progress: MOCK.filter((m) => m.status === "In Progress").length,
    reported: MOCK.filter((m) => m.status === "Reported").length,
  };

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-bold text-text">🛠 Pothole Repair Status</div>
          <div className="text-text-dim text-xs font-mono">Live updates from officials</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat n={counts.reported} l="Reported" c="var(--red)" />
        <Stat n={counts.progress} l="In Progress" c="var(--yellow)" />
        <Stat n={counts.fixed} l="Fixed" c="var(--green)" />
      </div>

      <div className="space-y-2 flex-1">
        {recent.map((p) => (
          <Row key={p.id} p={p} />
        ))}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="mt-3 btn-ghost py-2 text-sm w-full"
      >
        View all {MOCK.length} potholes →
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="surface-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="font-display font-bold text-text text-lg">All Pothole Reports</div>
                <button onClick={() => setOpen(false)} className="text-text-dim hover:text-text text-2xl">×</button>
              </div>
              <div className="space-y-2">
                {MOCK.map((p) => (
                  <Row key={p.id} p={p} expanded />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ n, l, c }: { n: number; l: string; c: string }) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{ background: "var(--surface)", border: `1px solid ${c}40` }}
    >
      <div className="font-display font-extrabold text-xl" style={{ color: c }}>{n}</div>
      <div className="font-mono text-[0.6rem] text-text-dim mt-0.5">{l}</div>
    </div>
  );
}

function Row({ p, expanded = false }: { p: PotholeRecord; expanded?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm" style={{ background: "var(--surface)" }}>
      <div className="font-mono text-[0.65rem] text-text-ghost w-20 truncate">{p.id}</div>
      <div className="flex-1 min-w-0">
        <div className="text-text truncate text-xs">{p.road}</div>
        {expanded && <div className="text-text-ghost text-[0.65rem]">{p.city} · {p.reportedAt}</div>}
      </div>
      <span
        className="font-mono text-[0.6rem] px-2 py-0.5 rounded"
        style={{
          color: statusColor(p.status),
          background: `${statusColor(p.status)}15`,
          border: `1px solid ${statusColor(p.status)}50`,
        }}
      >
        {p.status.toUpperCase()}
      </span>
    </div>
  );
}
