"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Route } from "next";
import { useGym } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import Modals from "./Modals";
import { LogoMark, Wordmark } from "./Logo";
import { amIPlatformAdmin } from "@/app/actions/admin";

const NAV: { href: Route; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/socios", label: "Socios" },
  { href: "/checkin", label: "Check-in" },
  { href: "/asistencias", label: "Asistencias" },
  { href: "/planes", label: "Planes" },
  { href: "/reportes", label: "Reportes" },
  { href: "/configuracion", label: "Configuración" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { authed, hydrated, logout, settings } = useGym();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Client-side auth guard (mock): bounce to login when not authenticated.
  useEffect(() => {
    if (hydrated && !authed) router.replace("/login");
  }, [hydrated, authed, router]);

  // Los administradores de la plataforma no usan el panel de un gimnasio: al panel de admin.
  useEffect(() => {
    if (!hydrated || !authed) return;
    let active = true;
    amIPlatformAdmin().then((isAdmin) => {
      if (active && isAdmin) router.replace("/admin");
    });
    return () => {
      active = false;
    };
  }, [hydrated, authed, router]);

  if (!hydrated || !authed) return null;

  async function doLogout() {
    await logout();
    router.replace("/login");
  }

  // Suscripción SaaS suspendida: se bloquea el acceso hasta regularizar el pago.
  if (settings.subscriptionStatus === "suspended") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 36 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Cuenta suspendida</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 20 }}>
            El acceso a {settings.name} está pausado por un pago pendiente de la suscripción. Regularizá el pago para reactivar la cuenta.
          </div>
          <button onClick={doLogout} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "stretch" }}>
      {/* Sidebar */}
      <div style={{ width: 232, flex: "none", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "20px 14px", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 20px" }}>
          <LogoMark size={30} />
          <div>
            <div style={{ lineHeight: 1.1 }}><Wordmark size={16} /></div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{settings.name}</div>
          </div>
        </div>

        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                fontSize: 14, fontWeight: active ? 700 : 600, textDecoration: "none",
                background: active ? "var(--primary-soft)" : "transparent",
                color: active ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: active ? "var(--primary)" : "var(--border)", flex: "none" }} />
              <div>{item.label}</div>
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, borderRadius: 10, background: "var(--surface-alt)", marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Modo oscuro</div>
          <div onClick={toggle} style={{ width: 38, height: 22, borderRadius: 20, background: theme === "dark" ? "var(--primary)" : "var(--border)", position: "relative", cursor: "pointer", flex: "none" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: theme === "dark" ? 18 : 2, transition: "left 0.15s" }} />
          </div>
        </div>
        <div onClick={doLogout} style={{ padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", cursor: "pointer" }}>
          Cerrar sesión
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: "28px 32px 60px", maxWidth: 1180 }}>{children}</div>

      <Modals />
    </div>
  );
}
