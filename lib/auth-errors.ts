import type { AuthError } from "@supabase/supabase-js";

// Traduce los errores de Supabase Auth a mensajes para el usuario. Separa "datos
// incorrectos" de "el servidor no responde": con el proyecto pausado, antes la app
// decía "contraseña incorrecta" y culpaba al cliente de una caída nuestra.
const CONNECTION = "No pudimos conectarnos con el servidor. Probá de nuevo en unos minutos.";

export function loginErrorMessage(error: AuthError): string {
  if (error.status === 429) return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
  if (error.code === "email_not_confirmed") return "Confirmá tu email antes de entrar. Revisá tu correo.";
  if (error.status === 400) return "Email o contraseña incorrectos.";
  return CONNECTION;
}

export function recoveryErrorMessage(error: AuthError): string {
  // Sin SMTP propio, Supabase solo le manda mails a los miembros de la organización.
  if (error.code === "email_address_not_authorized") {
    return "No pudimos enviarte el mail. Escribinos por el canal donde contrataste Cuotafit y te ayudamos a recuperar tu cuenta.";
  }
  if (error.status === 429) return "Ya pediste varios mails. Esperá un rato y probá de nuevo.";
  return CONNECTION;
}

export function newPasswordErrorMessage(error: AuthError): string {
  if (error.code === "same_password") return "La contraseña nueva tiene que ser distinta de la anterior.";
  if (error.code === "weak_password") return "Esa contraseña es muy débil. Probá con una más larga.";
  if (error.code === "session_not_found" || error.status === 401 || error.status === 403) {
    return "El link venció. Pedí uno nuevo para cambiar tu contraseña.";
  }
  return CONNECTION;
}
