"use client";

import { useGym } from "@/lib/store";
import { useTheme } from "@/lib/theme";

export default function ConfiguracionPage() {
  const { settings, updateSettings } = useGym();
  const { theme, toggle } = useTheme();

  const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6 };
  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" };

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Configuración</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Datos del gimnasio y preferencias</div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, maxWidth: 520, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={labelStyle}>Nombre del gimnasio</div>
          <input value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} style={inputStyle} />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Bloquear acceso a vencidos</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>El check-in rechaza socios vencidos o sin pases</div>
          </div>
          <div onClick={() => updateSettings({ blockExpired: !settings.blockExpired })} style={{ width: 38, height: 22, borderRadius: 20, background: settings.blockExpired ? "var(--primary)" : "var(--border)", position: "relative", cursor: "pointer", flex: "none" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: settings.blockExpired ? 18 : 2, transition: "left 0.15s" }} />
          </div>
        </div>

        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Modo oscuro</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Tema de la interfaz</div>
          </div>
          <div onClick={toggle} style={{ width: 38, height: 22, borderRadius: 20, background: theme === "dark" ? "var(--primary)" : "var(--border)", position: "relative", cursor: "pointer", flex: "none" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: theme === "dark" ? 18 : 2, transition: "left 0.15s" }} />
          </div>
        </div>
      </div>
    </>
  );
}
