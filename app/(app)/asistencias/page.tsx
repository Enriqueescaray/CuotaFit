"use client";

import { useState } from "react";
import { buildMonthGrid, MONTH_LABEL, WEEKDAY_LABELS } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function AsistenciasPage() {
  const { members } = useGym();
  const [memberId, setMemberId] = useState<string>("all");
  const cells = buildMonthGrid();
  const selected = members.find((m) => m.id === memberId);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Asistencias</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{MONTH_LABEL}</div>
        </div>
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 }}>
          <option value="all">Todo el gimnasio</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 8 }}>
          {WEEKDAY_LABELS.map((wd, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--text-faint)" }}>{wd}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={i} style={{ height: 56 }} />;
            if (memberId === "all") {
              const count = members.filter((m) => m.attendanceDays.includes(day)).length;
              return (
                <div key={i} style={{ height: 56, borderRadius: 10, padding: 8, fontSize: 13, fontWeight: 700, background: count > 0 ? "var(--primary-soft)" : "var(--surface-alt)", color: count > 0 ? "var(--primary)" : "var(--text-faint)" }}>
                  <div>{day}</div>
                  {count > 0 && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{count} check-in{count === 1 ? "" : "s"}</div>}
                </div>
              );
            }
            const attended = selected?.attendanceDays.includes(day);
            return (
              <div key={i} style={{ height: 56, borderRadius: 10, padding: 8, fontSize: 13, fontWeight: 700, background: attended ? "var(--green)" : "var(--surface-alt)", color: attended ? "#fff" : "var(--text-faint)" }}>{day}</div>
            );
          })}
        </div>
      </div>
    </>
  );
}
