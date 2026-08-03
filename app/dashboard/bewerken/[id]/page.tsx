import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing } from "@/lib/db";
import { BewerkForm } from "@/components/BewerkForm";

export const dynamic = "force-dynamic";

export default async function BewerkPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId) redirect("/inloggen");

  const listing = getListing(params.id);
  if (!listing) return notFound();
  if (listing.ownerId !== userId && rol !== "beheerder") redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-grijs hover:text-bosgroen">← Terug naar dashboard</Link>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk mt-2 mb-1">Woning bewerken</h1>
      <p className="text-grijs mb-5">Pas de gegevens en foto's aan. Wijzigingen zijn meteen zichtbaar op je advertentie.</p>
      <div className="card">
        <BewerkForm listing={listing} />
      </div>
    </div>
  );
}
