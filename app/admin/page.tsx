"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminData, getAdminData, resetGymOwnerPassword, setGymSubscription, SubscriptionStatus } from "@/app/actions/admin";
import { useGym } from "@/lib/store";
import { LogoMark, Wordmark } from "@/components/Logo";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--surface-alt)", color: "var(--text)", fontSize: 14, boxSizing: "border-box",
};

const STATUS_META: Record<SubscriptionStatus, { label: string; bg: string; color: string }> = {
  active: { label: "Activo", bg: "var(--green-soft)", color: "var(--green)" },
  trial: { label: "Prueba", bg: "var(--amber-soft)", color: "var(--amber)" },
  suspended: { label: "Suspendido", bg: "var(--red-soft)", color: "var(--red)" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function plus30ISO() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const { login, logout } = useGym();
  const [data, setData] = useState<AdminData | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newPw, setNewPw] = useState<Record<string, string>>({});

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

  // --- Loading ---
  if (!data) {
    return <Centered><div style={{ color: "var(--text-muted)", fontSize: 14 }}>Cargando…</div></Centered>;
  }

  // --- Not logged in ---
  if (!data.authed) {
    return (
      <Centered>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 28, justifyContent: "center" }}>
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
          <button onClick={async () => { await logout(); await refresh(); }} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar sesión</button>
        </div>
      </Centered>
    );
  }

  // --- Admin dashboard ---
  const gyms = data.gyms ?? [];
  const activos = gyms.filter((g) => g.subscriptionStatus === "active").length;
  const suspendidos = gyms.filter((g) => g.subscriptionStatus === "suspended").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 32px 60px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <LogoMark size={34} />
            <div>
              <div style={{ lineHeight: 1.1 }}><Wordmark size={20} /></div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Panel de administración</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{data.email}</div>
            <button onClick={async () => { await logout(); await refresh(); }} style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Salir</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
          <KpiCard label="Gimnasios" value={String(gyms.length)} />
          <KpiCard label="Pagando (activos)" value={String(activos)} color="var(--green)" />
          <KpiCard label="Suspendidos" value={String(suspendidos)} color={suspendidos ? "var(--red)" : undefined} />
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 8 }}>
          {gyms.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Todavía no hay gimnasios registrados.</div>}
          {gyms.map((g) => {
            const meta = STATUS_META[g.subscriptionStatus];
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
                <div style={{ fontSize: 13, color: "var(--text-muted)", width: 130 }}>Paga hasta: <span style={{ color: "var(--text)", fontWeight: 600 }}>{fmtDate(g.paidUntil)}</span></div>
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
