"use server";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus = "trial" | "active" | "suspended";

export interface AdminGym {
  id: string;
  name: string;
  currency: string;
  subscriptionStatus: SubscriptionStatus;
  paidUntil: string | null;
  createdAt: string;
  memberCount: number;
  ownerEmail: string | null;
}

export interface AdminData {
  authed: boolean;
  isAdmin: boolean;
  email?: string;
  gyms?: AdminGym[];
}

function adminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Email del usuario si es admin de la plataforma, o null. Además de estar en la
// allowlist, exige que el email esté CONFIRMADO: así, con la confirmación de email
// activada en Supabase, una cuenta que se auto-registró con un email de admin pero no
// pudo verificarlo (no es dueña del buzón) nunca obtiene acceso al panel.
type MaybeUser = { email?: string | null; email_confirmed_at?: string | null; confirmed_at?: string | null } | null;
function adminEmailOf(user: MaybeUser): string | null {
  if (!user) return null;
  const email = (user.email ?? "").toLowerCase();
  if (!email || !adminEmails().includes(email)) return null;
  if (!(user.email_confirmed_at ?? user.confirmed_at)) return null;
  return email;
}

// Devuelve el email del usuario logueado si es admin de la plataforma, o null.
async function requireAdminEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return adminEmailOf(data.user);
}

interface GymRow {
  id: string;
  name: string;
  currency: string;
  subscription_status: SubscriptionStatus;
  paid_until: string | null;
  created_at: string;
}

export async function getAdminData(): Promise<AdminData> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { authed: false, isAdmin: false };

  const email = (user.email ?? "").toLowerCase();
  if (!adminEmailOf(user)) return { authed: true, isAdmin: false, email };

  const admin = createAdminClient();
  const [{ data: gymRows }, { data: memberRows }, { data: profileRows }, usersRes] = await Promise.all([
    admin.from("gyms").select("id, name, currency, subscription_status, paid_until, created_at").order("created_at", { ascending: true }),
    admin.from("members").select("gym_id"),
    admin.from("profiles").select("id, gym_id, role"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const counts = new Map<string, number>();
  for (const m of (memberRows as { gym_id: string }[]) ?? []) {
    counts.set(m.gym_id, (counts.get(m.gym_id) ?? 0) + 1);
  }

  // Email (credencial de login) del dueño de cada gimnasio.
  const emailById = new Map<string, string>();
  for (const u of usersRes.data?.users ?? []) if (u.email) emailById.set(u.id, u.email);
  const ownerByGym = new Map<string, string | null>();
  for (const p of (profileRows as { id: string; gym_id: string; role: string }[]) ?? []) {
    if (!ownerByGym.has(p.gym_id) || p.role === "owner") ownerByGym.set(p.gym_id, emailById.get(p.id) ?? null);
  }

  const gyms: AdminGym[] = ((gymRows as GymRow[]) ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    currency: g.currency,
    subscriptionStatus: g.subscription_status,
    paidUntil: g.paid_until,
    createdAt: g.created_at,
    memberCount: counts.get(g.id) ?? 0,
    ownerEmail: ownerByGym.get(g.id) ?? null,
  }));

  return { authed: true, isAdmin: true, email, gyms };
}

// Chequeo liviano: ¿el usuario logueado es admin de la plataforma?
export async function amIPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return adminEmailOf(data.user) !== null;
}

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let s = "";
  for (const b of bytes) s += chars[b % chars.length];
  return s + "7!";
}

