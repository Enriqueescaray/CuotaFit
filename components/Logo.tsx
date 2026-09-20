/* eslint-disable @next/next/no-img-element */
// Isotipo "CF" de Cuotafit (monograma: C anillo + F con swoosh).
// Se usa la imagen de marca (public/cf-mark*.png). Adapta el color al tema:
// versión oscura sobre fondos claros, versión blanca sobre fondos oscuros
// (se conmuta por CSS según <html data-theme>, ver app/globals.css).

export function LogoMark({ size = 40 }: { size?: number }) {
  const s = { height: size, width: "auto", flex: "none" } as const;
  return (
    <span className="cf-mark" style={{ display: "inline-flex", flex: "none", lineHeight: 0 }}>
      <img className="cf-on-light" src="/cf-mark.png" alt="Cuotafit" style={s} />
      <img className="cf-on-dark" src="/cf-mark-blanco.png" alt="Cuotafit" style={s} />
    </span>
  );
}

// Solo el glifo en un color fijo (para cabeceras de color, p. ej. check-in).
// color "#fff"/"white" usa la versión blanca; cualquier otro, la oscura.
export function LogoGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  const c = color.toLowerCase();
  const white = c === "#fff" || c === "#ffffff" || c === "white";
  return (
    <img
      src={white ? "/cf-mark-blanco.png" : "/cf-mark.png"}
      alt="Cuotafit"
      style={{ height: size, width: "auto", display: "block", flex: "none" }}
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
