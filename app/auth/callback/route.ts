import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google (y cualquier OAuth) vuelve acá con un `code`. Lo canjeamos por una sesión
// y mandamos al usuario a /bienvenida, que decide: si ya tiene gimnasio va al
// dashboard, y si no, le pide el nombre y le crea la cuenta con los 7 días de prueba.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/bienvenida";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
