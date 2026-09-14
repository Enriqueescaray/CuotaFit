"use client";

import { useRouter } from "next/navigation";
import { initials } from "@/lib/data";
import { useGym } from "@/lib/store";

export default function SociosPage() {
  const { members, search, setSearch, statusFor, openAddMember } = useGym();
  const router = useRouter();

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) => !q || m.name.toLowerCase().includes(q) || m.pin.includes(q));

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Socios</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{members.length} socios registrados</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o PIN..." style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, width: 230 }} />
          <button onClick={openAddMember} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Agregar socio</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {filtered.map((m) => {
          const status = statusFor(m);
          const planTypeLabel = m.planType === "tiempo" ? "Mensual" : "Pases";
          return (
            <div key={m.id} onClick={() => router.push(`/socios/${m.id}`)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flex: "none" }}>{initials(m.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PIN {m.pin}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "var(--surface-alt)", color: "var(--text-muted)" }}>{planTypeLabel}</div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: status.bg, color: status.color }}>{status.label}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{status.sub}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
