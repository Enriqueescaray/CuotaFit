"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { newPasswordErrorMessage } from "@/lib/auth-errors";
import { AuthCard, AuthError, authButtonStyle, authInputStyle, authLabelStyle } from "@/components/AuthCard";

// Destino del link de recuperación: /auth/callback ya canjeó el código, así que acá
// hay sesión y alcanza con guardar la contraseña nueva.
export default function NuevaContrasenaPage() {
  const supabase = createClient();
  const [status, setStatus] = useState<"checking" | "ready" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setStatus(data.session ? "ready" : "expired"));
  }, [supabase]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (password !== repeat) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPending(false);
      setError(newPasswordErrorMessage(error));
      return;
    }
    // Recarga completa, igual que en el registro: el store re-hidrata la sesión y
    // AppShell manda a cada uno a su lugar (panel, /admin o /bienvenida).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/dashboard";
  }

  if (status === "checking") return null;

  if (status === "expired") {
    return (
      <AuthCard title="Este link ya no sirve" subtitle="Pedí uno nuevo para cambiar tu contraseña.">
        <Link href="/recuperar" style={{ ...authButtonStyle, display: "block", textAlign: "center", textDecoration: "none" }}>Pedir otro link</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Creá tu contraseña nueva" subtitle="Usá al menos 6 caracteres.">
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="password" style={authLabelStyle}>Contraseña nueva</label>
          <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={authInputStyle} />
        </div>
        <div>
          <label htmlFor="repeat" style={authLabelStyle}>Repetí la contraseña</label>
          <input id="repeat" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} style={authInputStyle} />
        </div>
        {error && <AuthError>{error}</AuthError>}
        <button type="submit" disabled={pending} style={{ ...authButtonStyle, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </AuthCard>
  );
}
