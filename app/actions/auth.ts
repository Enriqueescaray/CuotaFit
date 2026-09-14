"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateAccountInput {
  gymName: string;
  name: string;
  email: string;
  password: string;
}
export interface CreateAccountResult {
  error?: string;
}

// Registro self-serve: crea el usuario (auto-confirmado), su gimnasio, el perfil
// como owner y un par de planes por defecto. NO inicia sesión: eso lo hace el
// cliente después (con el browser client, que setea las cookies de forma fiable).
export async function createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
  const gymName = (input.gymName ?? "").trim();
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const password = input.password ?? "";

  if (!gymName || !name || !email) return { error: "Completá todos los campos." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const admin = createAdminClient();

  // 1. Crear el usuario (confirmado, para poder entrar sin verificar email).
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (cErr || !created?.user) {
    const already = cErr?.message?.toLowerCase().includes("already") || cErr?.message?.toLowerCase().includes("registered");
    return { error: already ? "Ese email ya está registrado." : "No se pudo crear la cuenta." };
  }
  const userId = created.user.id;

  // 2. Crear el gimnasio.
  const { data: gym, error: gErr } = await admin.from("gyms").insert({ name: gymName }).select("id").single();
  if (gErr || !gym) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "No se pudo crear el gimnasio." };
  }

  // 3. Vincular el perfil como owner.
  const { error: pErr } = await admin.from("profiles").insert({ id: userId, gym_id: gym.id, role: "owner", name });
  if (pErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "No se pudo vincular el perfil." };
  }

  // 4. Planes por defecto para que el gimnasio no arranque vacío.
  await admin.from("plans").insert([
    { gym_id: gym.id, type: "tiempo", name: "Mensual", duration_months: 1, price: 600 },
    { gym_id: gym.id, type: "pases", name: "Pack 10 clases", pass_count: 10, validity_days: 30, price: 850 },
  ]);

  return {};
}
