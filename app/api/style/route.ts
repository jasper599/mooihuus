import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { genereerStyling, stylingBeschikbaar } from "@/lib/ai-styling";
import { aiStylingStatus, aiStylingTel } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export async function POST(req: Request) {
  // 1) Alleen ingelogde gebruikers — nooit publiek.
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  // 2) Aan/uit-knop + API-sleutel aanwezig.
  if (!stylingBeschikbaar()) {
    return NextResponse.json({ error: "AI-styling staat momenteel uit." }, { status: 503 });
  }

  // 3) Harde limieten (per gebruiker per dag + globaal dagplafond).
  const status = aiStylingStatus(userId);
  if (!status.mag) return NextResponse.json({ error: status.reden }, { status: 429 });

  // 4) Invoer.
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const stijl = String(form.get("stijl") || "modern");
  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Upload een foto (afbeelding)." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Foto te groot (max 8 MB)." }, { status: 400 });
  }
  const dataUri = `data:${file.type};base64,${buf.toString("base64")}`;

  // 5) Genereren (Gemini geeft het beeld als base64 terug).
  let gen: { base64: string; mime: string };
  try {
    gen = await genereerStyling(dataUri, stijl);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Het genereren is mislukt." }, { status: 502 });
  }

  // 6) Resultaat op het volume opslaan met "ai-"-prefix (voor de labeling),
  //    en pas dan het verbruik tellen (mislukt genereren kost geen tegoed).
  try {
    const outBuf = Buffer.from(gen.base64, "base64");
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const ext = gen.mime.includes("jpeg") || gen.mime.includes("jpg") ? "jpg" : "png";
    const naam = `ai-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, naam), outBuf);
    aiStylingTel(userId);
    return NextResponse.json({ url: `/api/foto/${naam}`, restDag: status.restDag - 1 });
  } catch (e: any) {
    return NextResponse.json({ error: "Opslaan van het beeld mislukte." }, { status: 500 });
  }
}
