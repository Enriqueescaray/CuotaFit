// Domain types, seed data and business helpers for GymControl.
// Ported faithfully from the Claude Design handoff prototype, generalised
// for a multi-gym SaaS (configurable gym name + currency).

export type PlanType = "tiempo" | "pases";
export type PaymentMethod = "Efectivo" | "Transferencia" | "Tarjeta";
export type StatusLevel = "ok" | "warn" | "danger";

export interface Plan {
  id: string;
  type: PlanType;
  name: string;
  duration?: number; // months, for "tiempo" plans
  passCount?: number; // for "pases" plans
  validityDays?: number; // for "pases" plans
  price: number;
}

export interface Payment {
  date: string; // ISO yyyy-mm-dd
  amount: number;
  method: PaymentMethod;
  plan: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  planType: PlanType;
  planName: string;
  dueDate?: string; // ISO, for "tiempo" plans
  passesTotal?: number; // for "pases" plans
  passesLeft?: number; // for "pases" plans
  pin: string;
  attendanceDays: number[]; // day-of-month attended in the reference month
  payments: Payment[];
}

export type SubscriptionStatus = "trial" | "active" | "suspended";

export interface GymSettings {
  name: string;
  currency: string; // ISO 4217 code, e.g. "MXN"
  locale: string; // e.g. "es-MX"
  blockExpired: boolean; // block entry for expired / no-pass members
  subscriptionStatus: SubscriptionStatus; // estado de la suscripción SaaS del gimnasio
  paidUntil?: string | null; // ISO, hasta cuándo está pago
}

export interface MemberStatus {
  level: StatusLevel;
  label: string;
  sub: string;
  bg: string;
  color: string;
}

// "Today" and current month, used for status, calendars and reports.
// Normalised to local midnight so day-difference math has no off-by-one from the time of day.
const _now = new Date();
export const REFERENCE_TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
export const REFERENCE_MONTH = { year: _now.getFullYear(), monthIndex: _now.getMonth() };
export const MONTH_LABEL = (() => {
  const s = _now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
})();
export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export const DEFAULT_SETTINGS: GymSettings = {
  name: "Mi Gimnasio",
  currency: "ARS",
  locale: "es-AR",
  blockExpired: true,
  subscriptionStatus: "active", // por defecto no bloquea (hasta que el panel lo cambie)
  paidUntil: null,
};

// ---- Helpers ----

export function genPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function fmtMoney(n: number, settings: GymSettings): string {
  try {
    return new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  } catch {
    return "$" + Math.round(n).toLocaleString();
  }
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(iso: string, locale = "es-AR"): string {
  return parseISO(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function daysDiff(iso: string, today: Date = REFERENCE_TODAY): number {
  return Math.round((parseISO(iso).getTime() - today.getTime()) / 86400000);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter((_, i) => i === 0 || i === 1)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ---- Suscripción SaaS del gimnasio (trial / pago) ----

export type SubscriptionReason = "suspended" | "expired" | null;

// Decide si la cuenta del gimnasio está bloqueada. Se bloquea si el admin la suspendió
// manualmente, o si `paidUntil` (fin del trial o del período pago) ya pasó. `paidUntil`
// es inclusivo: el día de vencimiento todavía tiene acceso; se bloquea al día siguiente.
// Un gimnasio "active"/"trial" sin fecha nunca se bloquea (no vence).
export function subscriptionGate(
  s: { subscriptionStatus: SubscriptionStatus; paidUntil?: string | null },
  today: Date = REFERENCE_TODAY,
): { blocked: boolean; reason: SubscriptionReason } {
  if (s.subscriptionStatus === "suspended") return { blocked: true, reason: "suspended" };
  if (s.paidUntil && parseISO(s.paidUntil).getTime() < today.getTime()) return { blocked: true, reason: "expired" };
  return { blocked: false, reason: null };
}

// Texto de la pantalla de bloqueo (o null si la cuenta está habilitada).
export function subscriptionBlock(
  settings: GymSettings,
  today: Date = REFERENCE_TODAY,
): { title: string; body: string } | null {
  const { blocked, reason } = subscriptionGate(settings, today);
  if (!blocked) return null;
  if (reason === "suspended") {
    return {
      title: "Cuenta suspendida",
      body: `El acceso a ${settings.name} está pausado por un pago pendiente de la suscripción. Regularizá el pago para reactivar la cuenta.`,
    };
  }
  if (settings.subscriptionStatus === "trial") {
    return {
      title: "Tu prueba gratuita terminó",
      body: `La prueba de Cuotafit para ${settings.name} finalizó. Activá tu suscripción para seguir usando la plataforma.`,
    };
  }
  return {
    title: "La suscripción venció",
    body: `La suscripción de ${settings.name} venció. Regularizá el pago para reactivar el acceso.`,
  };
}

export function statusOf(m: Member, locale = "es-AR", today: Date = REFERENCE_TODAY): MemberStatus {
  if (m.planType === "tiempo") {
    const diff = daysDiff(m.dueDate!, today);
    if (diff < 0)
      return { level: "danger", label: "Vencido", sub: `Venció hace ${-diff} día(s)`, bg: "var(--red-soft)", color: "var(--red)" };
    if (diff <= 5)
      return { level: "warn", label: "Por vencer", sub: `Vence en ${diff} día(s)`, bg: "var(--amber-soft)", color: "var(--amber)" };
    return { level: "ok", label: "Al día", sub: `Vence el ${fmtDate(m.dueDate!, locale)}`, bg: "var(--green-soft)", color: "var(--green)" };
  }
  const left = m.passesLeft ?? 0;
  if (left <= 0)
    return { level: "danger", label: "Sin pases", sub: "Sin pases disponibles", bg: "var(--red-soft)", color: "var(--red)" };
  if (left <= 1)
    return { level: "warn", label: "Pocos pases", sub: `${left} pase restante`, bg: "var(--amber-soft)", color: "var(--amber)" };
  return { level: "ok", label: "Al día", sub: `${left} de ${m.passesTotal} pases`, bg: "var(--green-soft)", color: "var(--green)" };
}

// Returns an array of day-numbers (1..N) preceded by `null` padding cells so the
// first day lands on the right weekday column (Monday-first grid).
export function buildMonthGrid(
  year = REFERENCE_MONTH.year,
  monthIndex = REFERENCE_MONTH.monthIndex,
): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export function addMonths(date: Date, n: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}
