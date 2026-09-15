"use client";

import { useRouter } from "next/navigation";
import { fmtMoney, initials, REFERENCE_TODAY } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function DashboardPage() {
  const { members, settings, statusFor, openPayment } = useGym();
  const router = useRouter();

  const view = members.map((m) => ({ m, status: statusFor(m) }));
  const activeCount = view.filter((x) => x.status.level !== "danger").length;
  const expiredCount = view.filter((x) => x.status.level === "danger").length;
  const monthKey = `${REFERENCE_TODAY.getFullYear()}-${String(REFERENCE_TODAY.getMonth() + 1).padStart(2, "0")}`;
  const monthName = REFERENCE_TODAY.toLocaleDateString(settings.locale, { month: "long" });
  const monthRevenue = members.flatMap((m) => m.payments).filter((p) => p.date.startsWith(monthKey)).reduce((a, p) => a + p.amount, 0);
  const todayCheckins = members.filter((m) => m.attendanceDays.includes(REFERENCE_TODAY.getDate())).length;

  const kpis = [
    { label: "Socios activos", value: String(activeCount), sub: `${members.length} en total`, subColor: "var(--text-muted)" },
    { label: "Vencidos / sin pases", value: String(expiredCount), sub: expiredCount ? "Requieren cobro" : "Todo en orden", subColor: expiredCount ? "var(--red)" : "var(--green)" },
    { label: "Ingresos del mes", value: fmtMoney(monthRevenue, settings), sub: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} (parcial)`, subColor: "var(--text-muted)" },
    { label: "Check-ins de hoy", value: String(todayCheckins), sub: REFERENCE_TODAY.toLocaleDateString(settings.locale, { day: "2-digit", month: "long" }), subColor: "var(--text-muted)" },
  ];

  const alerts = view
    .filter((x) => x.status.level !== "ok")
    .sort((a, b) => (a.status.level === "danger" ? -1 : 1) - (b.status.level === "danger" ? -1 : 1));

  const todayLabel = REFERENCE_TODAY.toLocaleDateString(settings.locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Resumen de hoy, {todayLabel}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(15,23,41,0.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.subColor, fontWeight: 600, marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Socios que necesitan atención</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{alerts.length} socios</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {alerts.length === 0 && (
            <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Todos los socios están al día.</div>
          )}
          {alerts.map(({ m, status }) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderRadius: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flex: "none" }}>{initials(m.name)}</div>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => router.push(`/socios/${m.id}`)}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{status.sub}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20, background: status.bg, color: status.color, flex: "none" }}>{status.label}</div>
              <button onClick={() => openPayment(m.id)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", flex: "none" }}>Cobrar</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
