import { NextResponse } from "next/server";
import { getLiveListings } from "@/lib/db";

export const dynamic = "force-dynamic";

// Publiek aanbod (alleen live advertenties). Wordt o.a. door de mobiele app
// uitgelezen. CORS open zodat ook een webclient het kan ophalen.
export async function GET() {
  return NextResponse.json(getLiveListings(), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
