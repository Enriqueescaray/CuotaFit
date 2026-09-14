"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildMonthGrid, WEEKDAY_LABELS, fmtDate } from "@/lib/data";
import { CheckinResult, useGym } from "@/lib/store";
import { LogoGlyph } from "@/components/Logo";

const BG_BY_LEVEL: Record<string, string> = { green: "#15803D", amber: "#B45309", red: "#B91C1C" };

export default function CheckinPage() {
  const { authed, hydrated, settings, checkin, online, pendingCount } = useGym();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Offline no se puede iniciar sesión: el kiosco funciona con el snapshot local,
    // así que solo redirigimos al login si hay conexión y no hay sesión.
    if (hydrated && !authed && online) router.replace("/login");
  }, [hydrated, authed, online, router]);

  const reset = useCallback(() => {
    setPin("");
    setResult(null);
  }, []);

  // Auto-reset the result after a few seconds (kiosk convenience).
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(reset, 6000);
    return () => clearTimeout(t);
  }, [result, reset]);

  const evaluate = useCallback(
    async (value: string) => {
      setResult(await checkin(value));
    },
    [checkin],
  );

  function pressDigit(d: string) {
    if (result) return;
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + d;
      if (next.length === 4) {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => evaluate(next), 150);
      }
      return next;
    });
  }

  function backspace() {
    if (result) return;
    setPin((p) => p.slice(0, -1));
  }

  const bg = result ? BG_BY_LEVEL[result.level] : "#2563EB";

  if (hydrated && settings.subscriptionStatus === "suspended") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F1729", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", color: "#fff", maxWidth: 420 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Cuenta suspendida</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>El check-in está pausado por un pago pendiente de la suscripción.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", transition: "background 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoGlyph size={28} color="#fff" />
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{settings.name} · Check-in</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {(!online || pendingCount > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.16)", borderRadius: 20, padding: "5px 12px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#A3E635" : "#F59E0B" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {online ? "Sincronizando…" : "Sin conexión"}
                {pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}` : ""}
              </div>
            </div>
          )}
          <div onClick={() => router.push("/dashboard")} style={{ fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: 0.85 }}>Salir</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        {!result ? (
          <div style={{ textAlign: "center", width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Ingresá tu PIN</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>Usá el teclado para hacer check-in</div>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 34 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pin.length ? "#fff" : "rgba(255,255,255,0.28)" }} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, maxWidth: 320, margin: "0 auto" }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => {
                if (k === "") return <div key={i} />;
                return (
                  <button
                    key={i}
                    onClick={() => (k === "⌫" ? backspace() : pressDigit(k))}
                    style={{ height: 72, borderRadius: 16, border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 26, fontWeight: 700, cursor: "pointer" }}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <ResultView result={result} locale={settings.locale} onNext={reset} />
        )}
      </div>
    </div>
  );
}

function ResultView({ result, locale, onNext }: { result: CheckinResult; locale: string; onNext: () => void }) {
  const member = result.member;
  const cells = buildMonthGrid();
  const passesPct = member?.passesTotal ? `${Math.round(((member.passesLeft ?? 0) / member.passesTotal) * 100)}%` : "0%";

  return (
    <div style={{ textAlign: "center", width: "100%", maxWidth: 440 }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", fontWeight: 800, fontSize: 34, color: "#fff" }}>{result.initials}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 10 }}>{result.title}</div>
      {result.name && <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>{result.name}</div>}
      <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.95)", marginTop: 6 }}>{result.sub}</div>

      {member && (
        <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: 20, padding: 22, marginTop: 26, textAlign: "left" }}>
          {member.planType === "pases" ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Pases</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{member.passesLeft} de {member.passesTotal}</div>
              </div>
              <div style={{ height: 10, borderRadius: 20, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 20 }}>
                <div style={{ height: "100%", borderRadius: 20, background: "#fff", width: passesPct }} />
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Vencimiento</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{member.dueDate ? fmtDate(member.dueDate, locale) : "—"}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Asistencia · Septiembre</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{member.attendanceDays.length} días</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 5 }}>
            {WEEKDAY_LABELS.map((wd, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{wd}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} style={{ height: 30 }} />;
              const attended = member.attendanceDays.includes(day);
              return (
                <div key={i} style={{ height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: attended ? "#fff" : "rgba(255,255,255,0.14)", color: attended ? "#111" : "rgba(255,255,255,0.55)" }}>{day}</div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={onNext} style={{ marginTop: 28, background: "rgba(255,255,255,0.22)", color: "#fff", border: "none", borderRadius: 12, padding: "16px 36px", fontWeight: 700, fontSize: 17, cursor: "pointer" }}>Siguiente</button>
    </div>
  );
}
