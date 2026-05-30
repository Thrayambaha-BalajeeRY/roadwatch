import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/roadwatch";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — RoadWatch" },
      { name: "description", content: "Ask RoadWatch AI about road safety, budget, and infrastructure." },
    ],
  }),
  component: Chat,
});

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "📍 Show me critical roads in Bengaluru",
  "🗺 Which road has the worst safety score?",
  "💸 Where is the public money being wasted?",
  "🔍 How does AI detection work?",
];

function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hello! I'm RoadWatch AI, powered by LLaMA 3.3. Ask me about road safety scores, budget mismanagement, or specific roads in any monitored city." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    const res = await api.chat(text, next);
    setMsgs([...next, { role: "assistant", content: res.reply }]);
    setBusy(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 lg:px-10">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[35%_1fr] gap-6 h-[calc(100vh-7rem)]">
        {/* Left info panel */}
        <div className="surface-card p-6 flex flex-col" style={{ background: "rgba(10,22,40,0.6)", backdropFilter: "blur(12px)" }}>
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-4"
          >
            🤖
          </motion.div>
          <div className="font-display font-bold text-2xl text-cyan text-glow-cyan">RoadWatch AI</div>
          <div className="font-mono text-xs text-text-dim mt-1">Powered by LLaMA 3.3 70B</div>

          <div className="my-6 h-px bg-border" />

          <div className="font-display font-bold text-text mb-3 text-sm tracking-wider uppercase">Capabilities</div>
          <ul className="space-y-2 text-sm text-text-dim">
            {["Road safety analysis", "Budget mismanagement detection", "GPS-based road queries", "Complaint routing assistance", "Real-time defect insights"].map((c) => (
              <li key={c}><span className="text-cyan mr-2">✓</span>{c}</li>
            ))}
          </ul>

          <div className="mt-auto pt-6">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
                  className="w-2 h-2 rounded-full bg-cyan"
                />
              ))}
            </div>
            <div className="font-mono text-[0.65rem] text-text-ghost mt-2">NEURAL PULSE ACTIVE</div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="surface-card flex flex-col overflow-hidden min-h-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="font-display font-bold text-text">Conversation</div>
            <div className="flex items-center gap-2 font-mono text-xs text-green">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green" />
              ONLINE
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {msgs.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === "user"
                      ? { background: "var(--grad-btn)", color: "#000", fontWeight: 500 }
                      : { background: "var(--elevated)", color: "var(--text)", border: "1px solid var(--border)" }
                  }
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
            {busy && (
              <div className="flex gap-2 px-4 py-3 rounded-2xl w-fit" style={{ background: "var(--elevated)" }}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan"
                  />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {msgs.length <= 1 && (
            <div className="px-5 pb-4">
              <div className="font-mono text-[0.65rem] text-text-ghost mb-2 tracking-widest">SUGGESTED</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s.replace(/^[^\s]+\s/, ""))}
                    className="text-left text-sm px-3 py-2 rounded-lg text-text-dim transition-colors hover:bg-[var(--elevated)] hover:text-text"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-4 flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about India's roads…"
              className="flex-1 bg-[var(--surface)] border border-border rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-cyan transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={busy || !input.trim()}
              className="btn-primary px-6 py-3 disabled:opacity-50"
            >
              Send →
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
