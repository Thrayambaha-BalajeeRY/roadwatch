// RoadWatch Mini Driving Game — top-down canvas drive-sim that teaches the 7 rules.
// Works on PC (Arrow keys / WASD) and mobile (touch buttons).
// Implements all 7 scoring rules. Real "1 hour" cycles are compressed to 90-second
// game cycles for playability; the cycle counter is shown in the HUD.
import { useEffect, useRef, useState } from "react";

type Vec = { x: number; y: number };

interface NPCVehicle {
  pos: Vec; vel: Vec; color: string; w: number; h: number; type: string;
}
interface Pothole { pos: Vec; r: number; warned: boolean; passed: boolean; }
interface Pedestrian { pos: Vec; vy: number; alive: boolean; }
interface TrafficLight { pos: Vec; phase: "red" | "yellow" | "green"; t: number; }
interface Turn { pos: Vec; dir: "left" | "right"; used: boolean; }

const RULES = [
  "Speed limit 80–100 km/h",
  "Seat-belt locked",
  "Obey traffic signals",
  "Stop for pedestrians",
  "No overtaking",
  "Safe following distance",
  "Use turn indicators",
] as const;

const CYCLE_MS = 90_000; // 1 in-game "hour" compressed to 90s

export function DrivingGame({ height = 560 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mutable game state in refs so the loop is fast & React state for HUD.
  const stateRef = useRef({
    car: { pos: { x: 0, y: 0 } as Vec, angle: -Math.PI / 2, speed: 0 }, // m/s-ish unit
    keys: { up: false, down: false, left: false, right: false },
    npcs: [] as NPCVehicle[],
    potholes: [] as Pothole[],
    peds: [] as Pedestrian[],
    light: null as TrafficLight | null,
    turn: null as Turn | null,
    freezeUntil: 0,
    fuel: 100,
    seatbelt: false,
    indicator: null as "left" | "right" | null,
    cycleStart: 0,
    pothole1Spawned: false,
    pothole2Spawned: false,
    pedSpawned: false,
    lightSpawned: false,
    npcsSpawnedThisCycle: 0,
    cycleIndex: 0,
    violations: new Set<number>(), // rule indices broken this cycle
    lastDamageMsg: "",
    lastDamageT: 0,
  });

  const [hud, setHud] = useState({
    speedKmh: 0, fuel: 100, score: 7, cycle: 1,
    seatbelt: false, indicator: null as "left" | "right" | null,
    warn: "", title: "Skilled Driver",
    showSeatbeltBtn: false,
  });

  // Resize
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const handle = () => {
      const w = wrapRef.current?.clientWidth ?? 600;
      c.width = w * devicePixelRatio;
      c.height = height * devicePixelRatio;
      c.style.width = w + "px";
      c.style.height = height + "px";
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [height]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (["ArrowUp", "w", "W"].includes(e.key)) k.up = true;
      if (["ArrowDown", "s", "S"].includes(e.key)) k.down = true;
      if (["ArrowLeft", "a", "A"].includes(e.key)) k.left = true;
      if (["ArrowRight", "d", "D"].includes(e.key)) k.right = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (["ArrowUp", "w", "W"].includes(e.key)) k.up = false;
      if (["ArrowDown", "s", "S"].includes(e.key)) k.down = false;
      if (["ArrowLeft", "a", "A"].includes(e.key)) k.left = false;
      if (["ArrowRight", "d", "D"].includes(e.key)) k.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch control helpers
  const press = (k: "up" | "down" | "left" | "right", v: boolean) => {
    stateRef.current.keys[k] = v;
  };

  const lockSeatbelt = () => {
    stateRef.current.seatbelt = true;
    setHud((h) => ({ ...h, seatbelt: true, showSeatbeltBtn: false }));
  };
  const pressIndicator = (d: "left" | "right") => {
    stateRef.current.indicator = d;
    setHud((h) => ({ ...h, indicator: d }));
    setTimeout(() => {
      if (stateRef.current.indicator === d) {
        stateRef.current.indicator = null;
        setHud((h) => ({ ...h, indicator: null }));
      }
    }, 5000);
  };

  // Main loop
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    const s = stateRef.current;
    s.cycleStart = performance.now();

    const spawnNPC = () => {
      const a = Math.random() * Math.PI * 2;
      const r = 300 + Math.random() * 400;
      const types = ["car", "truck", "lorry", "car", "car"];
      const colors = ["#e94560", "#ffd600", "#00d4ff", "#ff7c2a", "#b060ff"];
      const tIdx = Math.floor(Math.random() * types.length);
      s.npcs.push({
        pos: { x: s.car.pos.x + Math.cos(a) * r, y: s.car.pos.y + Math.sin(a) * r },
        vel: { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 },
        color: colors[tIdx],
        w: types[tIdx] === "car" ? 24 : 30,
        h: types[tIdx] === "car" ? 44 : 60,
        type: types[tIdx],
      });
      s.npcsSpawnedThisCycle++;
    };

    const spawnPothole = () => {
      const a = s.car.angle;
      const dist = 180 + Math.random() * 80;
      s.potholes.push({
        pos: { x: s.car.pos.x + Math.cos(a) * dist, y: s.car.pos.y + Math.sin(a) * dist },
        r: 18, warned: false, passed: false,
      });
      setHud((h) => ({ ...h, warn: "⚠ POTHOLE AHEAD — slow down & lock seat-belt!", showSeatbeltBtn: !s.seatbelt }));
      clearWarn(2500);
    };
    const spawnPed = () => {
      s.peds = [];
      const a = s.car.angle;
      const baseX = s.car.pos.x + Math.cos(a) * 260;
      const baseY = s.car.pos.y + Math.sin(a) * 260;
      for (let i = 0; i < 3; i++) {
        s.peds.push({ pos: { x: baseX - 40 + i * 30, y: baseY + 80 }, vy: -25, alive: true });
      }
      setHud((h) => ({ ...h, warn: "🚸 ZEBRA CROSSING — stop & give way!" }));
      clearWarn(2500);
    };
    const spawnLight = () => {
      const a = s.car.angle;
      s.light = {
        pos: { x: s.car.pos.x + Math.cos(a) * 280, y: s.car.pos.y + Math.sin(a) * 280 },
        phase: "red", t: 0,
      };
      setHud((h) => ({ ...h, warn: "🚦 TRAFFIC LIGHT — obey the signal!" }));
      clearWarn(2500);
    };

    const spawnTurn = () => {
      const a = s.car.angle;
      const dir: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
      s.turn = { pos: { x: s.car.pos.x + Math.cos(a) * 220, y: s.car.pos.y + Math.sin(a) * 220 }, dir, used: false };
      setHud((h) => ({ ...h, warn: `↩ ${dir.toUpperCase()} TURN AHEAD — use indicator!` }));
      clearWarn(2500);
    };

    let warnTimer = 0;
    const clearWarn = (ms: number) => {
      clearTimeout(warnTimer);
      warnTimer = window.setTimeout(() => setHud((h) => ({ ...h, warn: "" })), ms);
    };

    const violate = (rule: number, msg: string, freezeMs = 0) => {
      if (s.violations.has(rule)) return;
      s.violations.add(rule);
      if (freezeMs > 0) s.freezeUntil = performance.now() + freezeMs;
      setHud((h) => ({ ...h, score: Math.max(0, 7 - s.violations.size), warn: `❌ ${msg}` }));
      clearWarn(2400);
    };

    const resetCycle = () => {
      s.cycleStart = performance.now();
      s.cycleIndex++;
      s.pothole1Spawned = false;
      s.pothole2Spawned = false;
      s.pedSpawned = false;
      s.lightSpawned = false;
      s.npcsSpawnedThisCycle = 0;
      s.violations.clear();
      setHud((h) => ({ ...h, score: 7, cycle: s.cycleIndex + 1, title: "Skilled Driver" }));
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // ───────── CONTROLS ─────────
      const frozen = now < s.freezeUntil;
      const accel = frozen ? 0 : (s.keys.up ? 90 : s.keys.down ? -60 : 0);
      const turnRate = frozen ? 0 : (s.keys.left ? -1.6 : s.keys.right ? 1.6 : 0);

      // friction
      s.car.speed += accel * dt;
      s.car.speed *= 0.985;
      s.car.speed = Math.max(-20, Math.min(s.car.speed, 60)); // cap
      if (s.fuel <= 0) s.car.speed = 0;

      // turning scales with speed
      s.car.angle += turnRate * dt * Math.min(1, Math.abs(s.car.speed) / 10);
      s.car.pos.x += Math.cos(s.car.angle) * s.car.speed * dt * 10;
      s.car.pos.y += Math.sin(s.car.angle) * s.car.speed * dt * 10;

      const kmh = Math.abs(s.car.speed) * 3.6 * 1.5; // visualized km/h
      // Rule 1: speed limit
      if (kmh > 100) {
        if (!s.violations.has(0)) violate(0, "Exceeded 100 km/h speed limit!");
        s.fuel -= dt * 18; // drain fuel
        if (s.fuel <= 0) { s.fuel = 0; s.car.speed = 0; }
      } else {
        // recover fuel slowly when below 100
        if (s.fuel < 100) s.fuel = Math.min(100, s.fuel + dt * 4);
      }

      // ───────── CYCLE EVENTS ─────────
      const t = now - s.cycleStart;
      if (t > CYCLE_MS) resetCycle();

      // Potholes
      if (!s.pothole1Spawned && t > 3_000) { spawnPothole(); s.pothole1Spawned = true; }
      if (!s.pothole2Spawned && t > CYCLE_MS - 15_000) { spawnPothole(); s.pothole2Spawned = true; }

      // Pedestrians (within first 3 game-minutes ≈ first 20% of cycle)
      if (!s.pedSpawned && t > 25_000) { spawnPed(); s.pedSpawned = true; }

      // Traffic light (within first 1 game-minute ≈ first 11s)
      if (!s.lightSpawned && t > 12_000) { spawnLight(); s.lightSpawned = true; }
      if (s.light) {
        s.light.t += dt;
        if (s.light.phase === "red" && s.light.t > 8) { s.light.phase = "green"; s.light.t = 0; }
        else if (s.light.phase === "yellow" && s.light.t > 2) { s.light.phase = "red"; s.light.t = 0; }
        else if (s.light.phase === "green" && s.light.t > 6) { s.light.phase = "yellow"; s.light.t = 0; }
      }

      // NPCs — 5 per cycle
      if (s.npcsSpawnedThisCycle < 5 && Math.random() < dt * 0.6) spawnNPC();

      // Turn cue
      if (!s.turn && Math.random() < dt * 0.03) spawnTurn();

      // ───────── COLLISION / RULE CHECKS ─────────
      // Pothole rule (2): need seatbelt + slow speed when within radius
      for (const p of s.potholes) {
        const dx = p.pos.x - s.car.pos.x, dy = p.pos.y - s.car.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < 40 && !p.passed) {
          p.passed = true;
          if (!s.seatbelt || kmh > 40) {
            violate(1, "Pothole hit without seat-belt / too fast!");
          }
        }
      }

      // Pedestrian rule (3)
      for (const ped of s.peds) {
        if (!ped.alive) continue;
        ped.pos.y += ped.vy * dt;
        const dx = ped.pos.x - s.car.pos.x, dy = ped.pos.y - s.car.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < 80 && kmh > 5) {
          violate(3, "Did not stop for pedestrians!", 10_000);
          ped.alive = false;
        }
      }

      // Traffic light rule (2)
      if (s.light) {
        const d = Math.hypot(s.light.pos.x - s.car.pos.x, s.light.pos.y - s.car.pos.y);
        if (d < 60 && s.light.phase === "red" && kmh > 5) {
          violate(2, "Ran a RED light!", 10_000);
        }
      }

      // NPCs update + rules 4 (overtake) and 5 (distance)
      for (const n of s.npcs) {
        n.pos.x += n.vel.x * dt;
        n.pos.y += n.vel.y * dt;
        const dx = n.pos.x - s.car.pos.x, dy = n.pos.y - s.car.pos.y;
        const d = Math.hypot(dx, dy);
        // Following distance
        if (d < 50 && d > 25) violate(5, "Too close to vehicle in front!");
        // Overtake check: if car speed > npc speed and within close radius
        const npcSpeed = Math.hypot(n.vel.x, n.vel.y);
        if (d < 70 && kmh > 60 && kmh > npcSpeed * 3.6 * 1.5 + 20) {
          violate(4, "Overtook a vehicle dangerously!");
        }
      }

      // Turn indicator rule (6)
      if (s.turn && !s.turn.used) {
        const d = Math.hypot(s.turn.pos.x - s.car.pos.x, s.turn.pos.y - s.car.pos.y);
        if (d < 40) {
          if (s.indicator !== s.turn.dir) violate(6, `Forgot ${s.turn.dir} indicator!`);
          s.turn.used = true;
          setTimeout(() => { s.turn = null; }, 1000);
        }
      }

      // Keep peds/lights/turns from accumulating
      if (s.peds.length && s.peds.every((p) => !p.alive || p.pos.y < s.car.pos.y - 300)) s.peds = [];

      // ───────── RENDER ─────────
      const W = c.width, H = c.height;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const cw = W / devicePixelRatio, ch = H / devicePixelRatio;

      // sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0, "#1a1f2e");
      sky.addColorStop(1, "#0a1018");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cw, ch);

      // world grid (translates with car)
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate(-s.car.angle - Math.PI / 2);
      ctx.translate(-s.car.pos.x, -s.car.pos.y);

      // grid
      const grid = 80;
      const gx = Math.floor(s.car.pos.x / grid) * grid;
      const gy = Math.floor(s.car.pos.y / grid) * grid;
      ctx.strokeStyle = "rgba(0,212,255,0.08)";
      ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(gx + i * grid, gy - 900);
        ctx.lineTo(gx + i * grid, gy + 900);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx - 900, gy + i * grid);
        ctx.lineTo(gx + 900, gy + i * grid);
        ctx.stroke();
      }

      // dashed lane marks scattered for "landscape" feel
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([6, 14]);
      ctx.lineWidth = 2;
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(gx + i * grid * 2, gy - 900);
        ctx.lineTo(gx + i * grid * 2, gy + 900);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // potholes
      for (const p of s.potholes) {
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ff3b5c";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // traffic light
      if (s.light) {
        ctx.fillStyle = "#222";
        ctx.fillRect(s.light.pos.x - 10, s.light.pos.y - 30, 20, 60);
        const color = s.light.phase === "red" ? "#ff3b5c" : s.light.phase === "yellow" ? "#ffd600" : "#00ff88";
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(s.light.pos.x, s.light.pos.y - 14 + (s.light.phase === "red" ? 0 : s.light.phase === "yellow" ? 14 : 28), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(s.light.pos.x, s.light.pos.y - 14 + (s.light.phase === "red" ? 0 : s.light.phase === "yellow" ? 14 : 28), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // pedestrians + zebra
      if (s.peds.length) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (let i = 0; i < 8; i++) {
          ctx.fillRect(s.peds[0].pos.x - 50 + i * 14, s.peds[0].pos.y + 20, 10, 40);
        }
        for (const ped of s.peds) {
          if (!ped.alive) continue;
          ctx.fillStyle = "#ffd600";
          ctx.beginPath();
          ctx.arc(ped.pos.x, ped.pos.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // turn marker
      if (s.turn) {
        ctx.fillStyle = "rgba(0,212,255,0.2)";
        ctx.beginPath();
        ctx.arc(s.turn.pos.x, s.turn.pos.y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#00d4ff";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText(s.turn.dir === "left" ? "←" : "→", s.turn.pos.x, s.turn.pos.y + 6);
      }

      // NPCs
      for (const n of s.npcs) {
        ctx.fillStyle = n.color;
        ctx.fillRect(n.pos.x - n.w / 2, n.pos.y - n.h / 2, n.w, n.h);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.strokeRect(n.pos.x - n.w / 2, n.pos.y - n.h / 2, n.w, n.h);
      }

      // Player car — stylized Bugatti-style silver coupe
      ctx.save();
      ctx.translate(s.car.pos.x, s.car.pos.y);
      ctx.rotate(s.car.angle + Math.PI / 2);
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(-15, -28, 30, 56);
      // body
      const carGrad = ctx.createLinearGradient(-15, 0, 15, 0);
      carGrad.addColorStop(0, "#9ba8b5");
      carGrad.addColorStop(0.5, "#e8edf3");
      carGrad.addColorStop(1, "#9ba8b5");
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.moveTo(-13, -24);
      ctx.lineTo(13, -24);
      ctx.lineTo(15, 0);
      ctx.lineTo(13, 24);
      ctx.lineTo(-13, 24);
      ctx.lineTo(-15, 0);
      ctx.closePath();
      ctx.fill();
      // windshield
      ctx.fillStyle = "rgba(0,40,80,0.85)";
      ctx.fillRect(-10, -18, 20, 14);
      ctx.fillRect(-10, 4, 20, 12);
      // headlights
      ctx.fillStyle = "#fff8cc";
      ctx.fillRect(-12, -26, 6, 3);
      ctx.fillRect(6, -26, 6, 3);
      // tail
      ctx.fillStyle = "#ff3b5c";
      ctx.fillRect(-12, 23, 6, 3);
      ctx.fillRect(6, 23, 6, 3);
      // indicator blink
      if (s.indicator) {
        const blink = Math.floor(now / 250) % 2 === 0;
        if (blink) {
          ctx.fillStyle = "#ffae00";
          if (s.indicator === "left") ctx.fillRect(-16, -4, 4, 8);
          else ctx.fillRect(12, -4, 4, 8);
        }
      }
      ctx.restore();
      ctx.restore();

      // ───────── HUD UPDATE ─────────
      // Throttle HUD setState
      if (Math.floor(now / 100) !== Math.floor(last / 100) - 0) {
        setHud((h) => ({
          ...h,
          speedKmh: Math.round(kmh),
          fuel: Math.round(s.fuel),
          seatbelt: s.seatbelt,
          score: Math.max(0, 7 - s.violations.size),
          cycle: s.cycleIndex + 1,
          title: s.violations.size === 0 ? "Skilled Driver 🏆" : s.violations.size <= 2 ? "Careful Driver" : "Needs Practice",
        }));
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ───────── UI ─────────
  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{ height, border: "1px solid var(--border)", boxShadow: "0 0 80px rgba(0,212,255,0.15)", background: "#020810", touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Title strip */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className="font-mono text-[0.65rem] tracking-widest text-cyan px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid var(--cyan)" }}>
          🚗 ROADWATCH DRIVING SCHOOL
        </div>
        <div className="font-mono text-[0.65rem] px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>
          CYCLE #{hud.cycle}
        </div>
      </div>

      {/* Warn banner */}
      {hud.warn && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 font-mono text-xs text-center px-4 py-2 rounded-lg max-w-[90%]"
          style={{ background: "rgba(0,0,0,0.8)", border: "1px solid var(--red)", color: "#fff" }}>
          {hud.warn}
        </div>
      )}

      {/* Speedometer + fuel + score (right side) */}
      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-2 pointer-events-none">
        <Speedometer kmh={hud.speedKmh} fuel={hud.fuel} />
        <div className="font-mono text-[0.65rem] px-3 py-1.5 rounded-lg text-right" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", color: "#fff" }}>
          <div>SCORE <span className="text-cyan font-bold">{hud.score}/7</span></div>
          <div className="text-[0.6rem] text-text-dim">{hud.title}</div>
        </div>
      </div>

      {/* Rules ticker (left) */}
      <div className="absolute left-3 bottom-3 max-w-[200px] hidden md:block pointer-events-none">
        <div className="font-mono text-[0.6rem] tracking-widest text-text-ghost mb-1">7 RULES</div>
        <ol className="space-y-0.5">
          {RULES.map((r, i) => {
            const broken = 7 - hud.score > 0 && (hud.score < 7 - i);
            return (
              <li key={r} className="font-mono text-[0.6rem] flex items-center gap-1" style={{ color: broken ? "#ff3b5c" : "#9bb5cf" }}>
                <span>{broken ? "✗" : "✓"}</span><span>{r}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Controls overlay — Seatbelt + Indicators (always visible) */}
      <div className="absolute top-20 right-3 flex flex-col gap-2">
        {!hud.seatbelt && (
          <button
            onClick={lockSeatbelt}
            className="font-mono text-[0.7rem] px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: "var(--red)", color: "#fff", border: "1px solid #fff" }}
          >
            🔒 LOCK SEAT-BELT
          </button>
        )}
        {hud.seatbelt && (
          <div className="font-mono text-[0.6rem] px-3 py-1.5 rounded-lg text-center" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid #00ff88" }}>
            ✓ BELT LOCKED
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => pressIndicator("left")} className="font-mono text-xs px-3 py-2 rounded-lg" style={{ background: hud.indicator === "left" ? "#ffae00" : "rgba(0,0,0,0.7)", color: hud.indicator === "left" ? "#000" : "#ffae00", border: "1px solid #ffae00" }}>← IND</button>
          <button onClick={() => pressIndicator("right")} className="font-mono text-xs px-3 py-2 rounded-lg" style={{ background: hud.indicator === "right" ? "#ffae00" : "rgba(0,0,0,0.7)", color: hud.indicator === "right" ? "#000" : "#ffae00", border: "1px solid #ffae00" }}>IND →</button>
        </div>
      </div>

      {/* Touch D-pad (mobile + always shown) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 grid grid-cols-3 gap-1 select-none" style={{ touchAction: "none" }}>
        <div />
        <TouchBtn label="▲" onDown={() => press("up", true)} onUp={() => press("up", false)} />
        <div />
        <TouchBtn label="◀" onDown={() => press("left", true)} onUp={() => press("left", false)} />
        <TouchBtn label="●" onDown={() => press("down", true)} onUp={() => press("down", false)} />
        <TouchBtn label="▶" onDown={() => press("right", true)} onUp={() => press("right", false)} />
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[0.55rem] text-text-ghost hidden md:block pointer-events-none">
        Arrow keys / WASD · Click belt before potholes · Use indicators near turns
      </div>
    </div>
  );
}

function TouchBtn({ label, onDown, onUp }: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp(); }}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      className="w-12 h-12 rounded-full font-mono font-bold text-cyan flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", border: "1px solid var(--cyan)" }}
    >
      {label}
    </button>
  );
}

function Speedometer({ kmh, fuel }: { kmh: number; fuel: number }) {
  const angle = -120 + (Math.min(kmh, 180) / 180) * 240;
  const overSpeed = kmh > 100;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ filter: "drop-shadow(0 0 12px rgba(0,212,255,0.4))" }}>
      <defs>
        <radialGradient id="spdBg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#0a1828" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
      </defs>
      <circle cx="70" cy="70" r="65" fill="url(#spdBg)" stroke="#00d4ff" strokeWidth="2" />
      {/* ticks */}
      {Array.from({ length: 13 }).map((_, i) => {
        const a = (-120 + i * 20) * Math.PI / 180;
        const x1 = 70 + Math.cos(a) * 55, y1 = 70 + Math.sin(a) * 55;
        const x2 = 70 + Math.cos(a) * 62, y2 = 70 + Math.sin(a) * 62;
        const over = i * 15 > 100;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={over ? "#ff3b5c" : "#9bb5cf"} strokeWidth="2" />;
      })}
      {/* needle */}
      <line
        x1="70" y1="70"
        x2={70 + Math.cos(angle * Math.PI / 180) * 50}
        y2={70 + Math.sin(angle * Math.PI / 180) * 50}
        stroke={overSpeed ? "#ff3b5c" : "#00d4ff"} strokeWidth="3"
      />
      <circle cx="70" cy="70" r="5" fill="#00d4ff" />
      <text x="70" y="105" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">{kmh} km/h</text>
      {/* fuel */}
      <g transform="translate(15,118)">
        <text x="0" y="0" fontSize="9" fill="#9bb5cf" fontFamily="monospace">⛽</text>
        <rect x="14" y="-8" width="60" height="8" fill="#222" stroke="#00d4ff" strokeWidth="0.5" />
        <rect x="14" y="-8" width={60 * fuel / 100} height="8" fill={fuel < 25 ? "#ff3b5c" : fuel < 50 ? "#ffd600" : "#00ff88"} />
        <text x="78" y="0" fontSize="8" fill="#fff" fontFamily="monospace">{fuel}%</text>
      </g>
    </svg>
  );
}
