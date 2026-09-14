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

export interface GymSettings {
  name: string;
  currency: string; // ISO 4217 code, e.g. "MXN"
  locale: string; // e.g. "es-MX"
  blockExpired: boolean; // block entry for expired / no-pass members
}

export interface MemberStatus {
  level: StatusLevel;
  label: string;
  sub: string;
  bg: string;
  color: string;
}

// "Today" and current month, used for status, calendars and reports.
const _now = new Date();
export const REFERENCE_TODAY = _now;
export const REFERENCE_MONTH = { year: _now.getFullYear(), monthIndex: _now.getMonth() };
export const MONTH_LABEL = (() => {
  const s = _now.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
})();
export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export const DEFAULT_SETTINGS: GymSettings = {
  name: "Mi Gimnasio",
  currency: "MXN",
  locale: "es-MX",
  blockExpired: true,
};

export const CURRENCY_OPTIONS: { code: string; locale: string; label: string }[] = [
  { code: "MXN", locale: "es-MX", label: "Peso mexicano (MXN)" },
  { code: "ARS", locale: "es-AR", label: "Peso argentino (ARS)" },
  { code: "COP", locale: "es-CO", label: "Peso colombiano (COP)" },
  { code: "PEN", locale: "es-PE", label: "Sol peruano (PEN)" },
  { code: "CLP", locale: "es-CL", label: "Peso chileno (CLP)" },
  { code: "USD", locale: "es", label: "Dólar (USD)" },
];

export const SEED_PLANS: Plan[] = [
  { id: "p_men", type: "tiempo", name: "Mensual", duration: 1, price: 600 },
  { id: "p_tri", type: "tiempo", name: "Trimestral", duration: 3, price: 1600 },
  { id: "p_anu", type: "tiempo", name: "Anual", duration: 12, price: 5500 },
  { id: "p_p8", type: "pases", name: "Pack 8 clases", passCount: 8, validityDays: 30, price: 700 },
  { id: "p_p10", type: "pases", name: "Pack 10 clases", passCount: 10, validityDays: 30, price: 850 },
  { id: "p_p20", type: "pases", name: "Pack 20 clases", passCount: 20, validityDays: 60, price: 1500 },
];

export const SEED_MEMBERS: Member[] = [
  { id: "m1", name: "Lucía Fernández", email: "lucia.fernandez@mail.com", phone: "+52 55 2233 4455", planType: "tiempo", planName: "Mensual", dueDate: "2026-09-25", pin: "4821", attendanceDays: [1, 2, 4, 5, 8, 9, 11, 12], payments: [{ date: "2026-08-25", amount: 600, method: "Transferencia", plan: "Mensual" }] },
  { id: "m2", name: "Martín Gómez", email: "martin.gomez@mail.com", phone: "+52 55 3344 5566", planType: "tiempo", planName: "Mensual", dueDate: "2026-09-15", pin: "3092", attendanceDays: [1, 3, 6, 7, 10], payments: [{ date: "2026-08-15", amount: 600, method: "Efectivo", plan: "Mensual" }] },
  { id: "m3", name: "Sofía Ramírez", email: "sofia.ramirez@mail.com", phone: "+52 55 4455 6677", planType: "tiempo", planName: "Mensual", dueDate: "2026-09-05", pin: "7714", attendanceDays: [1, 2, 3], payments: [{ date: "2026-08-05", amount: 600, method: "Tarjeta", plan: "Mensual" }] },
  { id: "m4", name: "Nicolás Torres", email: "nicolas.torres@mail.com", phone: "+52 55 5566 7788", planType: "pases", planName: "Pack 10 clases", passesTotal: 10, passesLeft: 6, pin: "5533", attendanceDays: [1, 3, 4, 8, 9, 10, 13], payments: [{ date: "2026-09-01", amount: 850, method: "Efectivo", plan: "Pack 10 clases" }] },
  { id: "m5", name: "Valentina Ríos", email: "valentina.rios@mail.com", phone: "+52 55 6677 8899", planType: "pases", planName: "Pack 8 clases", passesTotal: 8, passesLeft: 1, pin: "9021", attendanceDays: [2, 4, 5, 7, 9, 10, 11], payments: [{ date: "2026-08-28", amount: 700, method: "Transferencia", plan: "Pack 8 clases" }] },
  { id: "m6", name: "Emiliano Castro", email: "emiliano.castro@mail.com", phone: "+52 55 7788 9900", planType: "pases", planName: "Pack 10 clases", passesTotal: 10, passesLeft: 0, pin: "1187", attendanceDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], payments: [{ date: "2026-08-01", amount: 850, method: "Tarjeta", plan: "Pack 10 clases" }] },
  { id: "m7", name: "Camila Ortiz", email: "camila.ortiz@mail.com", phone: "+52 55 8899 0011", planType: "tiempo", planName: "Trimestral", dueDate: "2026-11-01", pin: "6640", attendanceDays: [1, 2, 5, 8, 9], payments: [{ date: "2026-08-01", amount: 1600, method: "Transferencia", plan: "Trimestral" }] },
  { id: "m8", name: "Bruno Acosta", email: "bruno.acosta@mail.com", phone: "+52 55 9900 1122", planType: "tiempo", planName: "Mensual", dueDate: "2026-09-14", pin: "2456", attendanceDays: [1, 3, 5, 7, 9, 11, 13], payments: [{ date: "2026-08-14", amount: 600, method: "Efectivo", plan: "Mensual" }] },
  { id: "m9", name: "Julieta Medina", email: "julieta.medina@mail.com", phone: "+52 55 0011 2233", planType: "pases", planName: "Pack 10 clases", passesTotal: 10, passesLeft: 10, pin: "8809", attendanceDays: [], payments: [{ date: "2026-09-10", amount: 850, method: "Tarjeta", plan: "Pack 10 clases" }] },
  { id: "m10", name: "Federico Suárez", email: "federico.suarez@mail.com", phone: "+52 55 1122 3344", planType: "tiempo", planName: "Mensual", dueDate: "2026-08-30", pin: "4470", attendanceDays: [1, 2, 3, 4], payments: [{ date: "2026-07-30", amount: 600, method: "Efectivo", plan: "Mensual" }] },
];

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

export function fmtDate(iso: string, locale = "es-MX"): string {
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

export function statusOf(m: Member, locale = "es-MX", today: Date = REFERENCE_TODAY): MemberStatus {
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
