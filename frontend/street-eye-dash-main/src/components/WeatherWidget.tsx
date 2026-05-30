import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getWeatherForPlace, type Weather } from "@/lib/weather";

export function WeatherWidget({ district, state }: { district: string; state: string }) {
  const [w, setW] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const place = `${district}, ${state}`;
      const res = (await getWeatherForPlace(place)) ?? (await getWeatherForPlace(district));
      if (alive) {
        setW(res);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [district, state]);

  return (
    <div
      className="surface-card p-5 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(176,96,255,0.04))",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-bold text-text">🌦 Live Weather</div>
        <span className="font-mono text-[0.65rem] text-text-ghost tracking-widest">
          {district.toUpperCase()}, {state.toUpperCase()}
        </span>
      </div>

      {loading || !w ? (
        <div className="shimmer h-20 rounded" />
      ) : (
        <div className="flex items-center gap-5">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 56, lineHeight: 1 }}
          >
            {w.emoji}
          </motion.div>
          <div>
            <div className="font-display font-extrabold text-4xl text-cyan">
              {Math.round(w.tempC)}°C
            </div>
            <div className="text-text text-sm">{w.label}</div>
            <div className="font-mono text-[0.65rem] text-text-dim mt-1">
              💨 {Math.round(w.windKph)} km/h · 💧 {w.precipMm.toFixed(1)} mm
            </div>
          </div>
          {w.isRaining && (
            <div
              className="ml-auto font-mono text-[0.65rem] px-2 py-1 rounded text-cyan"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid var(--cyan)" }}
            >
              ⚠ RAIN — POTHOLE RISK ↑
            </div>
          )}
        </div>
      )}
    </div>
  );
}
