import type { AuthError } from "@supabase/supabase-js";

// Traduce los errores del login a mensajes para el usuario. Separa "datos incorrectos"
// de "el servidor no responde": con el proyecto pausado, antes la app decía "contraseña
// incorrecta" y culpaba al cliente de una caída nuestra.
export function loginErrorMessage(error: AuthError): string {
  if (error.status === 429) return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
  if (error.code === "email_not_confirmed") return "Confirmá tu email antes de entrar. Revisá tu correo.";
  if (error.status === 400) return "Email o contraseña incorrectos.";
  return "No pudimos conectarnos con el servidor. Probá de nuevo en unos minutos.";
}
