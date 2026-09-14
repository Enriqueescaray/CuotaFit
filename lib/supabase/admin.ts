import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la clave secreta (service role): SALTA RLS. Usar SOLO en el servidor
// (Server Actions / Route Handlers), nunca en componentes de cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
