// Reglas del formulario de contacto, compartidas por el navegador y el servidor.
// El servidor es la autoridad: vuelve a validar todo con estas mismas reglas y listas blancas.

import {
  clientIds,
  limits,
  locales,
  serviceIds,
  servicesWithoutIncident,
  statusIds,
  statusVariantByService,
  urgencyIds,
  type ClientId,
  type Locale,
  type ServiceId,
  type StatusId,
  type UrgencyId,
} from "@/data/formulario";

/** Lo que el formulario envía al servidor. */
export type ContactPayload = {
  cliente: ClientId;
  clienteOtro: string;
  servicio: ServiceId;
  estado: StatusId[];
  lugar: string;
  fecha: string;
  descripcion: string;
  urgencia: UrgencyId | "";
  plazoDetalle: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  idioma: Locale;
};

// Correo: parte local y dominio con al menos un punto, sin espacios ni caracteres de control.
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PHONE = /^\+?[0-9 ()\-.]{6,30}$/;
// Caracteres de control, separadores de línea Unicode y marcas de dirección (que pueden disfrazar texto).
const CONTROL_ALL = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/;
// En textos largos se permite el salto de línea y la tabulación.
const CONTROL_MULTILINE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/;

export const isEmail = (v: string) => v.length <= limits.correo && EMAIL.test(v);
export const isPhone = (v: string) => PHONE.test(v) && /[0-9].*[0-9].*[0-9].*[0-9].*[0-9].*[0-9]/.test(v);

/** Texto de una línea: recorta espacios y une los espacios repetidos. */
export const cleanLine = (v: string) => v.trim().replace(/\s+/g, " ");
/** Texto de varias líneas: normaliza saltos de línea y recorta. */
export const cleanMultiline = (v: string) => v.replace(/\r\n?/g, "\n").trim();

type Result = { ok: true; data: ContactPayload } | { ok: false };

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);

/** Texto de una línea opcional o requerido, con largo máximo y sin caracteres de control. */
function line(v: unknown, max: number, min = 0): string | null {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") return null;
  // Antes de limpiar: un salto de línea o un carácter de control invalida el campo, no se disimula.
  if (v.length > max * 2 || CONTROL_ALL.test(v)) return null;
  const s = cleanLine(v);
  if (s.length > max || s.length < min) return null;
  return s;
}

function multiline(v: unknown, max: number, min: number): string | null {
  if (typeof v !== "string" || v.length > max * 2) return null;
  const s = cleanMultiline(v);
  if (CONTROL_MULTILINE.test(s) || s.length > max || s.length < min) return null;
  return s;
}

/**
 * Valida el cuerpo completo contra las listas blancas y los límites. Cualquier campo de más, de tipo
 * equivocado o fuera de lista invalida el envío entero.
 */
export function validatePayload(input: unknown): Result {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false };
  const o = input as Record<string, unknown>;

  const allowed = new Set([
    "cliente", "clienteOtro", "servicio", "estado", "lugar", "fecha", "descripcion", "urgencia",
    "plazoDetalle", "nombre", "empresa", "correo", "telefono", "idioma",
  ]);
  if (Object.keys(o).some((k) => !allowed.has(k))) return { ok: false };

  if (!oneOf(clientIds, o.cliente) || !oneOf(serviceIds, o.servicio)) return { ok: false };
  const idioma = o.idioma === undefined ? "es" : o.idioma;
  if (!oneOf(locales, idioma)) return { ok: false };

  // Paso 3: solo ids de la variante que corresponde al servicio, sin repetir.
  const variant = statusVariantByService[o.servicio];
  const estadoIn = o.estado === undefined ? [] : o.estado;
  if (!Array.isArray(estadoIn) || estadoIn.length > 10) return { ok: false };
  const permitted: readonly string[] = variant ? statusIds[variant] : [];
  if (!estadoIn.every((e) => oneOf(permitted, e))) return { ok: false };
  const estado = [...new Set(estadoIn as StatusId[])];
  if (variant && estado.length === 0) return { ok: false };

  const urgenciaIn = o.urgencia ?? "";
  if (urgenciaIn !== "" && !oneOf(urgencyIds, urgenciaIn)) return { ok: false };

  const clienteOtro = line(o.clienteOtro, limits.clienteOtro);
  const noIncident = servicesWithoutIncident.includes(o.servicio);
  const lugar = line(o.lugar, limits.lugar);
  const fecha = line(o.fecha, limits.fecha);
  const descripcion = multiline(o.descripcion, limits.descripcion, limits.descripcionMin);
  const plazoDetalle = line(o.plazoDetalle, limits.plazoDetalle);
  const nombre = line(o.nombre, limits.nombre, limits.nombreMin);
  const empresa = line(o.empresa, limits.empresa);
  const correo = line(o.correo, limits.correo);
  const telefono = line(o.telefono, limits.telefono);

  if (
    clienteOtro === null || lugar === null || fecha === null || descripcion === null || plazoDetalle === null ||
    nombre === null || empresa === null || correo === null || telefono === null
  ) {
    return { ok: false };
  }
  if (!isEmail(correo)) return { ok: false };
  if (telefono && !isPhone(telefono)) return { ok: false };

  return {
    ok: true,
    data: {
      cliente: o.cliente,
      clienteOtro: o.cliente === "otro" ? clienteOtro : "",
      servicio: o.servicio,
      estado,
      lugar: noIncident ? "" : lugar,
      fecha: noIncident ? "" : fecha,
      descripcion,
      urgencia: urgenciaIn as UrgencyId | "",
      plazoDetalle: urgenciaIn === "" || urgenciaIn === "sin-plazo" ? "" : plazoDetalle,
      nombre,
      empresa: o.cliente === "particular" ? "" : empresa,
      correo,
      telefono,
      idioma,
    },
  };
}
