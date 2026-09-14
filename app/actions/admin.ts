"use server";

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

// Devuelve el email del usuario logueado si es admin de la plataforma, o null.
async function requireAdminEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = (data.user?.email ?? "").toLowerCase();
  if (!email || !adminEmails().includes(email)) return null;
  return email;
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
  if (!adminEmails().includes(email)) return { authed: true, isAdmin: false, email };

  const admin = createAdminClient();
  const [{ data: gymRows }, { data: memberRows }] = await Promise.all([
    admin.from("gyms").select("id, name, currency, subscription_status, paid_until, created_at").order("created_at", { ascending: true }),
    admin.from("members").select("gym_id"),
  ]);

  const counts = new Map<string, number>();
  for (const m of (memberRows as { gym_id: string }[]) ?? []) {
    counts.set(m.gym_id, (counts.get(m.gym_id) ?? 0) + 1);
  }

  const gyms: AdminGym[] = ((gymRows as GymRow[]) ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    currency: g.currency,
    subscriptionStatus: g.subscription_status,
    paidUntil: g.paid_until,
    createdAt: g.created_at,
    memberCount: counts.get(g.id) ?? 0,
  }));

  return { authed: true, isAdmin: true, email, gyms };
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
