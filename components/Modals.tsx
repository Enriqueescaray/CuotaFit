"use client";

import { useState } from "react";
import { fmtDate, fmtMoney, genPin, Member, Plan, addMonths, PaymentMethod, REFERENCE_TODAY } from "@/lib/data";
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

// El PIN es siempre de 4 dígitos (el check-in acepta exactamente 4).
const sanitizePin = (v: string) => v.replace(/\D/g, "").slice(0, 4);

// Valida el PIN excluyendo al propio socio (para la edición) del control de duplicados.
function pinIsValid(pin: string, members: Member[], excludeId?: string): boolean {
  return /^\d{4}$/.test(pin) && !members.some((m) => m.pin === pin && m.id !== excludeId);
}

function pinError(pin: string, members: Member[], excludeId?: string): string | null {
  if (!pin) return null;
  if (members.some((m) => m.pin === pin && m.id !== excludeId)) return "Ese PIN ya lo usa otro socio. Elegí otro.";
  if (!/^\d{4}$/.test(pin)) return "El PIN debe tener exactamente 4 dígitos.";
  return null;
}

// Campo de PIN compartido por alta y edición de socios.
function PinField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error: string | null }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>PIN de acceso</div>
        <div onClick={() => onChange(genPin())} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}>Regenerar</div>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(sanitizePin(e.target.value))}
        inputMode="numeric"
        pattern="\d*"
        maxLength={4}
        placeholder="4 dígitos"
        style={{ ...inputStyle, fontSize: 18, fontWeight: 700, letterSpacing: "0.1em", borderColor: error ? "var(--red)" : "var(--border)" }}
      />
      {error && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--red)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export default function Modals() {
  const { modal } = useGym();
  if (!modal) return null;

  return (
    <ModalCard>
      {modal.type === "addMember" && <AddMemberForm />}
      {modal.type === "editMember" && <EditMemberForm memberId={modal.memberId} />}
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

const METHODS: PaymentMethod[] = ["Efectivo", "Transferencia"];

// Pestañas de dos opciones (mismo estilo que el selector de tipo de plan).
function Segmented<T extends string | boolean>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <div key={String(o.value)} onClick={() => onChange(o.value)} style={{ flex: 1, textAlign: "center", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`, background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary)" : "var(--text)" }}>
            {o.label}
          </div>
        );
      })}
    </div>
  );
}

// Plan + monto + método + resultado. Lo comparten "Agregar socio" (cobro en el alta)
// y "Registrar pago", para que el cobro se vea y se comporte igual en ambos.
function PaymentFields({ planId, onPlan, method, onMethod, planLabel }: { planId: string; onPlan: (id: string) => void; method: PaymentMethod; onMethod: (m: PaymentMethod) => void; planLabel: string }) {
  const { plans, settings } = useGym();
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const resultLabel = plan
    ? plan.type === "tiempo"
      ? `Vence el ${fmtDate(addMonths(REFERENCE_TODAY, plan.duration ?? 1), settings.locale)}`
      : `Se cargan ${plan.passCount} pases`
    : "";

  return (
    <>
      <div>
        <div style={labelStyle}>{planLabel}</div>
        <select value={planId} onChange={(e) => onPlan(e.target.value)} style={inputStyle}>
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
        <Segmented options={METHODS.map((m) => ({ value: m, label: m }))} value={method} onChange={onMethod} />
      </div>
      <div style={{ background: "var(--surface-alt)", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Resultado</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{resultLabel}</div>
      </div>
    </>
  );
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", background: "var(--red-soft)", borderRadius: 10, padding: "10px 12px" }}>{message}</div>;
}

// Alta de socio: solo el nombre. El plan se activa al registrar el cobro, así que acá se
// pregunta si ya pagó; si sí, el socio y su pago se crean juntos (y suman a reportes).
function AddMemberForm() {
  const { plans, members, addMember, closeModal } = useGym();
  const [name, setName] = useState("");
  const [pin, setPin] = useState(genPin());
  const [paidNow, setPaidNow] = useState(plans.length > 0);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && pinIsValid(pin, members) && (!paidNow || !!planId) && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const res = await addMember({ name, pin, charge: paidNow ? { planId, method } : undefined });
    setSaving(false);
    if (res.error) setError(res.error);
  }

  return (
    <>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Agregar socio</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Solo el nombre. El plan se activa cuando se registra el pago.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>Nombre completo</div>
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !paidNow && save()} placeholder="Ej. Ana Pérez" autoFocus style={inputStyle} />
        </div>
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>¿Ya pagó?</div>
          <Segmented
            options={[
              { value: true, label: "Sí, registrar pago" },
              { value: false, label: "Todavía no" },
            ]}
            value={paidNow}
            onChange={(v) => setPaidNow(v && plans.length > 0)}
          />
          {plans.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Todavía no hay planes cargados: creá uno en “Planes” para poder cobrar.</div>}
        </div>
        {paidNow ? (
          <PaymentFields planId={planId} onPlan={setPlanId} method={method} onMethod={setMethod} planLabel="Plan que contrata" />
        ) : (
          <div style={{ background: "var(--surface-alt)", borderRadius: 12, padding: 14, fontSize: 13, color: "var(--text-muted)" }}>
            El socio queda <b style={{ color: "var(--text)" }}>sin plan</b> y no se registra ningún cobro. Cuando pague, usá “Cobrar” (en el dashboard o en su ficha) y ahí se elige el plan.
          </div>
        )}
        <PinField value={pin} onChange={setPin} error={pinError(pin, members)} />
        <ErrorNote message={error} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={closeModal} style={ghostBtn}>Cancelar</button>
          <button onClick={save} disabled={!canSave} style={{ ...primaryBtn, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
            {saving ? "Guardando…" : paidNow ? "Guardar y cobrar" : "Guardar socio"}
          </button>
        </div>
      </div>
    </>
  );
}

function EditMemberForm({ memberId }: { memberId: string }) {
  const { members, editMember, closeModal } = useGym();
  const member = members.find((m) => m.id === memberId);
  const [form, setForm] = useState({
    name: member?.name ?? "",
    pin: member?.pin ?? "",
  });

  if (!member) return null;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const canSave = form.name.trim().length > 0 && pinIsValid(form.pin, members, memberId);

  return (
    <>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Editar socio</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>El plan se cambia desde “Registrar pago”.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>Nombre completo</div>
          <input value={form.name} onChange={set("name")} placeholder="Ej. Ana Pérez" style={inputStyle} />
        </div>
        <PinField value={form.pin} onChange={(pin) => setForm((f) => ({ ...f, pin }))} error={pinError(form.pin, members, memberId)} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={closeModal} style={ghostBtn}>Cancelar</button>
          <button onClick={() => canSave && editMember(memberId, form)} disabled={!canSave} style={{ ...primaryBtn, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>Guardar cambios</button>
        </div>
      </div>
    </>
  );
}

function PaymentForm({ memberId }: { memberId: string }) {
  const { members, plans, registerPayment, closeModal } = useGym();
  const member = members.find((m) => m.id === memberId);
  const initialPlan = plans.find((p) => p.name === member?.planName) ?? plans[0];
  const [planId, setPlanId] = useState(initialPlan?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!planId && !saving;

  // `saving` evita que un doble clic registre el mismo pago dos veces.
  async function confirm() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const res = await registerPayment(memberId, planId, method);
    setSaving(false);
    if (res.error) setError(res.error);
  }

  return (
    <>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Registrar pago</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{member?.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <PaymentFields planId={planId} onPlan={setPlanId} method={method} onMethod={setMethod} planLabel={member?.planName ? "Plan a renovar" : "Plan que contrata"} />
        <ErrorNote message={error} />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={closeModal} style={ghostBtn}>Cancelar</button>
          <button onClick={confirm} disabled={!canSave} style={{ ...primaryBtn, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>{saving ? "Registrando…" : "Confirmar pago"}</button>
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
