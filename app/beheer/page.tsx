import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUsers, getListings, getLeads, getPayments, getEmails, getUser, getListing, getEnquetes, getAllReviews,
  partnerklikTotalen, getPartnerkliks, analyticsSamenvatting, getNieuwsbriefLeden,
} from "@/lib/db";
import { euro, euroCents } from "@/lib/money";
import { ReviewModeratie } from "@/components/ReviewModeratie";
import { NieuwsbriefVerstuur } from "@/components/NieuwsbriefVerstuur";
import { FeedImportKnop } from "@/components/FeedImportKnop";
import { MakelaarFactuurKnop } from "@/components/MakelaarFactuurKnop";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overzicht", label: "Overzicht" },
  { key: "statistieken", label: "Statistieken" },
  { key: "profielen", label: "Profielen" },
  { key: "advertenties", label: "Advertenties" },
  { key: "betalingen", label: "Betalingen" },
  { key: "leads", label: "Leads" },
  { key: "mailbox", label: "Mailbox" },
  { key: "enquetes", label: "Enquêtes" },
  { key: "reviews", label: "Beoordelingen" },
  { key: "partners", label: "Partners" },
  { key: "nieuwsbrief", label: "Nieuwsbrief" },
];

export default async function Beheer({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") redirect("/inloggen");

  const tab = searchParams.tab && TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab : "overzicht";
  const users = getUsers();
  const listings = getListings();
  const leads = getLeads();
  const payments = getPayments();
  const emails = getEmails();
  const enquetes = getEnquetes();
  const reviews = getAllReviews();
  const partnerTotalen = partnerklikTotalen();
  const partnerkliks = getPartnerkliks();
  const stats = analyticsSamenvatting();
  const maxDag = Math.max(1, ...stats.perDag.map((d) => d.weergaven));
  const nieuwsbrief = getNieuwsbriefLeden();
  const gemRating = enquetes.length ? enquetes.reduce((s, e) => s + e.rating, 0) / enquetes.length : 0;
  const metAanbev = enquetes.filter((e) => e.aanbeveling != null);
  const gemAanbev = metAanbev.length ? metAanbev.reduce((s, e) => s + (e.aanbeveling ?? 0), 0) / metAanbev.length : 0;
  const omzet = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.bedrag, 0);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-bosgroen-dk">Beheer · CRM</h1>
      <p className="text-grijs mb-4">Het kloppend hart: profielen, advertenties, betalingen, leads en verzonden e-mails.</p>

      <div className="flex gap-1.5 flex-wrap mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/beheer?tab=${t.key}`}
            className={`font-display font-semibold text-sm rounded-full px-3.5 py-1.5 ${
              tab === t.key ? "bg-bosgroen text-white" : "bg-white border border-lijn text-bosgroen-dk hover:bg-zand"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "statistieken" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat n={String(stats.vandaagBezoekers)} l="Bezoekers vandaag" />
            <Stat n={String(stats.weekBezoekers)} l="Bezoekers (7 dagen)" />
            <Stat n={String(stats.totaalBezoekers)} l="Bezoekers totaal" />
            <Stat n={stats.gemSessieMin ? stats.gemSessieMin + " min" : "—"} l="Gem. sessieduur" />
            <Stat n={String(stats.vandaagWeergaven)} l="Weergaven vandaag" />
            <Stat n={String(stats.weekWeergaven)} l="Weergaven (7 dagen)" />
            <Stat n={String(stats.totaalWeergaven)} l="Weergaven totaal" />
            <Stat n={`${stats.apparaat.mobiel}/${stats.apparaat.desktop}`} l="Mobiel / desktop" />
          </div>

          <div className="card mb-4">
            <div className="font-display font-bold mb-3">Bezoek per dag (laatste 14 dagen)</div>
            <div className="flex items-end gap-1.5 h-32">
              {stats.perDag.map((d) => (
                <div key={d.dag} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.dag}: ${d.weergaven} weergaven, ${d.bezoekers} bezoekers`}>
                  <div className="w-full bg-bosgroen rounded-t" style={{ height: `${Math.max(3, (d.weergaven / maxDag) * 100)}%` }} />
                  <div className="text-[0.6rem] text-grijs mt-1">{d.dag.slice(8)}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-grijs mt-2">Groene balk = paginaweergaven per dag. Beweeg eroverheen voor de aantallen.</div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="card">
              <div className="font-display font-bold mb-2">Populairste pagina's</div>
              {stats.topPaginas.length === 0 ? <div className="text-sm text-grijs">Nog geen data.</div> : (
                <ul className="text-sm space-y-1">
                  {stats.topPaginas.map((p) => (
                    <li key={p.path} className="flex justify-between gap-2"><span className="truncate text-grijs">{p.path}</span><span className="font-semibold">{p.aantal}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <div className="font-display font-bold mb-2">Waar komen ze vandaan</div>
              {stats.herkomst.length === 0 ? <div className="text-sm text-grijs">Nog geen data.</div> : (
                <ul className="text-sm space-y-1">
                  {stats.herkomst.map((h) => (
                    <li key={h.ref} className="flex justify-between gap-2"><span className="truncate text-grijs">{h.ref === "direct" ? "Direct / bookmark" : h.ref}</span><span className="font-semibold">{h.aantal}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <div className="font-display font-bold mb-2">Apparaat</div>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between"><span className="text-grijs">📱 Mobiel</span><span className="font-semibold">{stats.apparaat.mobiel}</span></li>
                <li className="flex justify-between"><span className="text-grijs">💻 Desktop</span><span className="font-semibold">{stats.apparaat.desktop}</span></li>
                <li className="flex justify-between"><span className="text-grijs">📲 Tablet</span><span className="font-semibold">{stats.apparaat.tablet}</span></li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-grijs mt-3">
            Eigen, privacyvriendelijke meting — zonder cookies en zonder externe partij. Eigen verkeer (beheer &amp; dashboard) telt niet mee. &ldquo;Waar&rdquo; is de herkomstbron; exacte locatie/land meten we niet.
          </p>
        </>
      )}

      {tab === "overzicht" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat n={String(users.length)} l="Profielen" />
            <Stat n={String(listings.length)} l="Advertenties" />
            <Stat n={String(listings.filter((l) => l.status === "live").length)} l="Waarvan live" />
            <Stat n={euro(omzet)} l="Omzet (betaald)" />
            <Stat n={String(leads.length)} l="Leads" />
            <Stat n={String(payments.filter((p) => p.status === "paid").length)} l="Betalingen" />
            <Stat n={String(emails.length)} l="Verzonden mails" />
            <Stat n={gemRating ? gemRating.toFixed(1) + " ★" : "—"} l="Gem. beoordeling" />
            <Stat n="17" l="Huusmeesters" />
          </div>
          <div className="card">
            <div className="font-display font-bold mb-2">Laatste activiteit</div>
            <ul className="text-sm text-grijs space-y-1">
              {payments.slice(-3).reverse().map((p) => (
                <li key={p.id}>💶 Betaling {p.factuurnummer} — {euroCents(p.bedrag)} ({p.status})</li>
              ))}
              {leads.slice(0, 3).map((l) => (
                <li key={l.id}>📩 Lead van {l.naam} op “{getListing(l.listingId)?.titel ?? "?"}”</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === "profielen" && (
        <Table head={["Naam / bedrijf", "E-mail", "Type", "Objecten", "Facturatie"]}>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-lijn">
              <Td>{u.type === "zakelijk" && u.bedrijfsnaam ? <span><strong>{u.bedrijfsnaam}</strong><br /><span className="text-grijs text-xs">{u.naam}{u.kvk ? ` · KvK ${u.kvk}` : ""}{u.btw ? ` · btw ${u.btw}` : ""}</span></span> : u.naam}</Td>
              <Td>{u.email}</Td>
              <Td>{u.type === "zakelijk" ? <span className="pill">Zakelijk</span> : "Particulier"}</Td>
              <Td>{listings.filter((l) => l.ownerId === u.id).length}</Td>
              <Td>{u.type === "zakelijk" ? <MakelaarFactuurKnop ownerId={u.id} /> : <span className="text-grijs text-xs">—</span>}</Td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "advertenties" && (
        <>
          <div className="card mb-4">
            <div className="font-display font-bold mb-2">Aanbod per bron</div>
            <div className="flex gap-2 flex-wrap mb-3">
              {Object.entries(
                listings.reduce((acc: Record<string, number>, l) => {
                  const b = l.source || "eigen";
                  acc[b] = (acc[b] || 0) + 1;
                  return acc;
                }, {})
              ).map(([bron, n]) => (
                <span key={bron} className="pill">{bronLabel(bron)}: <strong className="ml-1">{n as number}</strong></span>
              ))}
            </div>
            <div className="border-t border-lijn pt-3">
              <div className="text-sm text-grijs mb-2">Feed-koppelingen (handmatig synchroniseren zodra geconfigureerd):</div>
              <div className="flex gap-3 flex-wrap">
                <FeedImportKnop bron="kolibri" label="Kolibri" />
                <FeedImportKnop bron="realworks" label="Realworks" />
              </div>
            </div>
          </div>
          <Table head={["Titel", "Bron", "Eigenaar", "Doel", "Status", "Prijs"]}>
            {listings.map((l) => (
              <tr key={l.id} className="border-t border-lijn">
                <Td>{l.titel}</Td>
                <Td><span className="pill">{bronLabel(l.source)}</span></Td>
                <Td>{getUser(l.ownerId)?.naam ?? "—"}</Td>
                <Td>{l.doel === "huur" ? "Te huur" : "Te koop"}</Td>
                <Td>{statusLabel(l.status)}</Td>
                <Td>{euro(l.prijs)}</Td>
              </tr>
            ))}
          </Table>
        </>
      )}

      {tab === "betalingen" && (
        <Table head={["Factuur", "Eigenaar", "Pakket", "Bedrag", "Methode", "Status"]}>
          {payments.length === 0 ? (
            <tr><Td>—</Td><Td> </Td><Td> </Td><Td> </Td><Td> </Td><Td> </Td></tr>
          ) : payments.slice().reverse().map((p) => (
            <tr key={p.id} className="border-t border-lijn">
              <Td>{p.factuurnummer}</Td>
              <Td>{getUser(p.userId)?.naam ?? "—"}</Td>
              <Td>{p.pakket}</Td>
              <Td>{euroCents(p.bedrag)}</Td>
              <Td>{p.methode}</Td>
              <Td>{p.status === "paid" ? <span className="text-bosgroen font-semibold">Betaald ✓</span> : <span className="text-oranje-dk">Open</span>}</Td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "leads" && (
        <Table head={["Van", "E-mail", "Woning", "Bericht", "Datum"]}>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-lijn">
              <Td>{l.naam}</Td>
              <Td>{l.email}</Td>
              <Td>{getListing(l.listingId)?.titel ?? "—"}</Td>
              <Td>{l.bericht}</Td>
              <Td>{l.datum}</Td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "mailbox" && (
        <div className="space-y-2">
          {emails.length === 0 ? (
            <div className="card text-grijs text-sm">Nog geen e-mails verzonden.</div>
          ) : emails.map((e) => (
            <Link key={e.id} href={`/beheer/mail/${e.id}`} className="card flex gap-3 items-center hover:shadow-md transition-shadow">
              <div className="text-2xl">{e.soort === "betalingsbewijs" ? "🧾" : e.soort === "lead" ? "📩" : "👋"}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{e.onderwerp}</div>
                <div className="text-xs text-grijs">aan {e.aan} · {new Date(e.datum).toLocaleString("nl-NL")} · via {e.verzondenVia === "smtp" ? "SMTP" : "preview"}</div>
              </div>
              <span className="text-bosgroen text-sm font-semibold">Bekijk →</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "enquetes" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Stat n={gemRating ? gemRating.toFixed(1) + " / 5" : "—"} l="Gem. beoordeling" />
            <Stat n={String(enquetes.length)} l="Reacties" />
            <Stat n={metAanbev.length ? gemAanbev.toFixed(1) + " / 10" : "—"} l="Gem. aanbeveling" />
          </div>
          <div className="space-y-2">
            {enquetes.length === 0 ? (
              <div className="card text-grijs text-sm">Nog geen enquêtes ingevuld.</div>
            ) : enquetes.map((e) => (
              <div key={e.id} className="card">
                <div className="text-oranje text-lg leading-none">
                  {"★".repeat(e.rating)}<span className="text-lijn">{"★".repeat(5 - e.rating)}</span>
                </div>
                {e.opmerking && <div className="text-sm mt-1.5">&ldquo;{e.opmerking}&rdquo;</div>}
                <div className="text-xs text-grijs mt-1">
                  {new Date(e.datum).toLocaleString("nl-NL")}
                  {e.aanbeveling != null ? ` · aanbeveling ${e.aanbeveling}/10` : ""}
                  {e.listingId ? ` · ${getListing(e.listingId)?.titel ?? "woning"}` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "reviews" && (
        <div className="space-y-2">
          {reviews.length === 0 ? (
            <div className="card text-grijs text-sm">Nog geen beoordelingen ontvangen.</div>
          ) : reviews.map((r) => (
            <div key={r.id} className={`card ${r.goedgekeurd ? "" : "opacity-70 border-dashed"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-semibold text-sm">
                  {r.naam}{r.plaats ? <span className="text-grijs font-normal"> · {r.plaats}</span> : ""}
                  {!r.goedgekeurd && <span className="ml-2 text-xs text-oranje-dk font-semibold">(verborgen)</span>}
                </div>
                <div className="text-oranje text-sm">{"★".repeat(r.rating)}<span className="text-lijn">{"★".repeat(5 - r.rating)}</span></div>
              </div>
              {r.tekst && <div className="text-sm mt-1.5">&ldquo;{r.tekst}&rdquo;</div>}
              <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                <div className="text-xs text-grijs">{new Date(r.datum).toLocaleString("nl-NL")}</div>
                <ReviewModeratie id={r.id} goedgekeurd={r.goedgekeurd} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "partners" && (
        <>
          <p className="text-grijs text-sm mb-4">
            Doorkliks vanaf de Huusmeesters-pagina naar de partnerwebsites. Elke keer dat iemand op &ldquo;Bekijk partner&rdquo; klikt, tellen we dat hier.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Stat n={String(partnerkliks.length)} l="Doorkliks totaal" />
            <Stat n={String(partnerTotalen.length)} l="Partners aangeklikt" />
          </div>
          {partnerTotalen.length === 0 ? (
            <div className="card text-grijs text-sm">Nog geen doorkliks geregistreerd.</div>
          ) : (
            <Table head={["Partner", "Doorkliks", "Laatste klik"]}>
              {partnerTotalen.map((p) => (
                <tr key={p.partner} className="border-t border-lijn">
                  <Td>{p.partner}</Td>
                  <Td><span className="font-display font-bold text-bosgroen-dk">{p.aantal}</span></Td>
                  <Td>{p.laatste ? new Date(p.laatste).toLocaleString("nl-NL") : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}

      {tab === "nieuwsbrief" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat n={String(nieuwsbrief.length)} l="Inschrijvingen" />
          </div>
          <div className="card mb-4">
            <div className="font-display font-bold mb-1">Blog versturen naar inschrijvers</div>
            <p className="text-sm text-grijs mb-3">Stuurt het nieuwste blogartikel als nieuwsbrief. Nieuwe artikelen gaan ook automatisch de deur uit; met de knop kun je het handmatig doen.</p>
            <NieuwsbriefVerstuur aantal={nieuwsbrief.length} />
          </div>
          {nieuwsbrief.length === 0 ? (
            <div className="card text-grijs text-sm">Nog geen inschrijvingen.</div>
          ) : (
            <Table head={["E-mail", "Aangemeld"]}>
              {nieuwsbrief.map((l) => (
                <tr key={l.id} className="border-t border-lijn">
                  <Td>{l.email}</Td>
                  <Td>{new Date(l.datum).toLocaleDateString("nl-NL")}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}

function bronLabel(s?: string) {
  const m: Record<string, string> = { luyten: "Luyten", eigen: "Eigen", kolibri: "Kolibri", realworks: "Realworks" };
  return m[s || "eigen"] || s || "—";
}

function statusLabel(s: string) {
  if (s === "live") return <span className="text-bosgroen font-semibold">Live</span>;
  if (s === "wacht_op_betaling") return <span className="text-oranje-dk">Wacht op betaling</span>;
  return <span className="text-grijs">Concept</span>;
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="card">
      <div className="font-display font-extrabold text-2xl text-bosgroen-dk leading-none">{n}</div>
      <div className="text-sm text-grijs mt-1">{l}</div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="w-full text-sm min-w-[620px]">
        <thead>
          <tr className="bg-bosgroen text-white text-left">
            {head.map((h) => <th key={h} className="px-3.5 py-2.5 font-display font-semibold text-[0.84rem]">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3.5 py-2.5 align-top">{children}</td>;
}
