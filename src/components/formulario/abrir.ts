import { openFormEvent, type ServiceId } from "@/data/formulario";

/**
 * Lleva al visitante a Contacto con el formulario abierto y el servicio ya elegido.
 * Alternativa sin JS propio: un enlace a `contactFormHref(id)` (`#contacto?servicio=auditoria`).
 */
export function openContactForm(servicio?: ServiceId | "prejudicial" | "formacion") {
  window.dispatchEvent(new CustomEvent(openFormEvent, { detail: { servicio } }));
}
