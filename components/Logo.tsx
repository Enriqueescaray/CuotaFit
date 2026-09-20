/* eslint-disable @next/next/no-img-element */
// Isotipo "CF" de Cuotafit: el monograma de la marca (el mismo que usamos en Instagram)
// como badge cuadrado con esquinas redondeadas. Trae su propio fondo oscuro, así que
// se ve igual sobre fondos claros y oscuros — no necesita conmutar por tema.

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/cf-badge.png"
      alt="Cuotafit"
      width={size}
      height={size}
      style={{ height: size, width: size, flex: "none", display: "block", borderRadius: Math.round(size * 0.22) }}
    />
  );
}

// El badge en un tamaño puntual (p. ej. cabecera del check-in). El nuevo isotipo ya
// viene sobre fondo oscuro, así que ignoramos `color` y mostramos siempre el badge.
export function LogoGlyph({ size = 28 }: { size?: number; color?: string }) {
  return (
    <img
      src="/cf-badge.png"
      alt="Cuotafit"
      width={size}
      height={size}
      style={{ height: size, width: size, display: "block", flex: "none", borderRadius: Math.round(size * 0.22) }}
    />
  );
}

// Wordmark "Cuotafit" con las dos partes en distinto color (fuente de marca).
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1 }}>
      <span style={{ color: "var(--text)" }}>Cuota</span>
      <span style={{ color: "var(--primary)" }}>fit</span>
    </span>
  );
}
