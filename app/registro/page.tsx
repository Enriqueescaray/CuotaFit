"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoMark, Wordmark } from "@/components/Logo";
import { GoogleButton } from "@/components/GoogleButton";

export default function RegistroPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signUpWithEmail() {
    if (pending) return;
    setError(null);
    setInfo(null);
    if (!email.trim() || password.length < 6) {
      setError("Ingresá un email válido y una contraseña de al menos 6 caracteres.");
      return;
    }
    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setPending(false);
      const already = error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered");
      setError(already ? "Ese email ya tiene una cuenta. Iniciá sesión." : "No se pudo crear la cuenta. Probá de nuevo.");
      return;
    }
    if (data.session) {
      // Confirmación de email desactivada: hay sesión al instante -> al onboarding.
      // Recarga completa a propósito: fuerza al store a re-hidratar la sesión recién
      // creada antes de montar /bienvenida (con router.push hay carrera y rebota a /login).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/bienvenida";
      return;
    }
    // Confirmación de email activada: hay que verificar el correo antes de entrar.
    setPending(false);
    setInfo("Te enviamos un correo para confirmar tu cuenta. Abrilo y volvé a entrar.");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 28, justifyContent: "center" }}>
          <LogoMark size={38} />
          <Wordmark size={24} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(15,23,41,0.08)" }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Creá tu cuenta</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 22 }}>7 días de prueba gratis · sin tarjeta</div>

          <GoogleButton label="Registrarme con Google" onError={setError} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{ fontSize: 12, color: "var(--text-faint)" }}>o con tu email</div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contraseña</div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && signUpWithEmail()} style={inputStyle} />
            </div>
            {error && <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
            {info && <div style={{ fontSize: 13, color: "var(--primary)", background: "var(--surface-alt)", borderRadius: 8, padding: "8px 12px" }}>{info}</div>}
            <button onClick={signUpWithEmail} disabled={pending} style={{ width: "100%", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1, marginTop: 4 }}>
              {pending ? "Creando..." : "Crear mi cuenta"}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          ¿Ya tenés cuenta? <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Iniciá sesión</Link>
        </div>
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
