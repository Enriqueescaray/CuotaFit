"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { amIPlatformAdmin } from "./admin";

// Alta self-service: el propio usuario logueado (por Google o email) crea SU gimnasio.
// Es la versión pública de createGymAsAdmin (app/actions/admin.ts): mismo trial de 7 días
// y mismos planes por defecto, pero atada a auth.uid() en vez de a un email que elige el admin.
export async function createMyGym(gymName: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { error: "Tenés que iniciar sesión primero." };

  // El admin de la plataforma no crea gimnasio propio (gestiona todo desde /admin).
  if (await amIPlatformAdmin()) return { error: "Tu cuenta administra la plataforma; los gimnasios se gestionan desde el panel." };

  const name = (gymName ?? "").trim();
  if (!name) return { error: "Escribí el nombre de tu gimnasio." };

  const admin = createAdminClient();

  // ¿Este usuario ya tiene gimnasio? No creamos otro (evita duplicados y trials repetidos).
  const { data: existing } = await admin.from("profiles").select("gym_id").eq("id", user.id).maybeSingle();
  if ((existing as { gym_id: string | null } | null)?.gym_id) return { ok: true };

  // Prueba gratuita de 7 días: arranca en 'trial' y se bloquea sola al vencer `paid_until`
  // (ver subscriptionBlock en lib/data.ts). Vos la pasás a 'active' desde /admin al cobrar.
  const trialUntil = new Date();
  trialUntil.setDate(trialUntil.getDate() + 7);
  const paidUntil = trialUntil.toISOString().slice(0, 10);

  const { data: gym, error: gErr } = await admin
    .from("gyms")
    .insert({ name, currency: "ARS", locale: "es-AR", subscription_status: "trial", paid_until: paidUntil })
    .select("id")
    .single();
  if (gErr || !gym) return { error: "No se pudo crear el gimnasio. Probá de nuevo." };

  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, gym_id: gym.id, role: "owner", name });
  if (pErr) {
    await admin.from("gyms").delete().eq("id", gym.id); // rollback: no dejar el gym huérfano
    return { error: "No se pudo vincular tu perfil. Probá de nuevo." };
  }

  await admin.from("plans").insert([
    { gym_id: gym.id, type: "tiempo", name: "Mensual", duration_months: 1, price: 18000 },
    { gym_id: gym.id, type: "pases", name: "Pack 10 clases", pass_count: 10, validity_days: 30, price: 22000 },
  ]);

  return { ok: true };
}
