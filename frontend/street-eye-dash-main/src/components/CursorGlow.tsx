import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 200, damping: 30 });
  const sy = useSpring(y, { stiffness: 200, damping: 30 });

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) setEnabled(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 600,
        height: 600,
        pointerEvents: "none",
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        background:
          "radial-gradient(circle, rgba(0,212,255,0.06) 0%, rgba(0,212,255,0.02) 30%, transparent 60%)",
        zIndex: 9999,
        mixBlendMode: "screen",
      }}
    />
  );
}
