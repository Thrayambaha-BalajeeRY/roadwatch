import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useRef } from "react";
import CountUp from "react-countup";
import { ClientOnly } from "@/components/ClientOnly";
import { RoadMap } from "@/components/RoadMap";
import { DrivingGame } from "@/components/DrivingGame";
import { MOCK_ROADS } from "@/lib/roadwatch";

// Cinematic smooth scroll for "Watch the Story" CTA (custom easing, ~1.6s).
function cinematicScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const startY = window.scrollY;
  const targetY = el.getBoundingClientRect().top + window.scrollY - 40;
  const dist = targetY - startY;
  const duration = 1600;
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 4); // easeOutQuart
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + dist * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoadWatch — India's Roads, Intelligently Monitored" },
      { name: "description", content: "Real-time AI detection of potholes, budget mismanagement, and infrastructure failures, pinpointed to exact GPS coordinates." },
      { property: "og:title", content: "RoadWatch — AI Road Intelligence" },
      { property: "og:description", content: "GPS-accurate AI monitoring for India's roads." },
    ],
  }),
  component: Landing,
});

function Orb({ x, y, color, size, delay, dur }: { x: string; y: string; color: string; size: number; delay: number; dur: number }) {
  return (
    <motion.div
      aria-hidden
      animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: "easeInOut" }}
      style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 ${size * 3}px ${color}`, filter: "blur(1px)" }}
    />
  );
}

function Landing() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.4]);

  return (
    <div ref={ref} className="bg-deep">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <Orb x="10%" y="20%" color="rgba(0,212,255,0.5)" size={6} delay={0} dur={6} />
        <Orb x="85%" y="30%" color="rgba(0,255,136,0.5)" size={8} delay={1} dur={8} />
        <Orb x="20%" y="70%" color="rgba(0,212,255,0.4)" size={5} delay={2} dur={7} />
        <Orb x="75%" y="75%" color="rgba(176,96,255,0.4)" size={7} delay={0.5} dur={9} />
        <Orb x="50%" y="15%" color="rgba(0,212,255,0.3)" size={4} delay={3} dur={5} />
        <Orb x="40%" y="85%" color="rgba(0,255,136,0.3)" size={6} delay={1.5} dur={10} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-[900px] mx-auto px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full font-mono text-[0.7rem] text-cyan"
            style={{ background: "linear-gradient(90deg, rgba(0,212,255,0.08), rgba(0,255,136,0.06))", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            🏆 IIT Madras Road Safety Hackathon 2026
          </motion.div>

          <motion.h1 className="font-display font-extrabold tracking-tight" style={{ fontSize: "clamp(3rem, 7vw, 6rem)", lineHeight: 1.0 }}>
            {["India's Roads.", "Intelligently Monitored."].map((line, li) => (
              <span key={li} className="block overflow-hidden">
                {line.split(" ").map((w, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 + (li * 0.3 + i * 0.06), ease: [0.22, 1, 0.36, 1] }}
                    className={"inline-block mr-3 " + (w === "Intelligently" ? "text-gradient-cyan" : "text-text")}
                  >
                    {w}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 font-sans text-[1.1rem] text-text-dim max-w-[560px] mx-auto leading-relaxed">
            Real-time AI detection of potholes, budget mismanagement, and infrastructure failures — pinpointed to exact GPS coordinates. Built for the citizens of India.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-10 flex items-center justify-center gap-8 flex-wrap">
            {[{ n: "10+", l: "Cities" }, { n: "9,000+", l: "Training Images" }, { n: "< 2s", l: "Response" }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-extrabold text-[2rem] text-gradient-cyan">{s.n}</div>
                <div className="font-sans text-xs text-text-dim mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }}
            className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dashboard">
              <motion.span whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="btn-primary inline-block">
                Enter Dashboard →
              </motion.span>
            </Link>
            <button
              onClick={() => cinematicScrollTo("problem")}
              className="btn-ghost inline-block cursor-pointer"
            >
              Watch the Story ↓
            </button>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-ghost font-mono text-xs flex flex-col items-center gap-2">
          scroll to explore<span>↓</span>
        </motion.div>
      </section>

      <ProblemSection />
      <SolutionSection />
      <MapSection />
      <MetricsSection />
      <FinalCta />
      <Credits />
      <Footer />
    </div>
  );
}

function ProblemSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="problem" ref={ref} className="relative py-32 px-6 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-12">
          <div className="font-display font-extrabold text-gradient-fire inline-block" style={{ fontSize: "clamp(4rem, 10vw, 8rem)", lineHeight: 1 }}>13%</div>
          <p className="mt-2 font-display text-xl md:text-2xl text-text">of global road accident deaths happen in India.</p>
          <p className="mt-2 font-sans text-text-dim max-w-[600px] mx-auto">30,000+ potholes in Bengaluru alone · ₹46,300 Cr spent on roads · accountability zero.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.9, delay: 0.2 }}>
          <ClientOnly fallback={<div className="shimmer rounded-2xl" style={{ height: 560 }} />}>
            <DrivingGame height={560} />
          </ClientOnly>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.5 }} className="text-center mt-8">
          <p className="font-display font-bold text-2xl md:text-3xl text-gradient-cyan">
            &ldquo;Follow traffic rules — They protect you&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const features = [
    { accent: "var(--cyan)", icon: "📍", title: "Exact GPS Coordinates", body: "Every pothole detected and pinned to exact latitude and longitude on a live map." },
    { accent: "var(--yellow)", icon: "💰", title: "Follow the Public Money", body: "Track every rupee sanctioned vs spent. AI flags mismanagement automatically." },
    { accent: "var(--green)", icon: "⚡", title: "Complaint in 30 Seconds", body: "AI routes your complaint to the exact government officer responsible." },
  ];
  return (
    <section ref={ref} className="py-32 px-6" style={{ background: "var(--surface)" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display font-extrabold text-text" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            One Platform. <span className="text-gradient-cyan">Total Visibility.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.15 }} whileHover={{ y: -6 }}
              className="surface-card p-8 relative overflow-hidden" style={{ borderTop: `2px solid ${f.accent}` }}>
              <div className="text-4xl mb-5">{f.icon}</div>
              <h3 className="font-display font-bold text-xl mb-3 text-text">{f.title}</h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">{f.body}</p>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-20" style={{ background: f.accent, filter: "blur(60px)" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MapSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[40%_60%] gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }}>
          <h2 className="font-display font-extrabold text-text" style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.05 }}>
            Every Pothole. <br /><span className="text-gradient-cyan">Precisely Located.</span>
          </h2>
          <p className="mt-6 font-sans text-text-dim leading-relaxed">
            Our AI detects defects and pins them to exact GPS coordinates — latitude and longitude accurate to within meters. Toggle rain simulation on the map to see severity climb instantly.
          </p>

          <div className="mt-8 surface-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px">
              <motion.div animate={{ y: [0, 160, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, var(--cyan), transparent)", boxShadow: "0 0 12px var(--cyan)" }} />
            </div>
            <div className="font-mono text-[0.65rem] text-text-dim tracking-widest mb-3">DETECTED LOCATION</div>
            <div className="font-mono text-lg text-cyan font-bold leading-relaxed">Lat: 12.9716° N<br />Lon: 77.5946° E</div>
            <div className="font-sans text-sm text-text mt-2">MG Road, Bengaluru, Karnataka</div>
            <div className="mt-4 font-mono text-xs text-text-dim flex items-center gap-2">
              Severity: <span className="font-extrabold" style={{ color: "var(--red)" }}>CRITICAL</span>
            </div>
            <div className="font-mono text-xs text-text-dim mt-1">Confidence: 87.3%</div>
          </div>

          <ul className="mt-6 space-y-2 font-sans text-sm text-text-dim">
            {["GPS accuracy within 5 meters", "Auto-tagged with road name and city", "Works with phone camera uploads", "Rain-aware severity adjustment"].map((t, i) => (
              <li key={i}><span className="text-cyan mr-2">✓</span>{t}</li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.8 }}>
          <ClientOnly fallback={<div className="shimmer rounded-2xl" style={{ height: 480 }} />}>
            <RoadMap roads={MOCK_ROADS} center={[20, 78]} zoom={5} height={480} rainControls />
          </ClientOnly>
        </motion.div>
      </div>
    </section>
  );
}

function MetricsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const stats = [
    { n: 9000, suffix: "+", l: "Training Images", c: "var(--cyan)" },
    { n: 11, suffix: "+", l: "Roads Monitored", c: "var(--green)" },
    { n: 5, suffix: "", l: "Cities Covered", c: "var(--cyan)" },
    { n: 2, suffix: "s", prefix: "<", l: "AI Response", c: "var(--green)" },
  ];
  const stack = ["YOLOv8", "LLaMA 3.3", "MongoDB", "FastAPI", "React"];
  return (
    <section ref={ref} className="py-24 px-6" style={{ background: "var(--void)" }}>
      <div className="max-w-[1200px] mx-auto text-center">
        <h2 className="font-display font-extrabold text-text mb-16" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Built on <span className="text-gradient-cyan">Real Data.</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-extrabold" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: s.c }}>
                {inView ? (<>{s.prefix ?? ""}<CountUp end={s.n} duration={2} />{s.suffix}</>) : "0"}
              </div>
              <div className="font-sans text-text-dim text-sm mt-2">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <div className="font-mono text-text-ghost text-xs mb-4">POWERED BY</div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {stack.map((t) => (
              <span key={t} className="px-4 py-1.5 rounded-full font-mono text-xs text-text-dim transition-all hover:text-cyan hover:border-cyan"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" style={{ background: "var(--deep)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(0,212,255,0.15), transparent 60%)" }} />
      <Orb x="20%" y="30%" color="rgba(0,212,255,0.4)" size={12} delay={0} dur={8} />
      <Orb x="80%" y="60%" color="rgba(0,255,136,0.4)" size={14} delay={2} dur={9} />
      <Orb x="60%" y="20%" color="rgba(176,96,255,0.3)" size={10} delay={1} dur={7} />
      <div className="relative max-w-[800px] mx-auto text-center">
        <h2 className="font-display font-extrabold text-text" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.05 }}>
          India&apos;s Roads.<br /><span className="text-gradient-cyan">Start With You.</span>
        </h2>
        <p className="mt-6 font-sans text-text-dim text-lg max-w-[560px] mx-auto leading-relaxed">
          Every pothole you report, every complaint you file, every road you query — makes India&apos;s infrastructure smarter and more accountable.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/dashboard">
            <motion.span whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="btn-primary inline-block">
              Enter Dashboard →
            </motion.span>
          </Link>
          <Link to="/detect" className="btn-ghost inline-block">Try AI Detector</Link>
        </div>
        <div className="mt-10 font-mono text-xs text-text-ghost">Free to use. Built for citizens. Powered by AI.</div>
      </div>
    </section>
  );
}

function Credits() {
  const team = ["S. M. MONISH", "M. PRAMODH", "R. Y. THRAYAMBAHA BALAJEE", "P. HEMANDER REDDY", "KARANAM JYOSHNA", "P. MOHANA NANDHU", "K. UMA MAGHESWARI"];
  return (
    <section className="py-20 px-6" style={{ background: "var(--deep)" }}>
      <div className="max-w-[900px] mx-auto text-center">
        <div className="font-mono text-text-ghost text-xs tracking-[0.4em] mb-4">DEVELOPED BY</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {team.map((n, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="surface-card px-5 py-4 font-display font-bold text-text"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(176,96,255,0.04))" }}
            >
              {n}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6" style={{ background: "var(--void)", borderTop: "1px solid var(--border-lg)" }}>
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-display font-extrabold text-text">⬡ ROADWATCH</div>
          <p className="text-text-ghost mt-2 leading-relaxed">IIT Madras Road Safety Hackathon 2026<br />Centre of Excellence for Road Safety</p>
          <p className="text-text-ghost mt-2">Built with ❤ for safer roads.</p>
        </div>
        <div>
          <div className="font-display font-bold text-text mb-3">Navigate</div>
          <ul className="space-y-1.5 text-text-ghost">
            {["Home", "Dashboard", "Chat", "Roads", "Detect", "Complaints"].map((l) => (
              <li key={l}>
                <Link to={l === "Home" ? "/" : `/${l.toLowerCase()}`} className="hover:text-cyan transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-display font-bold text-text mb-3">Stack</div>
          <p className="text-text-ghost font-mono text-xs leading-loose">YOLOv8 · LLaMA 3.3 · MongoDB · FastAPI · React · three.js</p>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto mt-10 pt-6 border-t border-border-lg text-xs text-text-ghost flex justify-between flex-wrap">
        <span>© 2026 RoadWatch · All systems operational</span>
        <span className="font-mono">DARK_THEME=DEFAULT</span>
      </div>
    </footer>
  );
}
