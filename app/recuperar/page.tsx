import Link from "next/link";
import { AuthCard, authButtonStyle } from "@/components/AuthCard";
import { RECOVERY_WHATSAPP_URL, SUPPORT_PHONE } from "@/lib/contact";

// Sin servicio de mail propio, la contraseña se restablece a mano desde /admin.
export default function RecuperarPage() {
  return (
    <AuthCard
      title="Recuperá tu contraseña"
      subtitle="Escribinos por WhatsApp con el email de tu cuenta y te ayudamos a entrar de nuevo."
      footer={<Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Volver a iniciar sesión</Link>}
    >
      <a
        href={RECOVERY_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...authButtonStyle, display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}
      >
        Escribir por WhatsApp
      </a>
      <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", marginTop: 14 }}>{SUPPORT_PHONE}</div>
    </AuthCard>
  );
}
