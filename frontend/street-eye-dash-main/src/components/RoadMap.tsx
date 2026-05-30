import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import type { Road } from "@/lib/roadwatch";
import { scoreColor, scoreLabel } from "@/lib/roadwatch";
import { getWeather, type Weather } from "@/lib/weather";

const makeIcon = (color: string, size = 14) =>
  L.divIcon({
    className: "",
    html: `<div class="pulse-dot" style="background:${color};color:${color};width:${size}px;height:${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 14, { duration: 1.2 });
  }, [target, map]);
  return null;
}

export interface RoadMapProps {
  roads: Road[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  flyTo?: [number, number] | null;
  /** Enables the "Simulate Rain" button overlay + live weather + amplified severity */
  rainControls?: boolean;
}

function adjustedScore(score: number, rainBoost: boolean) {
  if (!rainBoost) return score;
  // Rain degrades effective road safety
  return Math.max(0, Math.round(score * 0.65));
}

function pickColor(score: number) {
  return score < 40 ? "#ff3b5c" : score < 55 ? "#ff7c2a" : score < 75 ? "#ffd600" : "#00ff88";
}

export function RoadMap({
  roads,
  center = [22.5, 78.5],
  zoom = 5,
  height = 400,
  flyTo = null,
  rainControls = false,
}: RoadMapProps) {
  const [simRain, setSimRain] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    if (!rainControls) return;
    let alive = true;
    setLoadingWeather(true);
    getWeather(center[0], center[1], "Map area").then((w) => {
      if (alive) {
        setWeather(w);
        setLoadingWeather(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [rainControls, center[0], center[1]]);

  const realRain = !!weather?.isRaining;
  const rainBoost = simRain || realRain;

  return (
    <div className="relative" style={{ height, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 0 60px rgba(0,212,255,0.08)" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FlyTo target={flyTo} />
        {roads.map((r) => {
          const eff = adjustedScore(r.score, rainBoost);
          const color = pickColor(eff);
          return (
            <Marker
              key={r.name}
              position={[r.coordinates.lat, r.coordinates.lon]}
              icon={makeIcon(color, eff < 55 ? 18 : 12)}
            >
              <Popup>
                <div style={{ minWidth: 220, fontFamily: "var(--font-sans)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{r.name}</div>
                  <div style={{ color: "var(--text-dim)", fontSize: 11, marginBottom: 8 }}>{r.city}, {r.state}</div>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>
                    📍 GPS
                    <div style={{ color: "var(--cyan)" }}>
                      {r.coordinates.lat.toFixed(4)}° N<br />
                      {r.coordinates.lon.toFixed(4)}° E
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11 }}>
                    <span style={{ color: scoreColor(eff), fontWeight: 700, fontFamily: "var(--font-mono)" }}>{eff}/100</span>{" "}
                    · <span style={{ color: scoreColor(eff) }}>{scoreLabel(eff)}</span>
                    {rainBoost && r.score !== eff && (
                      <span style={{ color: "var(--cyan)", marginLeft: 6 }}>(rain-adjusted from {r.score})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                    Potholes: {r.pothole_count} · Officer: {r.officer_name}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {rainControls && (
        <>
          {/* Rain overlay */}
          {rainBoost && (
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,80,160,0.18), rgba(0,40,80,0.05))" }} />
          )}

          {/* Weather + sim controls */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 max-w-[260px]">
            <div className="font-mono text-[0.65rem] px-3 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.75)", border: "1px solid var(--border)", color: "var(--text)" }}>
              {loadingWeather ? (
                <span className="text-text-dim">⏳ fetching live weather…</span>
              ) : weather ? (
                <>
                  <div className="text-cyan tracking-widest mb-0.5">LIVE WEATHER · {weather.city.toUpperCase()}</div>
                  <div>{weather.emoji} {weather.label} · {Math.round(weather.tempC)}°C · {weather.precipMm.toFixed(1)}mm</div>
                  {realRain && (
                    <div className="text-red mt-1">⚠ Real rain detected — severity boosted live.</div>
                  )}
                </>
              ) : (
                <span className="text-text-dim">weather unavailable</span>
              )}
            </div>
            <button
              onClick={() => setSimRain((v) => !v)}
              className="font-mono text-[0.7rem] px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                background: simRain ? "var(--cyan)" : "rgba(0,0,0,0.75)",
                color: simRain ? "#000" : "var(--cyan)",
                border: "1px solid var(--cyan)",
              }}
            >
              {simRain ? "☔ RAIN SIM: ON — click to stop" : "🌧 Simulate Rain (boost severity)"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
