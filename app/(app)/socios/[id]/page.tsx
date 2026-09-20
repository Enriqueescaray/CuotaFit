"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { buildMonthGrid, fmtDate, fmtMoney, initials, MONTH_LABEL, WEEKDAY_LABELS } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { members, settings, statusFor, openPayment, openEditMember } = useGym();
  const m = members.find((x) => x.id === id);

  if (!m) {
    return (
      <div>
        <Link href="/socios" style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>← Volver a socios</Link>
        <div style={{ marginTop: 20, color: "var(--text-muted)" }}>Socio no encontrado.</div>
      </div>
    );
  }

  const status = statusFor(m);
  const passesPct = m.passesTotal ? `${Math.round(((m.passesLeft ?? 0) / m.passesTotal) * 100)}%` : "0%";
  const cells = buildMonthGrid();

  return (
    <>
      <Link href="/socios" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 16, textDecoration: "none" }}>← Volver a socios</Link>

      <div className="detail-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, textAlign: "center" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26, margin: "0 auto 14px" }}>{initials(m.name)}</div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{m.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{m.email}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.phone}</div>
            <div style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: status.bg, color: status.color, display: "inline-block", marginTop: 12 }}>{status.label}</div>

            <div style={{ background: "var(--surface-alt)", borderRadius: 12, padding: 14, marginTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>PIN de acceso</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "0.08em", color: "var(--primary)", marginTop: 4 }}>{m.pin}</div>
            </div>

            <button onClick={() => openEditMember(m.id)} style={{ width: "100%", marginTop: 14, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Editar socio</button>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>{m.planType === "tiempo" ? "Mensual" : "Pases"} · {m.planName}</div>
            {m.planType === "tiempo" ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{fmtDate(m.dueDate!, settings.locale)}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Fecha de vencimiento</div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{m.passesLeft} de {m.passesTotal}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>pases restantes</div>
                </div>
                <div style={{ height: 10, borderRadius: 20, background: "var(--surface-alt)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 20, background: status.color, width: passesPct }} />
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => openPayment(m.id)} style={{ flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Registrar pago</button>
              <button onClick={() => openPayment(m.id)} style={{ flex: 1, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Renovar</button>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Historial de pagos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {m.payments.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.plan}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtDate(p.date, settings.locale)} · {p.method}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{fmtMoney(p.amount, settings)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance calendar */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Asistencia · {MONTH_LABEL}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", background: "var(--primary-soft)", padding: "6px 12px", borderRadius: 20 }}>{m.attendanceDays.length} asistencias</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
            {WEEKDAY_LABELS.map((wd, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-faint)" }}>{wd}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} style={{ height: 34 }} />;
              const attended = m.attendanceDays.includes(day);
              return (
                <div key={i} style={{ height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: attended ? "var(--green)" : "var(--surface-alt)", color: attended ? "#fff" : "var(--text-muted)" }}>{day}</div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
