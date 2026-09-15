"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGym } from "@/lib/store";
import { LogoMark, Wordmark } from "@/components/Logo";
import { amIPlatformAdmin } from "@/app/actions/admin";

export default function LoginPage() {
  const { login } = useGym();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Nota: no auto-redirigimos a los ya logueados — así se puede cambiar de cuenta
  // (p.ej. el admin entrando a la cuenta de un gimnasio) sin quedar atrapado en /admin.

  async function submit() {
    setError(null);
    setPending(true);
    const { error } = await login(email, password);
    if (error) {
      setPending(false);
      setError("Email o contraseña incorrectos.");
      return;
    }
    // Los administradores de la plataforma van a su panel, no al dashboard de un gimnasio.
    const isAdmin = await amIPlatformAdmin();
    setPending(false);
    router.replace(isAdmin ? "/admin" : "/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 32, justifyContent: "center" }}>
          <LogoMark size={38} />
          <Wordmark size={24} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(15,23,41,0.08)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bienvenido de nuevo</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Ingresá con tu cuenta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contraseña</div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={inputStyle} />
            </div>
            {error && (
              <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>¿Olvidaste tu contraseña?</div>
            </div>
            <button onClick={submit} disabled={pending} style={{ width: "100%", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1, marginTop: 6 }}>
              {pending ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-faint)", marginTop: 20 }}>Cuotafit · acceso privado</div>
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
