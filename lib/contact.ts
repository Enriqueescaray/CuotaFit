// Contacto de soporte de Cuotafit. Para WhatsApp, los celulares de Argentina llevan
// un 9 después del 54.
export const SUPPORT_PHONE = "+54 387 581-6759";

const whatsappUrl = (text: string) => `https://wa.me/5493875816759?text=${encodeURIComponent(text)}`;

export const RECOVERY_WHATSAPP_URL = whatsappUrl("Hola, olvidé mi contraseña de Cuotafit. Mi email es: ");

export function subscriptionWhatsappUrl(gymName: string) {
  return whatsappUrl(`Hola, quiero activar mi suscripción de Cuotafit para ${gymName}.`);
}
