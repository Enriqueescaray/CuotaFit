"use client";

import { fmtDate, fmtMoney, REFERENCE_TODAY } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function ReportesPage() {
  const { members, settings } = useGym();

  // Ingresos reales de los últimos 6 meses, calculados desde los pagos.
  const allPayments = members.flatMap((m) => m.payments);
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(REFERENCE_TODAY.getFullYear(), REFERENCE_TODAY.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(settings.locale, { month: "short" });
    const amount = allPayments.filter((p) => p.date.startsWith(key)).reduce((a, p) => a + p.amount, 0);
    return { label, amount };
  });
  const maxRev = Math.max(0, ...revenueData.map((r) => r.amount));

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
        <div className="chart-scroll">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 200, padding: "0 6px" }}>
          {revenueData.map(({ label, amount }, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{fmtMoney(amount, settings)}</div>
              <div style={{ width: "100%", maxWidth: 52, borderRadius: "8px 8px 0 0", background: "var(--primary)", height: amount > 0 && maxRev > 0 ? `${Math.max(4, Math.round((amount / maxRev) * 100))}%` : "0%" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", textTransform: "capitalize" }}>{label}</div>
            </div>
          ))}
        </div>
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
