import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HubButton } from "./HubButton";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/chat", label: "Chat" },
  { to: "/roads", label: "Roads" },
  { to: "/detect", label: "Detect" },
  { to: "/complaints", label: "Complaints" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss} IST`);
    };
    fmt();
    const t = setInterval(fmt, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: scrolled ? "rgba(6,13,26,0.85)" : "rgba(6,13,26,0)",
          borderBottomColor: scrolled ? "rgba(0,212,255,0.15)" : "rgba(0,212,255,0)",
          backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
        }}
        transition={{ duration: 0.25 }}
        className="fixed top-0 left-0 right-0 z-[1000] border-b"
        style={{ borderBottomWidth: 1 }}
      >
        <div className="max-w-[1400px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="text-cyan text-xl"
              style={{ display: "inline-block" }}
            >
              ⬡
            </motion.span>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-[1.1rem] text-glow-cyan text-gradient-cyan" style={{ letterSpacing: "0.5px" }}>
                ROADWATCH
              </div>
              <div className="font-sans text-[0.6rem] text-text-ghost tracking-wider uppercase hidden sm:block">
                AI Road Intelligence
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link font-sans text-[0.85rem] font-medium ${pathname === l.to ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 text-[0.72rem] font-mono text-text-dim">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green"
                style={{ boxShadow: "0 0 8px var(--green)" }}
              />
              LIVE
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="tabular-nums hidden xl:block">{time}</div>
            <div className="w-px h-4 bg-border hidden xl:block" />
            {onDashboard ? (
              <HubButton />
            ) : (
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-full text-cyan transition-colors hover:bg-[rgba(0,212,255,0.12)]"
                style={{ border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)" }}
              >
                Launch Dashboard →
              </Link>
            )}
          </div>

          <button
            className="lg:hidden text-text p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }} className="h-0.5 bg-cyan block" />
              <motion.span animate={{ opacity: open ? 0 : 1 }} className="h-0.5 bg-cyan block" />
              <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0 }} className="h-0.5 bg-cyan block" />
            </div>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-[999] lg:hidden flex flex-col items-center justify-center gap-6"
            style={{ background: "rgba(2,8,16,0.95)", backdropFilter: "blur(24px)" }}
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-display text-2xl text-text hover:text-cyan transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {onDashboard && <div onClick={() => setOpen(false)}><HubButton /></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
