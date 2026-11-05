"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recoveryErrorMessage } from "@/lib/auth-errors";
import { AuthCard, AuthError, authButtonStyle, authInputStyle, authLabelStyle } from "@/components/AuthCard";

export function RecuperarForm({ linkFailed }: { linkFailed: boolean }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(
    linkFailed ? "Ese link venció o se abrió en otro navegador. Pedí uno nuevo y abrilo en este mismo navegador." : null,
  );
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const value = email.trim();
    if (!value) {
      setError("Ingresá tu email.");
      return;
    }
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/auth/callback?next=/nueva-contrasena`,
    });
    setPending(false);
    if (error) {
      setError(recoveryErrorMessage(error));
      return;
    }
    setSentTo(value);
  }

  const backToLogin = <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Volver a iniciar sesión</Link>;

  if (sentTo) {
    return (
      <AuthCard title="Revisá tu correo" subtitle={`Si ${sentTo} tiene una cuenta, te mandamos un link para crear una contraseña nueva.`} footer={backToLogin}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Abrilo en este mismo navegador. Si no aparece en unos minutos, mirá en spam.</div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Recuperá tu contraseña" subtitle="Te mandamos un link a tu email para crear una nueva." footer={backToLogin}>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="email" style={authLabelStyle}>Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={authInputStyle} />
        </div>
        {error && <AuthError>{error}</AuthError>}
        <button type="submit" disabled={pending} style={{ ...authButtonStyle, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Enviando..." : "Enviar link"}
        </button>
      </form>
    </AuthCard>
  );
}
