"use client";

import { fmtMoney } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function PlanesPage() {
  const { plans, settings, openAddPlan, openEditPlan } = useGym();
  const timePlans = plans.filter((p) => p.type === "tiempo");
  const passPlans = plans.filter((p) => p.type === "pases");

  const sectionLabel: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 };
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Planes</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Configuración de membresías</div>
        </div>
        <button onClick={openAddPlan} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Crear plan</button>
      </div>

      <div style={sectionLabel}>Planes por tiempo</div>
      <div style={{ ...grid, marginBottom: 26 }}>
        {timePlans.map((p) => (
          <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div onClick={() => openEditPlan(p.id)} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}>Editar</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.duration} mes{(p.duration ?? 0) > 1 ? "es" : ""}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>{fmtMoney(p.price, settings)}</div>
          </div>
        ))}
      </div>

      <div style={sectionLabel}>Planes por pases</div>
      <div style={grid}>
        {passPlans.map((p) => (
          <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div onClick={() => openEditPlan(p.id)} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}>Editar</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.passCount} pases · vigencia {p.validityDays} días</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>{fmtMoney(p.price, settings)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
