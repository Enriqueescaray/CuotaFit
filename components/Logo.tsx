// Isotipo "CF · Ciclo" de Cuotafit: la C es un anillo (ciclo de la cuota) con la F dentro.
// SVG autocontenido (la F es vectorial, sin depender de una fuente) para usarse
// también como favicon.

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Cuotafit" style={{ display: "block", flex: "none" }}>
      <rect width="120" height="120" rx="30" fill="#2563EB" />
      <circle
        cx="60"
        cy="60"
        r="40"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="186 65"
        transform="rotate(40 60 60)"
      />
      {/* F */}
      <rect x="52" y="44" width="7" height="32" rx="2" fill="#FFFFFF" />
      <rect x="52" y="44" width="22" height="7" rx="2" fill="#FFFFFF" />
      <rect x="52" y="57" width="16" height="7" rx="2" fill="#FFFFFF" />
    </svg>
  );
}

// Solo el glifo (anillo + F) sin el cuadrado de fondo, para fondos de color.
export function LogoGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Cuotafit" style={{ display: "block", flex: "none" }}>
      <circle
        cx="60"
        cy="60"
        r="40"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="186 65"
        transform="rotate(40 60 60)"
      />
      <rect x="52" y="44" width="7" height="32" rx="2" fill={color} />
      <rect x="52" y="44" width="22" height="7" rx="2" fill={color} />
      <rect x="52" y="57" width="16" height="7" rx="2" fill={color} />
    </svg>
  );
}

// Wordmark "Cuotafit" con las dos partes en distinto color.
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1 }}>
      <span style={{ color: "var(--text)" }}>Cuota</span>
      <span style={{ color: "var(--primary)" }}>fit</span>
    </span>
  );
}
