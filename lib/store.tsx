"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import {
  addMonths,
  DEFAULT_SETTINGS,
  genPin,
  GymSettings,
  initials,
  Member,
  MemberStatus,
  PaymentMethod,
  Plan,
  PlanType,
  REFERENCE_MONTH,
  REFERENCE_TODAY,
  statusOf,
  toISO,
} from "./data";
import { clearSnapshot, enqueue, getQueue, loadSnapshot, saveSnapshot, setQueue } from "./offline";

export type ModalState =
  | { type: "addMember" }
  | { type: "editMember"; memberId: string }
  | { type: "payment"; memberId: string }
  | { type: "plan"; planId?: string }
  | null;

export interface EditMemberInput {
  name: string;
  pin: string;
}

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
  pin: string;
  // Si viene, se registra el cobro junto con el alta (el plan se activa con el pago).
  // Si no, el socio queda "Sin plan" hasta que se le registre un pago.
  charge?: { planId: string; method: PaymentMethod };
}

export interface PlanFormInput {
  type: PlanType;
  name: string;
  duration: string;
  passCount: string;
  validityDays: string;
  price: string;
}

export interface ImportRow {
  name: string;
  plan?: string;
  pin?: string;
}

// --- DB row shapes ---
interface GymRow { id: string; name: string; currency: string; locale: string; block_expired: boolean; subscription_status?: "trial" | "active" | "suspended"; paid_until?: string | null }
interface PlanRow { id: string; type: PlanType; name: string; duration_months: number | null; pass_count: number | null; validity_days: number | null; price: number }
interface MemberRow { id: string; name: string; pin: string; plan_type: PlanType | null; plan_name: string | null; due_date: string | null; passes_total: number | null; passes_left: number | null }
interface PaymentRow { id: string; member_id: string; amount: number; method: PaymentMethod; plan_name: string | null; paid_at: string }
interface CheckinRow { member_id: string; checked_at: string; result: string }

interface GymCtx {
  hydrated: boolean;
  authed: boolean;
  hasGym: boolean;
  members: Member[];
  plans: Plan[];
  settings: GymSettings;
  search: string;
  modal: ModalState;
  online: boolean;
  pendingCount: number;

  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setSearch: (q: string) => void;
  updateSettings: (patch: Partial<GymSettings>) => void;

  openAddMember: () => void;
  openEditMember: (memberId: string) => void;
  openPayment: (memberId: string) => void;
  openAddPlan: () => void;
  openEditPlan: (planId: string) => void;
  closeModal: () => void;

  addMember: (input: NewMemberInput) => Promise<{ error?: string }>;
  editMember: (memberId: string, patch: EditMemberInput) => Promise<void>;
  importMembers: (rows: ImportRow[], defaultPlanId: string) => Promise<{ created: number; errors: string[] }>;
  registerPayment: (memberId: string, planId: string, method: PaymentMethod) => Promise<{ error?: string }>;
  savePlan: (form: PlanFormInput, editingId?: string) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  findByPin: (pin: string) => Member | undefined;
  checkin: (pin: string) => Promise<CheckinResult>;

  statusFor: (m: Member) => MemberStatus;
}

const Ctx = createContext<GymCtx | null>(null);

// "YYYY-MM" of the current month, to filter check-ins for the attendance calendar.
const MONTH_PREFIX = `${REFERENCE_MONTH.year}-${String(REFERENCE_MONTH.monthIndex + 1).padStart(2, "0")}`;

function mapPlan(r: PlanRow): Plan {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    duration: r.duration_months ?? undefined,
    passCount: r.pass_count ?? undefined,
    validityDays: r.validity_days ?? undefined,
    price: Number(r.price),
  };
}

