import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MailView({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") redirect("/inloggen");

  const email = getEmail(params.id);
  if (!email) return notFound();

  return (
    <div>
      <Link href="/beheer?tab=mailbox" className="text-sm text-bosgroen hover:underline">← Terug naar mailbox</Link>
      <div className="mt-3 mb-3">
        <div className="font-display font-bold text-xl text-bosgroen-dk">{email.onderwerp}</div>
        <div className="text-sm text-grijs">aan {email.aan} · {new Date(email.datum).toLocaleString("nl-NL")} · verzonden via {email.verzondenVia === "smtp" ? "SMTP" : "preview (geen SMTP ingesteld)"}</div>
      </div>
      <div className="card p-0 overflow-hidden">
        <iframe title="e-mail" srcDoc={email.html} className="w-full" style={{ height: "760px", border: "none" }} />
      </div>
    </div>
  );
}
