import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TAAL: Record<string, string> = { en: "English", de: "German", nl: "Dutch" };

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").slice(0, 4000);
  const taal = TAAL[String(b.taal)] ? String(b.taal) : "en";
  if (!text.trim()) return NextResponse.json({ error: "Geen tekst." }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ vertaald: text, zonderKey: true });
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 1200,
        system: `You are a professional translator for a Dutch holiday-home marketplace. Translate the user's property description into ${TAAL[taal]}. Keep it natural, warm and accurate. Return ONLY the translation, no preamble.`,
        messages: [{ role: "user", content: text }],
      }),
    });
    const data = await res.json();
    const vertaald = data?.content?.[0]?.text;
    if (vertaald) return NextResponse.json({ vertaald });
    return NextResponse.json({ vertaald: text, fout: true });
  } catch {
    return NextResponse.json({ vertaald: text, fout: true });
  }
}