export function GymProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [settings, setSettings] = useState<GymSettings>(DEFAULT_SETTINGS);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const clearData = useCallback(() => {
    setGymId(null);
    setMembers([]);
    setPlans([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Load everything for the signed-in user's gym.
  const loadAll = useCallback(async () => {
    const { data: profile } = await supabase.from("profiles").select("gym_id").single();
    const gid = (profile as { gym_id: string | null } | null)?.gym_id ?? null;
    setGymId(gid);
    if (!gid) {
      clearData();
      return;
    }

    const [{ data: gym }, { data: planRows }, { data: memberRows }, { data: paymentRows }, { data: checkinRows }] =
      await Promise.all([
        supabase.from("gyms").select("*").eq("id", gid).single(),
        supabase.from("plans").select("*").order("created_at", { ascending: true }),
        supabase.from("members").select("*").order("created_at", { ascending: true }),
        supabase.from("payments").select("member_id, amount, method, plan_name, paid_at").order("paid_at", { ascending: false }),
        supabase.from("checkins").select("member_id, checked_at, result").gte("checked_at", `${MONTH_PREFIX}-01`),
      ]);

    const g = gym as GymRow | null;
    const settingsObj: GymSettings = g
      ? {
          name: g.name,
          currency: g.currency,
          locale: g.locale,
          blockExpired: g.block_expired,
          subscriptionStatus: g.subscription_status ?? "active",
          paidUntil: g.paid_until ?? null,
        }
      : DEFAULT_SETTINGS;
    setSettings(settingsObj);

    const plansMapped = ((planRows as PlanRow[]) ?? []).map(mapPlan);
    setPlans(plansMapped);

    // Group payments and attendance days per member.
    const paymentsByMember = new Map<string, { date: string; amount: number; method: PaymentMethod; plan: string }[]>();
    for (const p of (paymentRows as PaymentRow[]) ?? []) {
      const list = paymentsByMember.get(p.member_id) ?? [];
      list.push({ date: p.paid_at, amount: Number(p.amount), method: p.method, plan: p.plan_name ?? "" });
      paymentsByMember.set(p.member_id, list);
    }
    const daysByMember = new Map<string, number[]>();
    for (const c of (checkinRows as CheckinRow[]) ?? []) {
      if (c.result !== "permitido") continue;
      if (!c.checked_at.startsWith(MONTH_PREFIX)) continue;
      const day = Number(c.checked_at.slice(8, 10));
      const list = daysByMember.get(c.member_id) ?? [];
      if (!list.includes(day)) list.push(day);
      daysByMember.set(c.member_id, list);
    }

    const membersMapped: Member[] = ((memberRows as MemberRow[]) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      pin: r.pin,
      planType: (r.plan_type ?? "tiempo") as PlanType,
      planName: r.plan_name ?? "",
      dueDate: r.due_date ?? undefined,
      passesTotal: r.passes_total ?? undefined,
      passesLeft: r.passes_left ?? undefined,
      attendanceDays: daysByMember.get(r.id) ?? [],
      payments: paymentsByMember.get(r.id) ?? [],
    }));
    setMembers(membersMapped);

    // Guardar snapshot local para que el check-in funcione sin internet.
    saveSnapshot({ gymId: gid, settings: settingsObj, members: membersMapped, plans: plansMapped, savedAt: new Date().toISOString() });
  }, [supabase, clearData]);

  // Cargar desde el snapshot local (sin internet).
  const loadFromSnapshot = useCallback(() => {
    const snap = loadSnapshot();
    if (snap) {
      setGymId(snap.gymId);
      setSettings(snap.settings);
      setMembers(snap.members);
      setPlans(snap.plans);
    }
    setPendingCount(getQueue().length);
  }, []);

  // Sincronizar los check-ins que quedaron encolados sin internet.
  const syncQueue = useCallback(async () => {
    const q = getQueue();
    if (q.length === 0) return;
    const remaining: typeof q = [];
    for (const item of q) {
      try {
        await supabase.from("checkins").insert({ gym_id: item.gymId, member_id: item.memberId, checked_at: item.checkedAt, result: "permitido", pass_consumed: item.passConsumed });
        if (item.passConsumed) await supabase.rpc("consume_pass", { p_member_id: item.memberId }); // descuento atómico
      } catch {
        remaining.push(item); // sigue pendiente para el próximo intento
      }
    }
    setQueue(remaining);
    setPendingCount(remaining.length);
  }, [supabase]);

  // Initial session check + auth subscription (offline-aware).
  useEffect(() => {
    let active = true;
    setPendingCount(getQueue().length);
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const u = data.session?.user ?? null;
      setUser(u);
      const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
      if (isOnline && u) {
        await syncQueue();
        await loadAll();
      } else if (!isOnline) {
        // Offline: usar el snapshot local aunque la sesión no se pueda validar.
        loadFromSnapshot();
      }
      setHydrated(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadAll();
      else clearData();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadAll, clearData, loadFromSnapshot, syncQueue]);

  // Estado de conexión: al volver el internet, sincronizar y refrescar.
  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      syncQueue().then(() => loadAll());
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [syncQueue, loadAll]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearSnapshot(); // no dejar socios/PIN en el localStorage de un dispositivo compartido
  }, [supabase]);

  const updateSettings = useCallback(
    (patch: Partial<GymSettings>) => {
      setSettings((s) => ({ ...s, ...patch }));
      if (!gymId) return;
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.currency !== undefined) dbPatch.currency = patch.currency;
      if (patch.locale !== undefined) dbPatch.locale = patch.locale;
      if (patch.blockExpired !== undefined) dbPatch.block_expired = patch.blockExpired;
      void supabase.from("gyms").update(dbPatch).eq("id", gymId);
    },
    [supabase, gymId],
  );

  const openAddMember = useCallback(() => setModal({ type: "addMember" }), []);
  const openEditMember = useCallback((memberId: string) => setModal({ type: "editMember", memberId }), []);
  const openPayment = useCallback((memberId: string) => setModal({ type: "payment", memberId }), []);
  const openAddPlan = useCallback(() => setModal({ type: "plan" }), []);
  const openEditPlan = useCallback((planId: string) => setModal({ type: "plan", planId }), []);
  const closeModal = useCallback(() => setModal(null), []);

  // Registra el cobro y activa el plan del socio (vencimiento o pases). Es la vía por la que
  // un socio obtiene plan al darlo de alta o renovarlo, así cada plan activo tiene su pago
  // y los ingresos aparecen en reportes. Devuelve el mensaje de error, o null si salió bien.
  const applyPayment = useCallback(
    async (memberId: string, plan: Plan, method: PaymentMethod): Promise<string | null> => {
      if (!gymId) return "Sin gimnasio.";
      const { error: payErr } = await supabase.from("payments").insert({
        gym_id: gymId,
        member_id: memberId,
        amount: plan.price,
        method,
        plan_name: plan.name,
        paid_at: toISO(REFERENCE_TODAY),
      });
      if (payErr) return payErr.message;
      const update: Record<string, unknown> =
        plan.type === "tiempo"
          ? { plan_type: "tiempo", plan_name: plan.name, due_date: addMonths(REFERENCE_TODAY, plan.duration ?? 1), passes_total: null, passes_left: null }
          : { plan_type: "pases", plan_name: plan.name, passes_total: plan.passCount, passes_left: plan.passCount, due_date: null };
      const { error: updErr } = await supabase.from("members").update(update).eq("id", memberId);
      return updErr ? updErr.message : null;
    },
    [supabase, gymId],
  );

  // Alta de socio: solo nombre + PIN. Si viene `charge`, se registra el cobro en el mismo
  // paso y el plan se activa con él; si no, el socio queda "Sin plan" hasta cobrarle.
  const addMember = useCallback(
    async (input: NewMemberInput): Promise<{ error?: string }> => {
      if (!input.name.trim() || !gymId) return { error: "Falta el nombre del socio." };
      const plan = input.charge ? plans.find((p) => p.id === input.charge!.planId) : undefined;
      if (input.charge && !plan) return { error: "Elegí un plan para registrar el cobro." };

      const { data, error } = await supabase
        .from("members")
        .insert({ gym_id: gymId, name: input.name.trim(), pin: input.pin })
        .select("id")
        .single();
      if (error || !data) {
        return { error: error?.code === "23505" ? "Ese PIN ya lo usa otro socio. Elegí otro." : "No se pudo guardar el socio. Probá de nuevo." };
      }

      const payError = plan && input.charge ? await applyPayment((data as { id: string }).id, plan, input.charge.method) : null;
      await loadAll();
      if (payError) {
        return { error: `El socio se creó, pero no se pudo registrar el cobro (${payError}). Cerrá esta ventana y registralo desde su ficha.` };
      }
      setModal(null);
      return {};
    },
    [supabase, gymId, plans, loadAll, applyPayment],
  );

  // Editar nombre y PIN. El plan/vencimiento/pases se gestionan por pagos.
  const editMember = useCallback(
    async (memberId: string, patch: EditMemberInput) => {
      if (!gymId || !patch.name.trim()) return;
      await supabase
        .from("members")
        .update({
          name: patch.name.trim(),
          pin: patch.pin,
        })
        .eq("id", memberId);
      await loadAll();
      setModal(null);
    },
    [supabase, gymId, loadAll],
  );

  const importMembers = useCallback(
    async (rows: ImportRow[], defaultPlanId: string): Promise<{ created: number; errors: string[] }> => {
      if (!gymId) return { created: 0, errors: ["Sin gimnasio."] };
      const used = new Set(members.map((m) => m.pin));
      const uniquePin = (preferred?: string): string => {
        const p = (preferred ?? "").trim();
        if (/^\d{4}$/.test(p) && !used.has(p)) {
          used.add(p);
          return p;
        }
        let g = genPin();
        let tries = 0;
        while (used.has(g) && tries < 100) {
          g = genPin();
          tries++;
        }
        used.add(g);
        return g;
      };

      const errors: string[] = [];
      const toInsert: Record<string, unknown>[] = [];
      rows.forEach((r, i) => {
        const name = (r.name ?? "").trim();
        if (!name) {
          errors.push(`Fila ${i + 1}: sin nombre, se omitió.`);
          return;
        }
        // El plan es opcional: sin plan (ni en la fila ni por defecto) el socio entra "Sin plan"
        // y se le registra el cobro después. Con plan, queda activo SIN registrar un pago (para
        // cargar socios que ya habían pagado antes de usar Cuotafit); no suma a reportes.
        const planByName = r.plan ? plans.find((p) => p.name.toLowerCase() === r.plan!.trim().toLowerCase()) : undefined;
        if (r.plan && r.plan.trim() && !planByName && !defaultPlanId) {
          errors.push(`Fila ${i + 1} (${name}): el plan "${r.plan.trim()}" no existe, quedó sin plan.`);
        }
        const plan = planByName ?? plans.find((p) => p.id === defaultPlanId);
        const base: Record<string, unknown> = {
          gym_id: gymId,
          name,
          pin: uniquePin(r.pin),
        };
        if (plan) {
          base.plan_type = plan.type;
          base.plan_name = plan.name;
          if (plan.type === "tiempo") base.due_date = addMonths(REFERENCE_TODAY, plan.duration ?? 1);
          else {
            base.passes_total = plan.passCount;
            base.passes_left = plan.passCount;
          }
        }
        toInsert.push(base);
      });

      if (toInsert.length === 0) return { created: 0, errors };
      const { error } = await supabase.from("members").insert(toInsert);
      if (error) return { created: 0, errors: [...errors, `Error al guardar: ${error.message}`] };
      await loadAll();
      return { created: toInsert.length, errors };
    },
    [supabase, gymId, members, plans, loadAll],
  );

  const registerPayment = useCallback(
    async (memberId: string, planId: string, method: PaymentMethod): Promise<{ error?: string }> => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return { error: "Elegí un plan." };
      const err = await applyPayment(memberId, plan, method);
      await loadAll();
      if (err) return { error: `No se pudo registrar el pago (${err}).` };
      setModal(null);
      return {};
    },
    [plans, loadAll, applyPayment],
  );

  const savePlan = useCallback(
    async (form: PlanFormInput, editingId?: string) => {
      if (!gymId) return;
      const base: Record<string, unknown> =
        form.type === "tiempo"
          ? { gym_id: gymId, type: "tiempo", name: form.name, duration_months: Number(form.duration), pass_count: null, validity_days: null, price: Number(form.price) }
          : { gym_id: gymId, type: "pases", name: form.name, pass_count: Number(form.passCount), validity_days: Number(form.validityDays), duration_months: null, price: Number(form.price) };
      if (editingId) await supabase.from("plans").update(base).eq("id", editingId);
      else await supabase.from("plans").insert(base);
      await loadAll();
      setModal(null);
    },
    [supabase, gymId, loadAll],
  );

  const deletePlan = useCallback(
    async (planId: string) => {
      await supabase.from("plans").delete().eq("id", planId);
      await loadAll();
      setModal(null);
    },
    [supabase, loadAll],
  );

  const findByPin = useCallback((pin: string) => members.find((m) => m.pin === pin), [members]);

  const checkin = useCallback(
    async (pin: string): Promise<CheckinResult> => {
      const member = members.find((m) => m.pin === pin);
      if (!member) {
        return { level: "red", title: "PIN no encontrado", sub: "Verificá el PIN e intentá nuevamente", initials: "?" };
      }
      const pre = statusOf(member, settings.locale);
      // Solo se rechaza al socio vencido / sin pases si el gimnasio tiene activado
      // "Bloquear acceso a vencidos" (settings.blockExpired). Si está desactivado, se
      // permite el ingreso igual (queda registrado, más abajo se marca en ámbar).
      if (pre.level === "danger" && settings.blockExpired) {
        return {
          level: "red",
          title: !member.planName ? "Sin plan activo" : member.planType === "tiempo" ? "Membresía vencida" : "Sin pases disponibles",
          sub: pre.sub,
          name: member.name,
          initials: initials(member.name),
          member,
        };
      }
      const today = REFERENCE_TODAY.getDate();
      const isPases = member.planType === "pases";

      // Un pase = un día. Si ya registró asistencia hoy, no se descuenta otro pase
      // ni se duplica el registro: solo se le recuerda que ya ingresó.
      if (member.attendanceDays.includes(today)) {
        return {
          level: "amber",
          title: "Ya registraste tu asistencia hoy",
          sub: isPases ? `Te quedan ${member.passesLeft ?? 0} pase(s)` : "No se descuenta otro día",
          name: member.name,
          initials: initials(member.name),
          member,
        };
      }

      const checkedAt = new Date().toISOString();

      const updated: Member = {
        ...member,
        attendanceDays: [...member.attendanceDays, today],
        ...(isPases ? { passesLeft: Math.max(0, (member.passesLeft ?? 0) - 1) } : {}),
      };

      // Actualizar estado local + snapshot (para que persista y funcione offline).
      const nextMembers = members.map((m) => (m.id === member.id ? updated : m));
      setMembers(nextMembers);
      if (gymId) saveSnapshot({ gymId, settings, members: nextMembers, plans, savedAt: checkedAt });

      // Persistir el registro: online → Supabase; si falla o está offline → cola local.
      const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
      if (gymId) {
        let wrote = false;
        if (isOnline) {
          try {
            await supabase.from("checkins").insert({ gym_id: gymId, member_id: member.id, checked_at: checkedAt, result: "permitido", pass_consumed: isPases });
            if (isPases) await supabase.rpc("consume_pass", { p_member_id: member.id }); // descuento atómico
            wrote = true;
          } catch {
            wrote = false;
          }
        }
        if (!wrote) {
          enqueue({ localId: `${member.id}-${checkedAt}`, gymId, memberId: member.id, checkedAt, passConsumed: isPases });
          setPendingCount(getQueue().length);
        }
      }

      // Verde solo si queda "al día"; si entró vencido/por-vencer (p. ej. con el bloqueo
      // desactivado), se muestra en ámbar como aviso.
      const post = statusOf(updated, settings.locale);
      const level = post.level === "ok" ? "green" : "amber";
      const sub = !updated.planName
        ? "Todavía no registraste tu pago"
        : isPases
        ? `Te quedan ${updated.passesLeft} pase(s)`
        : `Válido hasta ${new Date(updated.dueDate! + "T00:00:00").toLocaleDateString(settings.locale, { day: "2-digit", month: "2-digit", year: "numeric" })}`;
      return { level, title: "Acceso permitido", sub, name: member.name, initials: initials(member.name), member: updated };
    },
    [supabase, gymId, members, settings, plans],
  );

  const statusFor = useCallback((m: Member) => statusOf(m, settings.locale), [settings.locale]);

  const value = useMemo<GymCtx>(
    () => ({
      hydrated, authed: !!user, hasGym: !!gymId, members, plans, settings, search, modal, online, pendingCount,
      login, logout, setSearch, updateSettings,
      openAddMember, openEditMember, openPayment, openAddPlan, openEditPlan, closeModal,
      addMember, editMember, importMembers, registerPayment, savePlan, deletePlan, findByPin, checkin, statusFor,
    }),
    [hydrated, user, gymId, members, plans, settings, search, modal, online, pendingCount, login, logout, updateSettings, openAddMember, openEditMember, openPayment, openAddPlan, openEditPlan, closeModal, addMember, editMember, importMembers, registerPayment, savePlan, deletePlan, findByPin, checkin, statusFor],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGym() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
}
