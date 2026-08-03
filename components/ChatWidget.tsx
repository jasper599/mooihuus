"use client";

import { useEffect, useRef, useState } from "react";
import { useT, useLocale } from "./I18nProvider";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: t("chat.greet") }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    const tekst = input.trim();
    if (!tekst || busy) return;
    const nieuw: Msg[] = [...msgs, { role: "user", content: tekst }];
    setMsgs(nieuw);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nieuw, locale }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || "…" }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "…" }]);
    } finally {
      setBusy(false);
    }
  }

  const suggesties = [t("chat.s1"), t("chat.s2"), t("chat.s3")];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("chat.title")}
        className="fixed bottom-4 right-4 z-[95] w-14 h-14 rounded-full bg-oranje hover:bg-oranje-dk text-white shadow-lg flex items-center justify-center"
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 5h16v11H8l-4 3V5Z" fill="#fff" />
            <circle cx="9" cy="10.5" r="1.1" fill="#E8823B" />
            <circle cx="12.5" cy="10.5" r="1.1" fill="#E8823B" />
            <circle cx="16" cy="10.5" r="1.1" fill="#E8823B" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-[95] w-[92vw] max-w-sm bg-white border border-lijn rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: "min(70vh, 520px)" }}>
          <div className="bg-bosgroen text-white px-4 py-3">
            <div className="font-display font-extrabold">{t("chat.title")}</div>
            <div className="text-[0.72rem] text-salie-lt">{t("chat.sub")}</div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-zand">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl ${m.role === "user" ? "bg-bosgroen text-white rounded-br-sm" : "bg-white border border-lijn text-inkt rounded-bl-sm"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-grijs px-1">…</div>}
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggesties.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs bg-salie-lt text-bosgroen-dk rounded-full px-2.5 py-1 font-semibold">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={verstuur} className="p-2 border-t border-lijn flex gap-2 bg-white">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("chat.ph")} className="flex-1 text-sm border border-lijn rounded-xl px-3 py-2 bg-creme" />
            <button className="btn text-sm px-4" disabled={busy}>{t("chat.send")}</button>
          </form>
        </div>
      )}
    </>
  );
}
