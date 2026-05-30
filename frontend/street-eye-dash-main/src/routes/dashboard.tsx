import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ClientOnly } from "@/components/ClientOnly";
import { RoadMap } from "@/components/RoadMap";
import { WeatherWidget } from "@/components/WeatherWidget";
import { PotholeStatus } from "@/components/PotholeStatus";
import { api, scoreColor, scoreLabel, type Road } from "@/lib/roadwatch";
import type { RWUser } from "@/lib/india-locations";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RoadWatch Command Center" },
      { name: "description", content: "Real-time AI dashboard for India's road infrastructure." },
    ],
  }),
  component: Dashboard,
});

const spark = (seed: number) =>
  Array.from({ length: 14 }, (_, i) => ({ v: 50 + Math.sin((i + seed) * 0.7) * 15 + (i % 3) * 4 }));

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [worst, setWorst] = useState<Road[]>([]);
  const [budget, setBudget] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RWUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rw_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    (async () => {
      const [r, w, b] = await Promise.all([api.roads(), api.worst(), api.budgetIssues()]);
      setRoads(r); setWorst(w); setBudget(b); setLoading(false);
    })();
  }, []);

  const critical = roads.filter((r) => r.score < 40).length;
  const detections = roads.reduce((s, r) => s + r.pothole_count, 0);

  const metrics = [
    { label: "Roads Monitored", value: roads.length, color: "var(--cyan)", sub: "Across 5 major cities" },
    { label: "Critical Roads", value: critical, color: "var(--red)", sub: "Score below 40", pulse: true },
    { label: "Budget Alerts", value: budget.length, color: "var(--yellow)", sub: "Funds vs progress flag" },
    { label: "Defects Detected", value: detections, color: "var(--green)", sub: "Lifetime detections" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--deep)" }}>
      <DashSidebar />

      <div className="flex-1 min-w-0 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="font-display text-2xl font-bold text-text">
              {greeting()}, <span className="text-gradient-cyan">{user?.name ?? "RoadWatch"}</span>
            </div>
            <div className="text-text-dim text-sm font-mono mt-1">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {user && ` · ${user.district}, ${user.state}`}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs text-green" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)" }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green" />
            LIVE DATA
          </div>
        </div>

        {/* Weather (only if user registered) */}
        {user ? (
          <div className="mb-6">
            <WeatherWidget district={user.district} state={user.state} />
          </div>
        ) : (
          <div className="mb-6 surface-card p-4 text-sm text-text-dim flex items-center justify-between flex-wrap gap-3">
            <span>🌦 Register on the Complaints page to see your local weather here.</span>
            <Link to="/complaints" className="text-cyan hover:underline">Register →</Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
              className="surface-card p-5 relative overflow-hidden"
              style={{ borderTop: `2px solid ${m.color}`, background: "linear-gradient(180deg, var(--card), var(--surface))" }}>
              {m.pulse && <motion.span animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.2, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red" />}
              <div className="font-display font-extrabold text-4xl" style={{ color: m.color }}>
                {loading ? "—" : <CountUp end={m.value} duration={1.5} />}
              </div>
              <div className="font-sans text-text text-sm mt-2">{m.label}</div>
              <div className="font-mono text-[0.65rem] text-text-ghost mt-1">{m.sub}</div>
              <div className="h-10 mt-3 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spark(i)}>
                    <Line type="monotone" dataKey="v" stroke={m.color} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.8fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="surface-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display font-bold text-text">📍 Live Infrastructure Map</div>
                  <div className="text-text-dim text-xs font-mono">GPS-accurate · rain-aware severity</div>
                </div>
                <span className="font-mono text-xs text-cyan">{roads.length} markers</span>
              </div>
              <ClientOnly fallback={<div className="shimmer rounded-2xl" style={{ height: 400 }} />}>
                <RoadMap roads={roads} center={[22, 78]} zoom={5} height={400} rainControls />
              </ClientOnly>
            </div>

            {/* Rankings + Pothole status side-by-side */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="surface-card p-5">
                <div className="font-display font-bold text-text mb-4">⚠ Dangerous Road Rankings</div>
                <div className="space-y-2">
                  {(loading ? Array(5).fill(null) : worst).map((r: Road | null, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors hover:bg-[var(--elevated)]">
                      <div className="font-mono text-text-ghost text-sm w-6">#{i + 1}</div>
                      {r ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-sans text-text truncate text-sm">{r.name}</div>
                            <div className="text-xs text-text-dim truncate">{r.city}</div>
                          </div>
                          <div className="font-mono text-sm w-10 text-right" style={{ color: scoreColor(r.score) }}>
                            <CountUp end={r.score} duration={1.2} />
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 shimmer h-5 rounded" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <PotholeStatus />
            </div>
          </div>

          <div className="space-y-6">
            <div className="surface-card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px">
                <motion.div animate={{ y: [0, 220, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, var(--cyan), transparent)", boxShadow: "0 0 12px var(--cyan)" }} />
              </div>
              <div className="font-display font-bold text-text mb-3">📡 Latest Detection</div>
              {roads[0] ? (
                <>
                  <div className="font-mono font-extrabold text-2xl text-cyan leading-tight">
                    {roads[0].coordinates.lat.toFixed(4)}° N<br />{roads[0].coordinates.lon.toFixed(4)}° E
                  </div>
                  <div className="text-text mt-2">{roads[0].name}</div>
                  <div className="text-text-dim text-xs">{roads[0].city}, {roads[0].state}</div>
                  <div className="mt-3 inline-block font-mono text-[0.65rem] px-2 py-0.5 rounded" style={{ color: scoreColor(roads[0].score), border: `1px solid ${scoreColor(roads[0].score)}` }}>
                    {scoreLabel(roads[0].score)}
                  </div>
                </>
              ) : (
                <div className="shimmer h-20 rounded" />
              )}
            </div>

            <div className="surface-card p-5">
              <div className="font-display font-bold text-text mb-4">💸 Budget Flags</div>
              <div className="space-y-2.5">
                {budget.slice(0, 6).map((r) => {
                  const pct = Math.round((r.spent_cr / r.sanctioned_cr) * 100);
                  return (
                    <div key={r.name} className="flex items-center justify-between gap-2 text-sm">
                      <div className="truncate">
                        <div className="text-text truncate">{r.name}</div>
                        <div className="text-text-ghost text-xs">{r.city}</div>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded text-yellow" style={{ background: "rgba(255,214,0,0.08)", border: "1px solid rgba(255,214,0,0.25)" }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
                {budget.length === 0 && <div className="text-text-dim text-sm">No flags.</div>}
              </div>
            </div>

            <Link to="/chat" className="block surface-card p-5 hover:border-cyan transition-colors">
              <div className="font-display font-bold text-text mb-1">💬 Ask RoadWatch AI</div>
              <div className="text-text-dim text-xs mb-3">LLaMA 3.3 — instant road intelligence</div>
              <span className="text-cyan text-sm">Open full chat →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashSidebar() {
  const items = [
    { icon: "🏠", label: "Overview", to: "/dashboard" },
    { icon: "💬", label: "AI Chat", to: "/chat" },
    { icon: "🛣", label: "Roads", to: "/roads" },
    { icon: "🔍", label: "Detect", to: "/detect" },
    { icon: "📋", label: "Complaints", to: "/complaints" },
  ] as const;

  return (
    <aside className="hidden lg:flex sticky top-16 self-start flex-col w-[220px] h-[calc(100vh-4rem)] p-5" style={{ background: "var(--surface)", borderRight: "1px solid var(--border-lg)" }}>
      <div className="font-display font-extrabold text-cyan text-glow-cyan mb-8">⬡ RW</div>
      <nav className="space-y-1 flex-1">
        {items.map((it) => (
          <Link key={it.to} to={it.to}
            activeProps={{ className: "bg-[rgba(0,212,255,0.08)] text-cyan border-l-2 border-cyan" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-text-dim text-sm transition-colors hover:bg-[var(--elevated)] hover:text-text">
            <span>{it.icon}</span><span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="text-xs space-y-1.5 font-mono text-text-dim">
        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green" /> AI Engine</div>
        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green" /> Database</div>
        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan" /> Detection</div>
      </div>
    </aside>
  );
}
