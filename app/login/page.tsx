"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGym } from "@/lib/store";

export default function LoginPage() {
  const { authed, login, settings, hydrated } = useGym();
  const router = useRouter();
  const [email, setEmail] = useState("admin@gymcontrol.app");
  const [password, setPassword] = useState("demo1234");

  // If already logged in, skip straight to the dashboard.
  useEffect(() => {
    if (hydrated && authed) router.replace("/dashboard");
  }, [hydrated, authed, router]);

  function submit() {
    login();
    router.replace("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: "#fff" }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>GymControl</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(15,23,41,0.08)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bienvenido de nuevo</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Ingresá a tu panel de {settings.name}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contraseña</div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>¿Olvidaste tu contraseña?</div>
            </div>
            <button onClick={submit} style={{ width: "100%", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 6 }}>
              Ingresar
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-faint)", marginTop: 20 }}>Panel administrativo · demo con datos de ejemplo</div>
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
