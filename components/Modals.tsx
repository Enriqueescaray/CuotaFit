"use client";

import { useEffect, useState } from "react";
import { fmtDate, fmtMoney, genPin, Plan, addMonths, PaymentMethod, REFERENCE_TODAY } from "@/lib/data";
import { PlanFormInput, useGym } from "@/lib/store";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--surface)", color: "var(--text)", fontSize: 14, boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6 };
const primaryBtn: React.CSSProperties = { flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { flex: 1, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" };

function planOptionLabel(p: Plan, settings: Parameters<typeof fmtMoney>[1]) {
  return p.type === "tiempo"
    ? `${p.name} · ${fmtMoney(p.price, settings)}`
    : `${p.name} (${p.passCount} pases) · ${fmtMoney(p.price, settings)}`;
}

export default function Modals() {
  const { modal } = useGym();
  if (!modal) return null;

  return (
    <ModalCard>
      {modal.type === "addMember" && <AddMemberForm />}
      {modal.type === "payment" && <PaymentForm memberId={modal.memberId} />}
      {modal.type === "plan" && <PlanForm planId={modal.planId} />}
    </ModalCard>
  );
}

function ModalCard({ children }: { children: React.ReactNode }) {
  const { closeModal } = useGym();
  return (
    <div
      onClick={closeModal}
      style={{ position: "fixed", inset: 0, background: "rgba(10,14,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        {children}
      </div>
    </div>
  );
}

function AddMemberForm() {
  const { plans, settings, addMember, closeModal } = useGym();
  const [form, setForm] = useState({ name: "", email: "", phone: "", planId: plans[0]?.id ?? "", pin: genPin() });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Agregar socio</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Completá los datos y el plan inicial</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>Nombre completo</div>
          <input value={form.name} onChange={set("name")} placeholder="Ej. Ana Pérez" style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Email</div>
            <input value={form.email} onChange={set("email")} placeholder="correo@mail.com" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Teléfono</div>
            <input value={form.phone} onChange={set("phone")} placeholder="+52 55..." style={inputStyle} />
          </div>
        </div>
        <div>
          <div style={labelStyle}>Plan</div>
          <select value={form.planId} onChange={set("planId")} style={inputStyle}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{planOptionLabel(p, settings)}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>PIN de acceso</div>
            <div onClick={() => setForm((f) => ({ ...f, pin: genPin() }))} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}>Regenerar</div>
          </div>
          <input value={form.pin} onChange={set("pin")} style={{ ...inputStyle, fontSize: 18, fontWeight: 700, letterSpacing: "0.1em" }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={closeModal} style={ghostBtn}>Cancelar</button>
          <button onClick={() => addMember(form)} style={primaryBtn}>Guardar socio</button>
        </div>
      </div>
    </>
  );
}

function PaymentForm({ memberId }: { memberId: string }) {
  const { members, plans, settings, registerPayment, closeModal } = useGym();
  const member = members.find((m) => m.id === memberId);
  const initialPlan = plans.find((p) => p.name === member?.planName) ?? plans[0];
  const [planId, setPlanId] = useState(initialPlan?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");

  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const resultLabel = plan
    ? plan.type === "tiempo"
      ? `Nueva fecha de vencimiento: ${fmtDate(addMonths(REFERENCE_TODAY, plan.duration ?? 1), settings.locale)}`
      : `Se recargan ${plan.passCount} pases`
    : "";

  return (
    <>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Registrar pago</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{member?.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>Plan a renovar</div>
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} style={inputStyle}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{planOptionLabel(p, settings)}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Monto</div>
          <input value={fmtMoney(plan?.price ?? 0, settings)} readOnly style={{ ...inputStyle, background: "var(--surface-alt)", fontSize: 16, fontWeight: 700 }} />
        </div>
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Método de pago</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["Efectivo", "Transferencia"] as PaymentMethod[]).map((pm) => {
              const on = method === pm;
              return (
                <div key={pm} onClick={() => setMethod(pm)} style={{ flex: 1, textAlign: "center", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`, background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary)" : "var(--text)" }}>
                  {pm}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: "var(--surface-alt)", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Resultado</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{resultLabel}</div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={closeModal} style={ghostBtn}>Cancelar</button>
          <button onClick={() => registerPayment(memberId, planId, method)} style={primaryBtn}>Confirmar pago</button>
        </div>
      </div>
    </>
  );
}

function PlanForm({ planId }: { planId?: string }) {
  const { plans, savePlan, deletePlan, closeModal } = useGym();
  const editing = plans.find((p) => p.id === planId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<PlanFormInput>({
    type: editing?.type ?? "tiempo",
    name: editing?.name ?? "",
    duration: String(editing?.duration ?? 1),
    passCount: String(editing?.passCount ?? 10),
    validityDays: String(editing?.validityDays ?? 30),
    price: editing ? String(editing.price) : "",
  });

  const set = (field: keyof PlanFormInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const typeTab = (t: PlanFormInput["type"], label: string) => {
    const on = form.type === t;
    return (
      <div onClick={() => setForm((f) => ({ ...f, type: t }))} style={{ flex: 1, textAlign: "center", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`, background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary)" : "var(--text)" }}>
        {label}
      </div>
    );
  };

  return (
    <>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>{editing ? "Editar plan" : "Crear plan"}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {typeTab("tiempo", "Por tiempo")}
        {typeTab("pases", "Por pases")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>Nombre del plan</div>
          <input value={form.name} onChange={set("name")} placeholder="Ej. Mensual" style={inputStyle} />
        </div>
        {form.type === "tiempo" ? (
          <div>
            <div style={labelStyle}>Duración (meses)</div>
            <input value={form.duration} onChange={set("duration")} style={inputStyle} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Cantidad de pases</div>
              <input value={form.passCount} onChange={set("passCount")} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Vigencia (días)</div>
              <input value={form.validityDays} onChange={set("validityDays")} style={inputStyle} />
            </div>
          </div>
        )}
        <div>
          <div style={labelStyle}>Precio</div>
          <input value={form.price} onChange={set("price")} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={closeModal} style={ghostBtn}>Cancelar</button>
          <button onClick={() => savePlan(form, editing?.id)} style={primaryBtn}>Guardar plan</button>
        </div>

        {editing && (
          confirmDelete ? (
            <div style={{ marginTop: 4, padding: 14, borderRadius: 12, background: "var(--red-soft)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", marginBottom: 10 }}>¿Eliminar el plan &quot;{editing.name}&quot;? Los socios ya asignados no se modifican.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmDelete(false)} style={ghostBtn}>Cancelar</button>
                <button onClick={() => deletePlan(editing.id)} style={{ ...primaryBtn, background: "var(--red)" }}>Sí, eliminar</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setConfirmDelete(true)} style={{ textAlign: "center", marginTop: 4, fontSize: 13, fontWeight: 700, color: "var(--red)", cursor: "pointer", padding: 8 }}>
              Eliminar plan
            </div>
          )
        )}
      </div>
    </>
  );
}