// Crea un gimnasio + su usuario dueño desde el panel de admin (con credenciales que controla el admin).
export async function createGymAsAdmin(input: {
  gymName: string;
  ownerEmail: string;
  password?: string;
}): Promise<{ error?: string; email?: string; password?: string }> {
  const adminEmail = await requireAdminEmail();
  if (!adminEmail) return { error: "No autorizado" };

  const gymName = (input.gymName ?? "").trim();
  const email = (input.ownerEmail ?? "").trim().toLowerCase();
  if (!gymName || !email) return { error: "Completá el nombre del gimnasio y el email del dueño." };
  const password = input.password && input.password.length >= 8 ? input.password : genPassword();

  const admin = createAdminClient();
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (cErr || !created?.user) {
    const already = cErr?.message?.toLowerCase().includes("already") || cErr?.message?.toLowerCase().includes("registered");
    return { error: already ? "Ese email ya está registrado." : "No se pudo crear el usuario." };
  }
  const userId = created.user.id;

  // Prueba gratuita de 7 días: la cuenta arranca en 'trial' y se bloquea sola cuando
  // vence `paid_until`, salvo que el admin registre el pago desde el panel ("Marcar pagado").
  const trialUntil = new Date();
  trialUntil.setDate(trialUntil.getDate() + 7);
  const paidUntil = trialUntil.toISOString().slice(0, 10);

  const { data: gym, error: gErr } = await admin
    .from("gyms")
    .insert({ name: gymName, currency: "ARS", locale: "es-AR", subscription_status: "trial", paid_until: paidUntil })
    .select("id")
    .single();
  if (gErr || !gym) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "No se pudo crear el gimnasio." };
  }

  const { error: pErr } = await admin.from("profiles").insert({ id: userId, gym_id: gym.id, role: "owner", name: gymName });
  if (pErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "No se pudo vincular el perfil." };
  }

  await admin.from("plans").insert([
    { gym_id: gym.id, type: "tiempo", name: "Mensual", duration_months: 1, price: 18000 },
    { gym_id: gym.id, type: "pases", name: "Pack 10 clases", pass_count: 10, validity_days: 30, price: 22000 },
  ]);

  return { email, password };
}

// Restablece la contraseña del dueño de un gimnasio y devuelve la nueva (para que el admin la controle).
export async function resetGymOwnerPassword(gymId: string): Promise<{ password?: string; email?: string; error?: string }> {
  const email = await requireAdminEmail();
  if (!email) return { error: "No autorizado" };

  const admin = createAdminClient();
  const { data: profs } = await admin.from("profiles").select("id, role").eq("gym_id", gymId);
  const list = (profs as { id: string; role: string }[]) ?? [];
  const owner = list.find((p) => p.role === "owner") ?? list[0];
  if (!owner) return { error: "El gimnasio no tiene usuario dueño." };

  const password = genPassword();
  const { data: updated, error } = await admin.auth.admin.updateUserById(owner.id, { password });
  if (error) return { error: error.message };
  return { password, email: updated.user?.email ?? undefined };
}

// Elimina un gimnasio POR COMPLETO: borra el gym (arrastra por ON DELETE CASCADE sus
// planes, socios, pagos, check-ins y perfiles) y además los usuarios de acceso (auth.users)
// de ese gimnasio, para que el email quede libre y no queden usuarios huérfanos.
// Acción destructiva e irreversible — la UI pide doble confirmación.
export async function deleteGymAsAdmin(gymId: string): Promise<{ error?: string }> {
  const email = await requireAdminEmail();
  if (!email) return { error: "No autorizado" };
  if (!gymId) return { error: "Falta el gimnasio." };

  const admin = createAdminClient();

  // Usuarios de acceso de este gimnasio (para borrarlos de auth después del cascade).
  const { data: profs } = await admin.from("profiles").select("id").eq("gym_id", gymId);
  const userIds = ((profs as { id: string }[]) ?? []).map((p) => p.id);

  const { error: dErr } = await admin.from("gyms").delete().eq("id", gymId);
  if (dErr) return { error: "No se pudo eliminar el gimnasio." };

  // El gym borrado ya arrastró sus profiles; ahora quitamos los usuarios de auth,
  // EXCEPTO los que sean admin de la plataforma: borrar un gimnasio (p. ej. uno
  // fantasma creado con el email del admin) NUNCA debe eliminar el acceso del admin.
  const admins = adminEmails();
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid);
    const uEmail = (u.user?.email ?? "").toLowerCase();
    if (uEmail && admins.includes(uEmail)) continue;
    await admin.auth.admin.deleteUser(uid);
  }

  return {};
}

export async function setGymSubscription(
  gymId: string,
  status: SubscriptionStatus,
  paidUntil?: string | null,
): Promise<{ error?: string }> {
  const email = await requireAdminEmail();
  if (!email) return { error: "No autorizado" };

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { subscription_status: status };
  if (paidUntil !== undefined) patch.paid_until = paidUntil;
  const { error } = await admin.from("gyms").update(patch).eq("id", gymId);
  if (error) return { error: error.message };
  return {};
}
