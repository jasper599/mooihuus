import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { berekenStats } from "@/lib/stats";
import { euro } from "@/lib/money";
import { DashboardKlok } from "@/components/DashboardKlok";

export const dynamic = "force-dynamic";

// Jarvis-achtig controlecentrum met de live kerncijfers van Mooihuus.
// Donker thema, bosgroen-glow, auto-ververst elke 60s. Bedoeld om fullscreen
// op een kantoorscherm te tonen. Alleen voor beheerders.
export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "beheerder") redirect("/inloggen");

  const s = berekenStats();
  const maxBron = Math.max(1, ...s.woningen.perBron.map((b) => b.aantal));
  const koopHuurTot = Math.max(1, s.woningen.koop + s.woningen.huur);

  const css = `
  .jv{min-height:100vh;background:radial-gradient(1200px 700px at 70% -10%, #113524 0%, #0a1710 45%, #060d09 100%);color:#E8F3EA;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:28px 32px 40px;box-sizing:border-box;}
  .jv *{box-sizing:border-box;}
  .jv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid rgba(124,174,134,.18);padding-bottom:18px;margin-bottom:24px;}
  .jv-brand{display:flex;align-items:center;gap:14px;}
  .jv-dot{width:14px;height:14px;border-radius:50%;background:#7CAE86;box-shadow:0 0 14px 3px rgba(124,174,134,.9);animation:jvpulse 2s infinite ease-in-out;}
  @keyframes jvpulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}
  .jv-title{font-size:13px;letter-spacing:4px;color:#7CAE86;text-transform:uppercase;}
  .jv-title b{display:block;font-size:26px;letter-spacing:2px;color:#fff;font-weight:800;}
  .jv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px;}
  .jv-grid2{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:16px;}
  .jv-card{background:linear-gradient(180deg, rgba(20,42,30,.75), rgba(10,23,16,.75));border:1px solid rgba(124,174,134,.18);border-radius:18px;padding:20px 22px;backdrop-filter:blur(4px);}
  .jv-k{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8FB79A;margin-bottom:10px;}
  .jv-big{font-size:52px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 22px rgba(124,174,134,.45);}
  .jv-sub{margin-top:8px;font-size:13px;color:#9FC2A8;}
  .jv-accent .jv-big{color:#F2A765;text-shadow:0 0 22px rgba(232,130,59,.4);}
  .jv-row{display:flex;justify-content:space-between;align-items:center;margin:9px 0;font-size:14px;}
  .jv-bar{height:9px;border-radius:6px;background:rgba(124,174,134,.14);overflow:hidden;margin-top:4px;}
  .jv-bar>span{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#2C6B45,#7CAE86);box-shadow:0 0 10px rgba(124,174,134,.5);}
  .jv-num{font-variant-numeric:tabular-nums;font-weight:700;color:#fff;}
  .jv-split{display:flex;height:16px;border-radius:8px;overflow:hidden;margin-top:6px;border:1px solid rgba(124,174,134,.2);}
  .jv-mini{display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-bottom:1px solid rgba(124,174,134,.1);}
  .jv-mini:last-child{border-bottom:0;}
  .jv-foot{margin-top:22px;font-size:12px;color:#6E8C78;display:flex;justify-content:space-between;align-items:center;}
  @media(max-width:1100px){.jv-grid{grid-template-columns:repeat(2,1fr);}.jv-grid2{grid-template-columns:1fr;}}
  `;

  return (
    <div className="jv">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="jv-head">
        <div className="jv-brand">
          <span className="jv-dot" />
          <div className="jv-title">
            Mooihuus<b>Controlecentrum</b>
          </div>
        </div>
        <DashboardKlok />
      </div>

      {/* Hero KPI's */}
      <div className="jv-grid">
        <div className="jv-card">
          <div className="jv-k">Woningen live</div>
          <div className="jv-big">{s.woningen.live}</div>
          <div className="jv-sub">{s.woningen.totaal} totaal in systeem</div>
        </div>
        <div className="jv-card jv-accent">
          <div className="jv-k">Leads deze week</div>
          <div className="jv-big">{s.leads.week}</div>
          <div className="jv-sub">{s.leads.maand} deze maand · {s.leads.totaal} totaal</div>
        </div>
        <div className="jv-card">
          <div className="jv-k">Bezoekers (7 dagen)</div>
          <div className="jv-big">{s.bezoekers.week.toLocaleString("nl-NL")}</div>
          <div className="jv-sub">{s.bezoekers.vandaag.toLocaleString("nl-NL")} vandaag</div>
        </div>
        <div className="jv-card jv-accent">
          <div className="jv-k">Omzet deze maand</div>
          <div className="jv-big">{euro(s.omzet.maand)}</div>
          <div className="jv-sub">{euro(s.omzet.totaal)} totaal</div>
        </div>
      </div>

      {/* Detail */}
      <div className="jv-grid2">
        <div className="jv-card">
          <div className="jv-k">Aanbod per bron</div>
          {s.woningen.perBron.length === 0 && <div className="jv-sub">Nog geen live aanbod.</div>}
          {s.woningen.perBron.map((b) => (
            <div key={b.bron} style={{ marginBottom: 12 }}>
              <div className="jv-row" style={{ margin: 0 }}>
                <span>{b.bron}</span>
                <span className="jv-num">{b.aantal}</span>
              </div>
              <div className="jv-bar">
                <span style={{ width: `${Math.round((b.aantal / maxBron) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="jv-card">
          <div className="jv-k">Koop vs. huur</div>
          <div className="jv-split">
            <div style={{ width: `${(s.woningen.koop / koopHuurTot) * 100}%`, background: "linear-gradient(90deg,#2C6B45,#7CAE86)" }} />
            <div style={{ width: `${(s.woningen.huur / koopHuurTot) * 100}%`, background: "linear-gradient(90deg,#C9691F,#E8823B)" }} />
          </div>
          <div className="jv-row" style={{ marginTop: 12 }}>
            <span>🟢 Te koop</span>
            <span className="jv-num">{s.woningen.koop}</span>
          </div>
          <div className="jv-row">
            <span>🟠 Te huur</span>
            <span className="jv-num">{s.woningen.huur}</span>
          </div>
          <div className="jv-row">
            <span>⭐ Uitgelicht</span>
            <span className="jv-num">{s.woningen.uitgelicht}</span>
          </div>
        </div>

        <div className="jv-card">
          <div className="jv-k">Netwerk</div>
          <div className="jv-mini"><span>Gebruikers</span><span className="jv-num">{s.gebruikers.totaal}</span></div>
          <div className="jv-mini"><span>— waarvan makelaars/bedrijf</span><span className="jv-num">{s.gebruikers.zakelijk}</span></div>
          <div className="jv-mini"><span>Nieuwsbriefleden</span><span className="jv-num">{s.nieuwsbrief.toLocaleString("nl-NL")}</span></div>
          <div className="jv-mini"><span>Social in wachtrij</span><span className="jv-num">{s.social.wachtrij}</span></div>
          <div className="jv-mini">
            <span>Reviews</span>
            <span className="jv-num">{s.reviews.goedgekeurd} · ★ {s.reviews.gemiddeld.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="jv-foot">
        <span>● Live · ververst automatisch elke 60 seconden</span>
        <span>Mooihuus.nl · controlecentrum</span>
      </div>
    </div>
  );
}
