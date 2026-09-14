"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  DEFAULT_SETTINGS,
  fmtDate,
  genPin,
  GymSettings,
  initials,
  Member,
  MemberStatus,
  PaymentMethod,
  Plan,
  PlanType,
  REFERENCE_TODAY,
  SEED_MEMBERS,
  SEED_PLANS,
  statusOf,
  toISO,
} from "./data";

export type ModalState =
  | { type: "addMember" }
  | { type: "payment"; memberId: string }
  | { type: "plan"; planId?: string }
  | null;

export interface CheckinResult {
  level: "green" | "amber" | "red";
  title: string;
  sub: string;
  name?: string;
  initials: string;
  member?: Member;
}

export interface NewMemberInput {
  name: string;
  email: string;
  phone: string;
  planId: string;
  pin: string;
}

export interface PlanFormInput {
  type: PlanType;
  name: string;
  duration: string;
  passCount: string;
  validityDays: string;
  price: string;
}

interface GymCtx {
  hydrated: boolean;
  authed: boolean;
  members: Member[];
  plans: Plan[];
  settings: GymSettings;
  search: string;
  modal: ModalState;

  login: () => void;
  logout: () => void;
  setSearch: (q: string) => void;
  updateSettings: (patch: Partial<GymSettings>) => void;

  openAddMember: () => void;
  openPayment: (memberId: string) => void;
  openAddPlan: () => void;
  openEditPlan: (planId: string) => void;
  closeModal: () => void;

  addMember: (input: NewMemberInput) => void;
  registerPayment: (memberId: string, planId: string, method: PaymentMethod) => void;
  savePlan: (form: PlanFormInput, editingId?: string) => void;
  deletePlan: (planId: string) => void;
  checkin: (pin: string) => CheckinResult;

  statusFor: (m: Member) => MemberStatus;
  memberById: (id: string) => Member | undefined;
}

const Ctx = createContext<GymCtx | null>(null);
const STORAGE_KEY = "gc.state.v1";

