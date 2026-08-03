import { NextResponse } from "next/server";
import { lokaalAntwoord, SYSTEM_PROMPT } from "@/lib/chat";

// Chatbot-endpoint.
// - Zonder ANTHROPIC_API_KEY: lokale, FAQ-gebaseerde antwoorden (werkt overal).
// - Met key: echte LLM (Anthropic Messages API) met de Mooihuus-kennis als systeemprompt.
const FALLBACK_I18N: Record<string, string> = {
  en: "Good question! I don't have a ready answer for that. Check our FAQ (/faq) or email info@mooihuus.nl and we'll help you quickly.",
  de: "Gute Frage! Darauf habe ich keine fertige Antwort. Schau in unsere FAQ (/faq) oder schreib an info@mooihuus.nl — wir helfen dir schnell weiter.",
};

export async function POST(req: Request) {
  const { messages, locale } = await req.json();
  const taal = locale === "en" || locale === "de" ? locale : "nl";
  const lijst: { role: string; content: string }[] = Array.isArray(messages) ? messages : [];
  const laatste = [...lijst].reverse().find((m) => m.role === "user")?.content ?? "";

  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.CHAT_MODEL || "claude-3-5-haiku-latest",
          max_tokens: 400,
          system: SYSTEM_PROMPT + `\n\nAntwoord in de taal van de gebruiker (locale: ${taal}).`,
          messages: lijst
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: String(m.content) })),
        }),
      });
      const data = await res.json();
      const tekst = data?.content?.[0]?.text;
      if (tekst) return NextResponse.json({ reply: tekst });
    } catch {
      // val terug op lokaal antwoord
    }
  }

  // Lokale (offline) fallback: Nederlands krijgt slimme FAQ-antwoorden;
  // andere talen krijgen een nette verwijzing (echte LLM doet de rest met key).
  if (taal === "nl") return NextResponse.json({ reply: lokaalAntwoord(laatste) });
  return NextResponse.json({ reply: FALLBACK_I18N[taal] });
}
