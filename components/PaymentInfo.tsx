"use client";

import { useState } from "react";
import { PAYMENT_ALIAS, receiptWhatsappUrl, SUBSCRIPTION_PRICE, SUPPORT_PHONE } from "@/lib/contact";

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" };
const labelStyle: React.CSSProperties = { fontSize: 13, color: "var(--text-muted)" };
const valueStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" };

// Cómo pagar la suscripción. Va en Configuración y en la pantalla de cuenta bloqueada:
// una cuenta bloqueada no puede abrir Configuración, y es la que más lo necesita.
export function PaymentInfo({ gymName }: { gymName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyAlias() {
    try {
      await navigator.clipboard.writeText(PAYMENT_ALIAS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el alias sigue a la vista para copiarlo a mano.
    }
  }

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ ...rowStyle, borderTop: "1px solid var(--border)" }}>
        <div style={labelStyle}>Precio</div>
        <div style={valueStyle}>{SUBSCRIPTION_PRICE}</div>
      </div>
      <div style={rowStyle}>
        <div>
          <div style={labelStyle}>Alias de Mercado Pago</div>
          <div style={{ ...valueStyle, marginTop: 2 }}>{PAYMENT_ALIAS}</div>
        </div>
        <button
          type="button"
          onClick={copyAlias}
          style={{ flex: "none", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: "14px 0" }}>
        Transferí a ese alias y mandanos el comprobante por WhatsApp para activar tu cuenta.
      </div>
      <a
        href={receiptWhatsappUrl(gymName)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", textAlign: "center", background: "var(--primary)", color: "#fff", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, textDecoration: "none" }}
      >
        Enviar comprobante por WhatsApp
      </a>
      <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", marginTop: 12 }}>{SUPPORT_PHONE}</div>
    </div>
  );
}
