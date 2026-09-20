"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGym } from "@/lib/store";
import { createMyGym } from "@/app/actions/onboarding";
import { LogoMark, Wordmark } from "@/components/Logo";

export default function BienvenidaPage() {
  const { hydrated, authed, hasGym } = useGym();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sin sesión -> a login. Si ya tiene gimnasio -> al dashboard (nada que hacer acá).
  useEffect(() => {
    if (!hydrated) return;
    if (!authed) router.replace("/login");
    else if (hasGym) router.replace("/dashboard");
  }, [hydrated, authed, hasGym, router]);

  if (!hydrated || !authed || hasGym) return null;

  async function submit() {
    if (!name.trim() || pending) return;
    setError(null);
    setPending(true);
    const res = await createMyGym(name);
    if (res.error) {
      setPending(false);
      setError(res.error);
      return;
    }
    // Recarga completa (necesaria): el store no se entera del gimnasio recién creado
    // por sí solo; recargando, re-hidrata y AppShell ya lo ve con gym (si no, rebota acá).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/dashboard";
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 32, justifyContent: "center" }}>
          <LogoMark size={38} />
          <Wordmark size={24} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(15,23,41,0.08)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>¡Bienvenido! 🎉</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
            Solo falta un dato para crear tu cuenta con <strong>7 días de prueba gratis</strong>.
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>¿Cómo se llama tu gimnasio?</div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Ej: Iron House Gym"
            style={inputStyle}
          />
          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px", marginTop: 12 }}>{error}</div>
          )}
          <button
            onClick={submit}
            disabled={pending || !name.trim()}
            style={{ width: "100%", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: pending || !name.trim() ? "default" : "pointer", opacity: pending || !name.trim() ? 0.6 : 1, marginTop: 18 }}
          >
            {pending ? "Creando tu cuenta..." : "Crear mi cuenta"}
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-faint)", marginTop: 20 }}>Cuotafit · sin tarjeta de crédito</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  color: "var(--text)",
  fontSize: 14,
};
