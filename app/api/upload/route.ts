
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
 
export const runtime = "nodejs";
 
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
 
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
  const isPdf = file.type === "application/pdf";
  if (!file.type.startsWith("image/") && !isPdf) {
    return NextResponse.json({ error: "Alleen afbeeldingen of een PDF zijn toegestaan." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const maxMb = isPdf ? 12 : 8;
  if (buf.length > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `Bestand te groot (max ${maxMb} MB).` }, { status: 400 });
  }
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = (file.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5);
  const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return NextResponse.json({ url: `/api/foto/${name}` });
}
 

