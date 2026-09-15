"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminData, AdminGym, createGymAsAdmin, getAdminData, resetGymOwnerPassword, setGymSubscription, SubscriptionStatus } from "@/app/actions/admin";
import { useGym } from "@/lib/store";
import { daysDiff, subscriptionGate } from "@/lib/data";
import { LogoMark, Wordmark } from "@/components/Logo";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--surface-alt)", color: "var(--text)", fontSize: 14, boxSizing: "border-box",
};

// Estado "efectivo" que ve el admin: incluye el vencimiento automático (trial o pago) además
// de la suspensión manual, así una cuenta que dejó de pagar aparece como "Vencido" sola.
function effMeta(g: Pick<AdminGym, "subscriptionStatus" | "paidUntil">): { label: string; bg: string; color: string } {
  const { reason } = subscriptionGate(g);
  if (reason === "suspended") return { label: "Suspendido", bg: "var(--red-soft)", color: "var(--red)" };
  if (reason === "expired") return { label: "Vencido", bg: "var(--red-soft)", color: "var(--red)" };
  if (g.subscriptionStatus === "trial") return { label: "Prueba", bg: "var(--amber-soft)", color: "var(--amber)" };
  return { label: "Activo", bg: "var(--green-soft)", color: "var(--green)" };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function plus30ISO() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const { login, logout } = useGym();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);

  async function doLogout() {
    await logout();
    router.push("/login");
  }
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newPw, setNewPw] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ gymName: "", ownerEmail: "", password: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<{ email: string; password: string } | null>(null);

  const refresh = useCallback(async () => {
    setData(await getAdminData());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function submitLogin() {
    setError(null);
    setBusy(true);
    const { error: e } = await login(email, password);
    if (e) {
      setError("Email o contraseña incorrectos.");
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
  }

  async function updateGym(gymId: string, status: SubscriptionStatus, paidUntil?: string | null) {
    setBusy(true);
    await setGymSubscription(gymId, status, paidUntil);
    await refresh();
    setBusy(false);
  }

  async function resetPassword(gymId: string) {
    setBusy(true);
    const res = await resetGymOwnerPassword(gymId);
    if (res.password) setNewPw((p) => ({ ...p, [gymId]: res.password! }));
    setBusy(false);
  }

  async function createGym() {
    setCreateError(null);
    setBusy(true);
    const res = await createGymAsAdmin(createForm);
    setBusy(false);
    if (res.error) {
      setCreateError(res.error);
      return;
    }
    setCreateResult({ email: res.email!, password: res.password! });
    setCreateForm({ gymName: "", ownerEmail: "", password: "" });
    await refresh();
  }

  // --- Loading ---
  if (!data) {
    return <Centered><div style={{ color: "var(--text-muted)", fontSize: 14 }}>Cargando…</div></Centered>;
  }

  // --- Not logged in ---
  if (!data.authed) {
    return (
      <Centered>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 28, justifyContent: "center" }}>
            <LogoMark size={34} />
            <Wordmark size={22} />
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32 }}>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Panel de administración</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Acceso exclusivo del administrador de Cuotafit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitLogin()} style={inputStyle} />
              {error && <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
              <button onClick={submitLogin} disabled={busy} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
                {busy ? "Ingresando…" : "Ingresar"}
              </button>
            </div>
          </div>
        </div>
      </Centered>
    );
  }

  // --- Logged in but not an admin ---
  if (!data.isAdmin) {
    return (
      <Centered>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Acceso denegado</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>La cuenta {data.email} no es administrador de Cuotafit.</div>
          <button onClick={doLogout} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar sesión</button>
        </div>
      </Centered>
    );
  }

  // --- Admin dashboard ---
  const gyms = data.gyms ?? [];
  const activos = gyms.filter((g) => !subscriptionGate(g).blocked).length;
  const bloqueados = gyms.filter((g) => subscriptionGate(g).blocked).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 32px 60px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <LogoMark size={34} />
            <div>
              <div style={{ lineHeight: 1.1 }}><Wordmark size={20} /></div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Panel de administración</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{data.email}</div>
            <button onClick={doLogout} style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Salir</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
          <KpiCard label="Gimnasios" value={String(gyms.length)} />
          <KpiCard label="Habilitados" value={String(activos)} color="var(--green)" />
          <KpiCard label="Bloqueados" value={String(bloqueados)} color={bloqueados ? "var(--red)" : undefined} />
        </div>

        {/* Crear gimnasio */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={() => { setShowCreate((s) => !s); setCreateError(null); }} style={{ background: showCreate ? "var(--surface)" : "var(--primary)", color: showCreate ? "var(--text)" : "#fff", border: showCreate ? "1px solid var(--border)" : "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {showCreate ? "Cancelar" : "+ Crear gimnasio"}
          </button>
        </div>

        {showCreate && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Nuevo gimnasio</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nombre del gimnasio</div>
                <input value={createForm.gymName} onChange={(e) => setCreateForm((f) => ({ ...f, gymName: e.target.value }))} placeholder="Ej. PowerFit" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email del dueño</div>
                <input value={createForm.ownerEmail} onChange={(e) => setCreateForm((f) => ({ ...f, ownerEmail: e.target.value }))} placeholder="correo@mail.com" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contraseña (opcional)</div>
                <input value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="En blanco = se genera" style={inputStyle} />
              </div>
            </div>
            {createError && <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px", marginTop: 12 }}>{createError}</div>}
            <div style={{ marginTop: 14 }}>
              <button onClick={createGym} disabled={busy} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>Crear gimnasio</button>
            </div>
          </div>
        )}

        {createResult && (
          <div style={{ background: "var(--green-soft)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Gimnasio creado</div>
            <div style={{ fontSize: 13, color: "var(--text)" }}>Credenciales (copialas y pasáselas al gimnasio; la contraseña no se vuelve a mostrar):</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, marginTop: 6 }}>Email: <b>{createResult.email}</b><br />Contraseña: <b>{createResult.password}</b></div>
          </div>
        )}

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 8 }}>
          {gyms.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Todavía no hay gimnasios registrados.</div>}
          {gyms.map((g) => {
            const meta = effMeta(g);
            const gate = subscriptionGate(g);
            const daysLeft = g.paidUntil ? daysDiff(g.paidUntil) : null;
            const trialHint =
              g.subscriptionStatus === "trial" && !gate.blocked && daysLeft !== null
                ? daysLeft === 0 ? "vence hoy" : `quedan ${daysLeft} día${daysLeft === 1 ? "" : "s"}`
                : null;
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 12px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{g.memberCount} socios · alta {fmtDate(g.createdAt.slice(0, 10))}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Login: <span style={{ color: "var(--text)", fontWeight: 600 }}>{g.ownerEmail ?? "—"}</span></div>
                  {newPw[g.id] && (
                    <div style={{ marginTop: 6, fontSize: 12, background: "var(--amber-soft)", color: "var(--amber)", borderRadius: 8, padding: "6px 10px" }}>
                      Nueva contraseña: <b style={{ fontFamily: "monospace" }}>{newPw[g.id]}</b> — copiala, no se vuelve a mostrar.
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20, background: meta.bg, color: meta.color }}>{meta.label}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", width: 130 }}>
                  Paga hasta: <span style={{ color: "var(--text)", fontWeight: 600 }}>{fmtDate(g.paidUntil)}</span>
                  {trialHint && <span style={{ display: "block", fontSize: 11, color: "var(--amber)", fontWeight: 600 }}>Prueba: {trialHint}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button disabled={busy} onClick={() => updateGym(g.id, "active", plus30ISO())} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Marcar pagado +30d</button>
                  <button disabled={busy} onClick={() => updateGym(g.id, "suspended")} style={{ background: "var(--surface)", color: "var(--red)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Suspender</button>
                  <button disabled={busy} onClick={() => resetPassword(g.id)} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Restablecer contraseña</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>{children}</div>;
}

function KpiCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? "var(--text)" }}>{value}</div>
    </div>
  );
}
