"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAccount } from "@/app/actions/auth";
import { useGym } from "@/lib/store";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  color: "var(--text)",
  fontSize: 14,
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6 };

export default function RegistroPage() {
  const { login } = useGym();
  const router = useRouter();
  const [form, setForm] = useState({ gymName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit() {
    setError(null);
    setPending(true);
    const res = await createAccount(form);
    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }
    // La cuenta ya existe: iniciar sesión desde el cliente (setea cookies de forma fiable).
    const { error: loginErr } = await login(form.email, form.password);
    setPending(false);
    if (loginErr) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: "#fff" }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>GymControl</div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(15,23,41,0.08)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Creá tu cuenta</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Empezá a administrar tu gimnasio en minutos</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={labelStyle}>Nombre del gimnasio</div>
              <input value={form.gymName} onChange={set("gymName")} placeholder="Ej. PowerFit" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Tu nombre</div>
              <input value={form.name} onChange={set("name")} placeholder="Ej. Enrique" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <input value={form.email} onChange={set("email")} type="email" placeholder="correo@mail.com" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Contraseña</div>
              <input value={form.password} onChange={set("password")} type="password" placeholder="Mínimo 8 caracteres" onKeyDown={(e) => e.key === "Enter" && submit()} style={inputStyle} />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>
            )}

            <button onClick={submit} disabled={pending} style={{ width: "100%", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1, marginTop: 6 }}>
              {pending ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Ingresá</Link>
        </div>
      </div>
    </div>
  );
}
