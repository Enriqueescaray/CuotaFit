"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initials } from "@/lib/data";
import { ImportRow, useGym } from "@/lib/store";

// Parser CSV simple (maneja comillas y comas dentro de campos entre comillas).
function parseCSV(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else inQ = false;
        } else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const known = ["nombre", "name", "email", "correo", "telefono", "phone", "celular", "plan", "pin"];
  const header = parseLine(lines[0]).map(norm);
  const hasHeader = header.some((h) => known.includes(h));
  const colOf = (names: string[]) => header.findIndex((h) => names.includes(h));

  const idx = hasHeader
    ? { name: colOf(["nombre", "name"]), email: colOf(["email", "correo"]), phone: colOf(["telefono", "phone", "celular"]), plan: colOf(["plan"]), pin: colOf(["pin"]) }
    : { name: 0, email: 1, phone: 2, plan: 3, pin: 4 };

  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines
    .map((l) => {
      const c = parseLine(l);
      const g = (i: number) => (i >= 0 && i < c.length ? c[i] : "");
      return { name: g(idx.name), email: g(idx.email), phone: g(idx.phone), plan: g(idx.plan), pin: g(idx.pin) } as ImportRow;
    })
    .filter((r) => r.name);
}

const btnPrimary: React.CSSProperties = { background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" };

export default function SociosPage() {
  const { members, plans, search, setSearch, statusFor, openAddMember, importMembers } = useGym();
  const router = useRouter();

  const [showImport, setShowImport] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importPlanId, setImportPlanId] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) => !q || m.name.toLowerCase().includes(q) || m.pin.includes(q));
  const planId = importPlanId || plans[0]?.id || "";

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setRows(parseCSV(String(reader.result ?? "")));
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const csv = "nombre,email,telefono,plan\nAna Pérez,ana@mail.com,+52 55 1234 5678,Mensual\nLuis Gómez,,,\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-socios.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport() {
    setImporting(true);
    const res = await importMembers(rows, planId);
    setImporting(false);
    setResult(res);
    if (res.created > 0) {
      setRows([]);
      setFileName("");
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Socios</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{members.length} socios registrados</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o PIN..." style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, width: 230 }} />
          <button onClick={() => { setShowImport((s) => !s); setResult(null); }} style={btnGhost}>Importar CSV</button>
          <button onClick={openAddMember} style={btnPrimary}>+ Agregar socio</button>
        </div>
      </div>

      {showImport && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Importar socios desde CSV</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Columnas: <b>nombre</b>, email, telefono, plan (opcional). Si no ponés plan en una fila, se usa el plan por defecto.{" "}
            <span onClick={downloadTemplate} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>Descargar plantilla</span>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Archivo CSV</div>
              <input type="file" accept=".csv,text/csv" onChange={onFile} style={{ fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Plan por defecto</div>
              <select value={planId} onChange={(e) => setImportPlanId(e.target.value)} style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 }}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button onClick={doImport} disabled={importing || rows.length === 0 || !planId} style={{ ...btnPrimary, opacity: importing || rows.length === 0 || !planId ? 0.6 : 1 }}>
              {importing ? "Importando…" : `Importar ${rows.length} socio${rows.length === 1 ? "" : "s"}`}
            </button>
          </div>

          {fileName && rows.length > 0 && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>{fileName}: <b style={{ color: "var(--text)" }}>{rows.length}</b> filas detectadas. A cada socio se le asigna un PIN único automáticamente.</div>
          )}
          {fileName && rows.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--amber)", marginTop: 12 }}>No se detectaron filas válidas en el archivo.</div>
          )}

          {result && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: result.created > 0 ? "var(--green-soft)" : "var(--amber-soft)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: result.created > 0 ? "var(--green)" : "var(--amber)" }}>
                {result.created > 0 ? `Se importaron ${result.created} socios.` : "No se importó ningún socio."}
              </div>
              {result.errors.length > 0 && (
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--text-muted)" }}>
                  {result.errors.slice(0, 8).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {result.errors.length > 8 && <li>…y {result.errors.length - 8} más.</li>}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {filtered.map((m) => {
          const status = statusFor(m);
          const planTypeLabel = m.planType === "tiempo" ? "Mensual" : "Pases";
          return (
            <div key={m.id} onClick={() => router.push(`/socios/${m.id}`)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flex: "none" }}>{initials(m.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PIN {m.pin}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "var(--surface-alt)", color: "var(--text-muted)" }}>{planTypeLabel}</div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: status.bg, color: status.color }}>{status.label}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{status.sub}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
