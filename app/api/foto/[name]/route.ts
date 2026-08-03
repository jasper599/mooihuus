import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const name = params.name.replace(/[^a-zA-Z0-9._-]/g, "");
  const fp = path.join(DATA_DIR, "uploads", name);
  if (!name || !fs.existsSync(fp)) return new NextResponse("Niet gevonden", { status: 404 });
  const buf = fs.readFileSync(fp);
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  const type =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
