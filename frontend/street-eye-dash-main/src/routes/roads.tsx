import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientOnly } from "@/components/ClientOnly";
import { RoadMap } from "@/components/RoadMap";
import { api, scoreColor, scoreLabel, type Road } from "@/lib/roadwatch";

export const Route = createFileRoute("/roads")({
  head: () => ({
    meta: [
      { title: "Roads — RoadWatch Intelligence" },
      { name: "description", content: "GPS-mapped road intelligence for India's cities." },
    ],
  }),
  component: Roads,
});

type Tab = "all" | "budget";
type View = "grid" | "map" | "table";

function Roads() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [budget, setBudget] = useState<Road[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<View>("grid");
  const [fly, setFly] = useState<[number, number] | null>(null);

  useEffect(() => {
    (async () => {
      const [r, b] = await Promise.all([api.roads(), api.budgetIssues()]);
      setRoads(r);
      setBudget(b);
    })();
  }, []);

  const data = useMemo(() => (tab === "all" ? roads : budget), [tab, roads, budget]);

  return (
    <div className="min-h-screen px-6 lg:px-10 py-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          
          <h1 className="font-display font-extrabold text-4xl text-text">🛣 Road Intelligence</h1>
          <p className="text-text-dim mt-2">GPS-mapped infrastructure data for {roads.length} Indian roads.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { k: "all", l: `All Roads (${roads.length})` },
              { k: "budget", l: `Budget Issues (${budget.length})` },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as Tab)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all font-medium ${
                  tab === t.k ? "text-black" : "text-text-dim hover:text-text"
                }`}
                style={tab === t.k ? { background: "var(--grad-btn)" } : {}}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { k: "grid", l: "⊞ Grid" },
              { k: "map", l: "🗺 Map" },
              { k: "table", l: "≡ Table" },
            ].map((v) => (
              <button
                key={v.k}
                onClick={() => setView(v.k as View)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  view === v.k ? "text-cyan bg-[rgba(0,212,255,0.08)]" : "text-text-dim hover:text-text"
                }`}
              >
                {v.l}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "grid" && (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="surface-card p-5 relative overflow-hidden"
                  style={{ borderTop: `2px solid ${scoreColor(r.score)}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display font-bold text-text">{r.name}</div>
                      <div className="text-text-dim text-xs">
                        {r.city}, {r.state}
                      </div>
                    </div>
                    <span className="font-mono text-[0.6rem] px-2 py-0.5 rounded uppercase tracking-wider" style={{ color: scoreColor(r.score), border: `1px solid ${scoreColor(r.score)}` }}>
                      {scoreLabel(r.score)}
                    </span>
                  </div>

                  <div className="flex items-end gap-1 mb-3">
                    <div className="font-display font-extrabold text-3xl" style={{ color: scoreColor(r.score) }}>
                      {r.score}
                    </div>
                    <div className="text-text-ghost text-sm font-mono mb-1">/100</div>
                  </div>

                  <div className="h-1 rounded-full mb-4" style={{ background: "var(--elevated)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: scoreColor(r.score) }} />
                  </div>

                  <div className="font-mono text-[0.65rem] text-text-dim space-y-1">
                    <div>📍 <span className="text-cyan">{r.coordinates.lat.toFixed(4)}° N, {r.coordinates.lon.toFixed(4)}° E</span></div>
                    <div>🕳 {r.pothole_count} potholes · {r.accident_history_2yr} accidents (2yr)</div>
                    <div>💰 ₹{r.spent_cr}Cr / ₹{r.sanctioned_cr}Cr ({Math.round((r.spent_cr / r.sanctioned_cr) * 100)}%)</div>
                    <div className="truncate">👤 {r.officer_name}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {view === "map" && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-[1fr_280px] gap-4">
              <ClientOnly fallback={<div className="shimmer rounded-2xl" style={{ height: 600 }} />}>
                <RoadMap roads={data} center={[22, 78]} zoom={5} height={600} flyTo={fly} />
              </ClientOnly>
              <div className="surface-card p-3 max-h-[600px] overflow-y-auto">
                <div className="font-mono text-xs text-text-ghost p-2 tracking-wider">CLICK TO FLY TO</div>
                {data.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setFly([r.coordinates.lat, r.coordinates.lon])}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-[var(--elevated)] transition-colors flex items-center gap-3"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: scoreColor(r.score) }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-text text-sm truncate">{r.name}</div>
                      <div className="text-text-ghost text-[0.65rem] font-mono">
                        {r.coordinates.lat.toFixed(3)}°, {r.coordinates.lon.toFixed(3)}°
                      </div>
                    </div>
                    <span className="font-mono text-xs" style={{ color: scoreColor(r.score) }}>
                      {r.score}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === "table" && (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-ghost text-xs font-mono uppercase tracking-wider">
                    {["Road", "City", "Score", "Status", "GPS", "Budget", "Last Repaired"].map((h) => (
                      <th key={h} className="px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.name} className="hover:bg-[var(--elevated)] transition-colors">
                      <td className="px-4 py-3 text-text">{r.name}</td>
                      <td className="px-4 py-3 text-text-dim">{r.city}</td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: scoreColor(r.score) }}>{r.score}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: scoreColor(r.score) }}>{scoreLabel(r.score)}</td>
                      <td className="px-4 py-3 font-mono text-cyan text-xs">
                        <a
                          href={`https://maps.google.com/?q=${r.coordinates.lat},${r.coordinates.lon}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {r.coordinates.lat.toFixed(2)}°N {r.coordinates.lon.toFixed(2)}°E
                        </a>
                      </td>
                      <td className="px-4 py-3 text-text-dim text-xs">
                        ₹{r.spent_cr}/{r.sanctioned_cr}Cr
                      </td>
                      <td className="px-4 py-3 text-text-dim text-xs font-mono">{r.last_repaired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
