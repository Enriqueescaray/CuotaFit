"use client";

import { useRouter } from "next/navigation";
import { daysDiff, EXPIRING_DAYS, EXPIRING_PASSES, fmtMoney, initials, Member, MemberStatus, REFERENCE_TODAY } from "@/lib/data";
import { useGym } from "@/lib/store";

type Row = { m: Member; status: MemberStatus };

// Qué tan cerca está de vencer: días que le faltan (por tiempo) o pases que le quedan.
const urgency = (m: Member) => (m.planType === "tiempo" ? (m.dueDate ? daysDiff(m.dueDate) : 0) : m.passesLeft ?? 0);

function MemberPanel({ title, hint, rows, empty, action, onOpen, onAction }: {
  title: string;
  hint: string;
  rows: Row[];
  empty: string;
  action: string;
  onOpen: (id: string) => void;
  onAction: (id: string) => void;
}) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, alignSelf: "start" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, flex: "none" }}>{rows.length} {rows.length === 1 ? "socio" : "socios"}</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>{hint}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.length === 0 && (
          <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{empty}</div>
        )}
        {rows.map(({ m, status }) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderRadius: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flex: "none" }}>{initials(m.name)}</div>
            <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onOpen(m.id)}>
              <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: status.color, fontWeight: 600, marginTop: 1 }}>{status.sub}</div>
            </div>
            <button onClick={() => onAction(m.id)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", flex: "none" }}>{action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  // Por vencer (≤ 3 días o ≤ 3 pases): los más urgentes primero.
  const expiring = view.filter((x) => x.status.level === "warn").sort((a, b) => urgency(a.m) - urgency(b.m));
  // Ya vencidos, sin pases o sin plan: requieren cobro.
  const overdue = view.filter((x) => x.status.level === "danger");

  const todayLabel = REFERENCE_TODAY.toLocaleDateString(settings.locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Resumen de hoy, {todayLabel}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(15,23,41,0.05)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.subColor, fontWeight: 600, marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: 16 }}>
        <MemberPanel
          title="Próximos a vencer"
          hint={`Hasta ${EXPIRING_DAYS} días para vencer o ${EXPIRING_PASSES} pases restantes`}
          rows={expiring}
          empty="Nadie está por vencer en estos días."
          action="Renovar"
          onOpen={(id) => router.push(`/socios/${id}`)}
          onAction={openPayment}
        />
        <MemberPanel
          title="Requieren cobro"
          hint="Vencidos, sin pases o sin plan"
          rows={overdue}
          empty="Todos los socios están al día."
          action="Cobrar"
          onOpen={(id) => router.push(`/socios/${id}`)}
          onAction={openPayment}
        />
      </div>
    </>
  );
}