interface Persisted {
  authed: boolean;
  members: Member[];
  plans: Plan[];
  settings: GymSettings;
}

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [plans, setPlans] = useState<Plan[]>(SEED_PLANS);
  const [settings, setSettings] = useState<GymSettings>(DEFAULT_SETTINGS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const didLoad = useRef(false);

  // Hydrate from localStorage once.
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (p.members) setMembers(p.members);
        if (p.plans) setPlans(p.plans);
        if (p.settings) setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
        if (typeof p.authed === "boolean") setAuthed(p.authed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ authed, members, plans, settings }));
    } catch {
      /* ignore */
    }
  }, [hydrated, authed, members, plans, settings]);

  const login = useCallback(() => setAuthed(true), []);
  const logout = useCallback(() => setAuthed(false), []);
  const updateSettings = useCallback((patch: Partial<GymSettings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const openAddMember = useCallback(() => setModal({ type: "addMember" }), []);
  const openPayment = useCallback((memberId: string) => setModal({ type: "payment", memberId }), []);
  const openAddPlan = useCallback(() => setModal({ type: "plan" }), []);
  const openEditPlan = useCallback((planId: string) => setModal({ type: "plan", planId }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const addMember = useCallback(
    (input: NewMemberInput) => {
      if (!input.name.trim()) return;
      const plan = plans.find((p) => p.id === input.planId) ?? plans[0];
      if (!plan) return;
      const base = {
        id: "m" + Date.now(),
        name: input.name.trim(),
        email: input.email,
        phone: input.phone,
        pin: input.pin,
        attendanceDays: [] as number[],
        payments: [],
      };
      const member: Member =
        plan.type === "tiempo"
          ? { ...base, planType: "tiempo", planName: plan.name, dueDate: addMonths(REFERENCE_TODAY, plan.duration ?? 1) }
          : { ...base, planType: "pases", planName: plan.name, passesTotal: plan.passCount, passesLeft: plan.passCount };
      setMembers((current) => [member, ...current]);
      setModal(null);
    },
    [plans],
  );

  const registerPayment = useCallback(
    (memberId: string, planId: string, method: PaymentMethod) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;
      const payment = { date: toISO(REFERENCE_TODAY), amount: plan.price, method, plan: plan.name };
      setMembers((current) =>
        current.map((m) => {
          if (m.id !== memberId) return m;
          if (plan.type === "tiempo") {
            return { ...m, planType: "tiempo" as const, planName: plan.name, dueDate: addMonths(REFERENCE_TODAY, plan.duration ?? 1), passesTotal: undefined, passesLeft: undefined, payments: [payment, ...m.payments] };
          }
          return { ...m, planType: "pases" as const, planName: plan.name, passesTotal: plan.passCount, passesLeft: plan.passCount, dueDate: undefined, payments: [payment, ...m.payments] };
        }),
      );
      setModal(null);
    },
    [plans],
  );

  const savePlan = useCallback((form: PlanFormInput, editingId?: string) => {
    const base: Omit<Plan, "id"> =
      form.type === "tiempo"
        ? { type: "tiempo", name: form.name, duration: Number(form.duration), price: Number(form.price) }
        : { type: "pases", name: form.name, passCount: Number(form.passCount), validityDays: Number(form.validityDays), price: Number(form.price) };
    setPlans((current) => {
      if (editingId) return current.map((p) => (p.id === editingId ? { ...p, ...base } : p));
      return [...current, { id: "p" + Date.now(), ...base }];
    });
    setModal(null);
  }, []);

  const deletePlan = useCallback((planId: string) => {
    setPlans((current) => current.filter((p) => p.id !== planId));
    setModal(null);
  }, []);

  // Evaluate a check-in: validate, register attendance, decrement a pass.
  const checkin = useCallback(
    (pin: string): CheckinResult => {
      const member = members.find((m) => m.pin === pin);
      if (!member) {
        return { level: "red", title: "PIN no encontrado", sub: "Verificá el PIN e intentá nuevamente", initials: "?" };
      }
      const pre = statusOf(member, settings.locale);
      if (pre.level === "danger") {
        return {
          level: "red",
          title: member.planType === "tiempo" ? "Membresía vencida" : "Sin pases disponibles",
          sub: pre.sub,
          name: member.name,
          initials: initials(member.name),
          member,
        };
      }
      const today = REFERENCE_TODAY.getDate();
      const updated: Member = {
        ...member,
        attendanceDays: member.attendanceDays.includes(today) ? member.attendanceDays : [...member.attendanceDays, today],
        ...(member.planType === "pases" ? { passesLeft: Math.max(0, (member.passesLeft ?? 0) - 1) } : {}),
      };
      setMembers((current) => current.map((m) => (m.id === member.id ? updated : m)));
      const post = statusOf(updated, settings.locale);
      const level = post.level === "warn" ? "amber" : "green";
      const sub =
        updated.planType === "pases"
          ? `Te quedan ${updated.passesLeft} pase(s)`
          : `Válido hasta ${fmtDate(updated.dueDate!, settings.locale)}`;
      return { level, title: "Acceso permitido", sub, name: member.name, initials: initials(member.name), member: updated };
    },
    [members, settings.locale],
  );

  const statusFor = useCallback((m: Member) => statusOf(m, settings.locale), [settings.locale]);
  const memberById = useCallback((id: string) => members.find((m) => m.id === id), [members]);

  const value = useMemo<GymCtx>(
    () => ({
      hydrated, authed, members, plans, settings, search, modal,
      login, logout, setSearch, updateSettings,
      openAddMember, openPayment, openAddPlan, openEditPlan, closeModal,
      addMember, registerPayment, savePlan, deletePlan, checkin, statusFor, memberById,
    }),
    [hydrated, authed, members, plans, settings, search, modal, login, logout, updateSettings, openAddMember, openPayment, openAddPlan, openEditPlan, closeModal, addMember, registerPayment, savePlan, deletePlan, checkin, statusFor, memberById],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGym() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
}
