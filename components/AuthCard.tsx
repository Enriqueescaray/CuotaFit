import { LogoMark, Wordmark } from "@/components/Logo";

// Marco de las pantallas públicas de cuenta (recuperar y cambiar contraseña).
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 32, justifyContent: "center" }}>
          <LogoMark size={38} />
          <Wordmark size={24} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(15,23,41,0.08)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>{subtitle}</div>
          {children}
        </div>
        {footer && <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>{footer}</div>}
      </div>
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "8px 12px" }}>
      {children}
    </div>
  );
}

export const authLabelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 };

export const authInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  color: "var(--text)",
  fontSize: 14,
};

export const authButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--primary)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: 13,
  fontWeight: 700,
  fontSize: 15,
};
