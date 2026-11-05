// Contacto de soporte y datos de pago de Cuotafit. Para WhatsApp, los celulares de
// Argentina llevan un 9 después del 54.
export const SUPPORT_PHONE = "+54 387 581-6759";

export const SUBSCRIPTION_PRICE = "$ 120.000 por mes";
export const PAYMENT_ALIAS = "enrique.escaray";

const whatsappUrl = (text: string) => `https://wa.me/5493875816759?text=${encodeURIComponent(text)}`;

export const RECOVERY_WHATSAPP_URL = whatsappUrl("Hola, olvidé mi contraseña de Cuotafit. Mi email es: ");

export function receiptWhatsappUrl(gymName: string) {
  return whatsappUrl(`Hola, te mando el comprobante de pago de Cuotafit para ${gymName}.`);
}
