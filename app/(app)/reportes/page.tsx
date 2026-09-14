"use client";

import { fmtDate, fmtMoney } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function ReportesPage() {
  const { members, settings } = useGym();

  const monthRevenue = members.flatMap((m) => m.payments).filter((p) => p.date.startsWith("2026-09")).reduce((a, p) => a + p.amount, 0);
  const revenueData: [string, number][] = [
    ["Abr", 42000], ["May", 47000], ["Jun", 51000], ["Jul", 46000], ["Ago", 54000], ["Sep", monthRevenue],
  ];
  const maxRev = Math.max(...revenueData.map((r) => r[1]));

  const recentPayments = members
    .flatMap((m) => m.payments.map((p) => ({ ...p, memberName: m.name })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Reporte de ingresos</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Últimos 6 meses</div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 200, padding: "0 6px" }}>
          {revenueData.map(([month, amount]) => (
            <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{fmtMoney(amount, settings)}</div>
              <div style={{ width: "100%", maxWidth: 52, borderRadius: "8px 8px 0 0", background: "var(--primary)", height: `${Math.max(6, Math.round((amount / maxRev) * 100))}%` }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)" }}>{month}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Pagos recientes</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentPayments.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 4px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <div style={{ flex: 1, fontWeight: 700 }}>{p.memberName}</div>
              <div style={{ flex: 1, color: "var(--text-muted)" }}>{p.plan}</div>
              <div style={{ flex: 1, color: "var(--text-muted)" }}>{p.method}</div>
              <div style={{ width: 90, color: "var(--text-muted)" }}>{fmtDate(p.date, settings.locale)}</div>
              <div style={{ width: 100, textAlign: "right", fontWeight: 700 }}>{fmtMoney(p.amount, settings)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
