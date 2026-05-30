import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SITES: { name: string; url: string }[] = [
  { name: "Parivahan", url: "https://parivahan.gov.in/" },
  { name: "MoRTH (Ministry of Road Transport & Highways)", url: "https://morth.gov.in/#/" },
  { name: "Tamil Nadu Police Portal", url: "https://www.police.tn.gov.in/citizenportal" },
  { name: "IndiaCode", url: "https://www.indiacode.nic.in/" },
];

export function HubButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-1.5 rounded-full text-cyan transition-colors hover:bg-[rgba(0,212,255,0.12)] font-mono text-[0.72rem]"
        style={{ border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)" }}
      >
        ⬡ ROADWATCH Hub ▾
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-[280px] surface-card p-2 z-[50]"
              style={{ background: "rgba(6,13,26,0.97)", backdropFilter: "blur(20px)" }}
            >
              <div className="font-mono text-[0.6rem] text-text-ghost tracking-widest px-3 py-2">
                OFFICIAL GOV. PORTALS
              </div>
              {SITES.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg font-sans text-sm text-text-dim hover:text-cyan hover:bg-[rgba(0,212,255,0.06)] transition-colors"
                >
                  {s.name}
                </a>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
