"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Live klok + automatische verversing voor het Jarvis-dashboard.
// Elke seconde de klok bijwerken, elke 60s de serverdata soft-refreshen.
export function DashboardKlok() {
  const router = useRouter();
  const [tijd, setTijd] = useState("");
  const [datum, setDatum] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTijd(d.toLocaleTimeString("nl-NL"));
      setDatum(d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }));
    };
    tick();
    const t = setInterval(tick, 1000);
    const r = setInterval(() => router.refresh(), 60000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, [router]);

  return (
    <div style={{ textAlign: "right", lineHeight: 1.2 }}>
      <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>{tijd || "--:--:--"}</div>
      <div style={{ fontSize: 13, color: "#7CAE86", textTransform: "capitalize" }}>{datum}</div>
    </div>
  );
}
