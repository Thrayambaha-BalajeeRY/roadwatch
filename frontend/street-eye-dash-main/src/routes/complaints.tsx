import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClientOnly } from "@/components/ClientOnly";
import { RoadMap } from "@/components/RoadMap";
import type { Road } from "@/lib/roadwatch";
import { STATES, INDIA_LOCATIONS, type RWUser } from "@/lib/india-locations";

export const Route = createFileRoute("/complaints")({
  head: () => ({
    meta: [
      { title: "Complaints — RoadWatch Secure Portal" },
      { name: "description", content: "Cryptographically signed road complaints routed to the right officer." },
    ],
  }),
  component: Complaints,
});

function Complaints() {
  const [auth, setAuth] = useState<RWUser | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const raw = localStorage.getItem("rw_user");
    if (raw) {
      try { setAuth(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("rw_user");
    setAuth(null);
  };

  return (
    <div className="min-h-screen px-6 lg:px-10 py-10">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-4xl text-text">📋 File a Complaint</h1>
          <p className="text-text-dim mt-2">
            Cryptographically signed reports routed to the exact responsible government authority.
          </p>
        </div>

        {!auth ? (
          <AuthPanel mode={mode} setMode={setMode} onAuth={setAuth} />
        ) : (
          <ComplaintForm auth={auth} onLogout={logout} />
        )}
      </div>
    </div>
  );
}

function AuthPanel({ mode, setMode, onAuth }: { mode: "login" | "register"; setMode: (m: "login" | "register") => void; onAuth: (a: RWUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  const districts = state ? INDIA_LOCATIONS[state] ?? [] : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const missing =
      !email ||
      !password ||
      (mode === "register" && (!name || !state || !district));
    if (missing) {
      setError("Please fill every field.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const finalName = mode === "register" ? name : email.split("@")[0];
    const finalState = mode === "register" ? state : (localStorage.getItem("rw_last_state") || "Karnataka");
    const finalDistrict = mode === "register" ? district : (localStorage.getItem("rw_last_district") || "Bengaluru Urban");
    const user: RWUser = {
      name: finalName,
      email,
      state: finalState,
      district: finalDistrict,
      token: "demo." + btoa(email).slice(0, 24),
    };
    localStorage.setItem("rw_user", JSON.stringify(user));
    localStorage.setItem("rw_last_state", finalState);
    localStorage.setItem("rw_last_district", finalDistrict);
    onAuth(user);
  };

  const reqs = [
    { ok: password.length >= 8, label: "8+ chars" },
    { ok: /[A-Z]/.test(password), label: "Uppercase" },
    { ok: /[0-9]/.test(password), label: "Number" },
  ];

  return (
    <motion.div animate={shake ? { x: [0, -8, 8, -8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.4 }} className="surface-card p-8">
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {(["login", "register"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === m ? "text-black" : "text-text-dim hover:text-text"}`}
            style={mode === m ? { background: "var(--grad-btn)" } : {}}>
            {m === "login" ? "Login" : "Register"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        {mode === "register" && <UnderlineInput label="Full Name" value={name} onChange={setName} />}
        <UnderlineInput label="Email" value={email} onChange={setEmail} type="email" />
        <UnderlineInput label="Password" value={password} onChange={setPassword} type="password" />

        {mode === "register" && (
          <>
            <SelectField
              label="State"
              value={state}
              onChange={(v) => { setState(v); setDistrict(""); }}
              options={STATES}
              placeholder="Choose your state"
            />
            <SelectField
              label="District"
              value={district}
              onChange={setDistrict}
              options={districts}
              placeholder={state ? "Choose your district" : "Select state first"}
              disabled={!state}
            />

            <div className="flex gap-2 flex-wrap">
              {reqs.map((r) => (
                <motion.span key={r.label} animate={{ scale: r.ok ? [1, 1.1, 1] : 1 }}
                  className="font-mono text-[0.65rem] px-2.5 py-1 rounded-full"
                  style={{
                    color: r.ok ? "var(--green)" : "var(--text-ghost)",
                    background: r.ok ? "rgba(0,255,136,0.08)" : "var(--surface)",
                    border: `1px solid ${r.ok ? "var(--green)" : "var(--border)"}`,
                  }}>
                  {r.ok ? "✓" : "○"} {r.label}
                </motion.span>
              ))}
            </div>
          </>
        )}

        {error && <div className="font-mono text-xs text-red">{error}</div>}

        <button type="submit" className="w-full btn-primary py-3.5">
          {mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
        
      </form>
    </motion.div>
  );
}

function UnderlineInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [focus, setFocus] = useState(false);
  const float = focus || value.length > 0;
  return (
    <div className="relative pt-5">
      <label className="absolute left-0 font-sans transition-all pointer-events-none"
        style={{ top: float ? 0 : 28, fontSize: float ? "0.7rem" : "0.9rem", color: focus ? "var(--cyan)" : "var(--text-dim)" }}>
        {label}
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        className="w-full bg-transparent border-0 border-b py-2 outline-none text-text"
        style={{ borderBottomColor: focus ? "var(--cyan)" : "var(--border)", boxShadow: focus ? "0 1px 0 var(--cyan)" : "none" }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, disabled = false }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean }) {
  return (
    <div className="relative pt-5">
      <label className="absolute left-0 top-0 font-sans pointer-events-none" style={{ fontSize: "0.7rem", color: "var(--cyan)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-transparent border-0 border-b py-2 outline-none text-text appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        style={{ borderBottomColor: value ? "var(--cyan)" : "var(--border)" }}
      >
        <option value="" style={{ background: "var(--card)", color: "var(--text-dim)" }}>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "var(--card)", color: "var(--text)" }}>{o}</option>
        ))}
      </select>
    </div>
  );
}

interface Submitted { ref: string; lat: string; lon: string; road: string }

function ComplaintForm({ auth, onLogout }: { auth: RWUser; onLogout: () => void }) {
  const [road, setRoad] = useState("");
  const [defect, setDefect] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [gpsMsg, setGpsMsg] = useState("");
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [typed, setTyped] = useState("");

  const detectLocation = () => {
    if (!navigator.geolocation) { setGpsMsg("GPS unavailable in this browser"); return; }
    setGpsMsg("Detecting…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setGpsMsg(`Location detected: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
      },
      () => setGpsMsg("GPS unavailable — enter manually"),
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!road || !defect) return;
    const ref = "CMP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setSubmitted({ ref, lat: lat || "12.9716", lon: lon || "77.5946", road });
  };

  useEffect(() => {
    if (!submitted) return;
    setTyped("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(submitted.ref.slice(0, i));
      if (i >= submitted.ref.length) clearInterval(t);
    }, 65);
    return () => clearInterval(t);
  }, [submitted]);

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="surface-card p-8 text-center" style={{ boxShadow: "0 0 80px rgba(0,255,136,0.15)" }}>
        <div className="font-display font-extrabold text-green text-2xl mb-3">✅ REPORT SUBMITTED</div>
        <div className="font-mono text-text-dim text-xs mb-6 tracking-widest">REFERENCE NUMBER</div>
        <motion.div animate={{ textShadow: ["0 0 30px rgba(0,212,255,0.6)", "0 0 50px rgba(0,212,255,0.9)", "0 0 30px rgba(0,212,255,0.6)"] }}
          transition={{ duration: 2, repeat: Infinity }} className="font-mono font-extrabold text-cyan" style={{ fontSize: "2.5rem" }}>
          {typed}<span className="opacity-50">|</span>
        </motion.div>

        <div className="mt-8 surface-card p-4 text-left max-w-md mx-auto" style={{ background: "rgba(0,212,255,0.04)" }}>
          <div className="font-mono text-[0.65rem] text-cyan tracking-widest mb-2">📍 LOCATION RECORDED</div>
          <div className="font-mono text-cyan">Lat: {submitted.lat}° N | Lon: {submitted.lon}° E</div>
          <div className="text-text-dim text-sm mt-1">{submitted.road}</div>
        </div>

        <div className="mt-4 max-w-md mx-auto">
          <ClientOnly fallback={<div className="shimmer rounded-lg" style={{ height: 140 }} />}>
            <RoadMap
              roads={[{
                name: submitted.road, city: auth.district, state: auth.state, type: "—",
                score: 30, status: "Critical", contractor: "—", last_repaired: "—",
                sanctioned_cr: 0, spent_cr: 0, pothole_count: 1, accident_history_2yr: 0,
                defects: [defect], officer_name: "Assigned officer", office_phone: "—",
                coordinates: { lat: parseFloat(submitted.lat), lon: parseFloat(submitted.lon) },
              } as Road]}
              center={[parseFloat(submitted.lat), parseFloat(submitted.lon)]}
              zoom={13} height={140}
            />
          </ClientOnly>
        </div>

        <div className="mt-6 text-text-dim text-sm">
          Routed to: <span className="text-text">Officer for {auth.district}, {auth.state}</span>
        </div>
        <button onClick={() => { setSubmitted(null); setRoad(""); setDefect(""); setLat(""); setLon(""); setGpsMsg(""); }} className="mt-8 btn-ghost">
          File another report
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}>
        <div className="font-mono text-xs text-green">
          ✓ SIGNED IN AS {auth.name.toUpperCase()} · {auth.district}, {auth.state}
        </div>
        <button onClick={onLogout} className="text-text-dim text-xs hover:text-text">Sign out</button>
      </div>

      <form onSubmit={submit} className="surface-card p-6 space-y-6">
        <div>
          <label className="font-mono text-[0.7rem] text-text-dim tracking-widest">📍 COMPLAINT LOCATION (OPTIONAL)</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude"
              className="bg-[var(--surface)] border border-border rounded-lg px-3 py-2 text-sm font-mono text-cyan outline-none focus:border-cyan" />
            <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Longitude"
              className="bg-[var(--surface)] border border-border rounded-lg px-3 py-2 text-sm font-mono text-cyan outline-none focus:border-cyan" />
          </div>
          <button type="button" onClick={detectLocation} className="mt-2 btn-ghost py-2 px-4 text-sm">📡 Detect My Location</button>
          {gpsMsg && <div className="mt-2 font-mono text-xs text-text-dim">{gpsMsg}</div>}
        </div>

        <div>
          <label className="font-mono text-[0.7rem] text-text-dim tracking-widest">ROAD NAME</label>
          <input value={road} onChange={(e) => setRoad(e.target.value)} placeholder="e.g. MG Road, Bengaluru"
            className="mt-2 w-full bg-[var(--surface)] border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-cyan" />
        </div>

        <div>
          <label className="font-mono text-[0.7rem] text-text-dim tracking-widest">DEFECT DESCRIPTION</label>
          <textarea value={defect} onChange={(e) => setDefect(e.target.value)} rows={4}
            placeholder="Describe the road defect, hazard or issue…"
            className="mt-2 w-full bg-[var(--surface)] border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-cyan resize-none" />
        </div>

        <div>
          <label className="font-mono text-[0.7rem] text-text-dim tracking-widest">SEVERITY</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {([
              { k: "low", l: "Low", c: "var(--yellow)" },
              { k: "medium", l: "Medium", c: "var(--orange)" },
              { k: "high", l: "Critical", c: "var(--red)" },
            ] as const).map((s) => (
              <button key={s.k} type="button" onClick={() => setSeverity(s.k)}
                className="rounded-lg p-3 text-sm transition-all"
                style={{
                  background: severity === s.k ? `${s.c}15` : "var(--surface)",
                  border: `1px solid ${severity === s.k ? s.c : "var(--border)"}`,
                  color: severity === s.k ? s.c : "var(--text-dim)",
                }}>
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full btn-primary py-3.5 tracking-widest">SUBMIT REPORT</button>
      </form>
    </div>
  );
}

export { Complaints };
