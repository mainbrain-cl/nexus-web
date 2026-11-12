// Textos del formulario de contacto. Ningún texto del formulario va escrito dentro de los componentes.
//
// Preguntas y opciones definidas por Domingo Soto Gamé (12-11), con su redacción.
// Los ids de opción son estables e independientes del texto: el servidor valida contra ellos y el correo
// a Domingo se arma siempre con los textos en español, aunque el visitante use otro idioma.
// Para traducir: copiar `es` como `en` o `pt` dentro de `formTexts` y traducir solo los valores.

export const locales = ["es", "en", "pt"] as const;
export type Locale = (typeof locales)[number];

// ---------- Ids estables ----------

export const clientIds = ["abogado", "aseguradora", "investigador", "empresa", "particular", "otro"] as const;
export type ClientId = (typeof clientIds)[number];

export const serviceIds = [
  "auditoria",
  "revision-propia",
  "litigacion",
  "controvertidas",
  "investigacion",
  "evaluacion",
  "capacitacion",
  "no-se",
] as const;
export type ServiceId = (typeof serviceIds)[number];

/**
 * Ids que también abren el formulario con un servicio ya elegido, para que coincidan con los ids de las
 * tarjetas de Servicios en `nexus.ts` (que usan otros nombres para dos de ellos).
 */
export const serviceAliases: Record<string, ServiceId> = {
  prejudicial: "evaluacion",
  formacion: "capacitacion",
  revision: "revision-propia",
};

export const statusIds = {
  revision: ["informe", "informes-distintos", "judicial", "evaluando-acciones", "antes-de-entrega"],
  incendio: ["reciente", "sitio-disponible", "sitio-intervenido", "no-se-si-es-posible"],
  general: ["informe", "informes-distintos", "judicial", "evaluando-acciones", "reciente", "otra"],
} as const;
export type StatusVariant = keyof typeof statusIds;
export type StatusId = (typeof statusIds)[StatusVariant][number];

/**
 * Qué variante del paso 3 ve cada servicio. `null` salta el paso.
 * - Capacitación: no hay un asunto ni un incendio que describir, así que se salta.
 * - "No tengo claridad": una variante general con las situaciones más frecuentes de las otras dos,
 *   para que Domingo pueda orientar la consulta.
 */
export const statusVariantByService: Record<ServiceId, StatusVariant | null> = {
  auditoria: "revision",
  "revision-propia": "revision",
  litigacion: "revision",
  controvertidas: "revision",
  evaluacion: "revision",
  investigacion: "incendio",
  capacitacion: null,
  "no-se": "general",
};

/** Servicios en que no hay un incendio puntual: el paso 4 no pide lugar ni fecha del incidente. */
export const servicesWithoutIncident: readonly ServiceId[] = ["capacitacion"];

export const urgencyIds = ["sin-plazo", "semanas", "urgente"] as const;
export type UrgencyId = (typeof urgencyIds)[number];

// ---------- Límites (los usan el formulario y el servidor) ----------

export const limits = {
  clienteOtro: 80,
  lugar: 120,
  fecha: 60,
  descripcion: 2000,
  descripcionMin: 10,
  plazoDetalle: 200,
  nombre: 100,
  nombreMin: 2,
  empresa: 120,
  correo: 254,
  telefono: 30,
} as const;

// ---------- Textos ----------

type Option<Id extends string> = { id: Id; label: string; hint?: string };

export type FormTexts = {
  /** Encabezado sobre el formulario. */
  intro: string;
  stepOf: (n: number, total: number) => string;
  back: string;
  next: string;
  submit: string;
  sending: string;
  optional: string;
  /** Aviso para lectores de pantalla al elegir varias opciones. */
  multiHint: string;
  steps: {
    cliente: { title: string; options: Option<ClientId>[]; otherLabel: string; otherPlaceholder: string };
    servicio: { title: string; options: Option<ServiceId>[] };
    estado: { title: string; help: string; variants: Record<StatusVariant, Option<StatusId>[]> };
    caso: {
      title: string;
      help: string;
      lugar: { label: string; placeholder: string };
      fecha: { label: string; placeholder: string };
      descripcion: { label: string; placeholder: string; placeholderCapacitacion: string };
      urgencia: { label: string; options: Option<UrgencyId>[] };
      plazoDetalle: { label: string; placeholder: string };
    };
    contacto: {
      title: string;
      nombre: { label: string; placeholder: string };
      empresa: { label: string; placeholder: string };
      correo: { label: string; placeholder: string };
      telefono: { label: string; placeholder: string };
      privacy: string;
    };
  };
  errors: {
    pick: string;
    pickSome: string;
    descripcion: string;
    nombre: string;
    correo: string;
    telefono: string;
    /** Respuestas del servidor */
    invalido: string;
    limite: string;
    noDisponible: string;
    red: string;
  };
  done: { title: string; text: (email: string) => string; again: string };
  failure: { title: string; whatsapp: string; email: string };
  /** Mensaje de WhatsApp cuando el envío falla. */
  whatsappText: (cliente: string, servicio: string) => string;
  /** Alternativas visibles bajo el formulario */
  alternatives: string;
};

const es: FormTexts = {
  intro: "Responda unas preguntas breves y Domingo recibirá su consulta directamente.",
  stepOf: (n, total) => `Paso ${n} de ${total}`,
  back: "Volver",
  next: "Continuar",
  submit: "Enviar consulta",
  sending: "Enviando…",
  optional: "opcional",
  multiHint: "Puede marcar más de una.",
  steps: {
    cliente: {
      title: "¿Quién solicita la asesoría?",
      options: [
        { id: "abogado", label: "Abogado o estudio jurídico" },
        { id: "aseguradora", label: "Compañía de seguros o empresa liquidadora" },
        { id: "investigador", label: "Investigador de incendios o perito" },
        { id: "empresa", label: "Empresa u organización" },
        { id: "particular", label: "Particular" },
        { id: "otro", label: "Otro" },
      ],
      otherLabel: "¿Quién?",
      otherPlaceholder: "Por ejemplo: municipalidad, junta de vecinos",
    },
    servicio: {
      title: "¿Qué servicio necesita?",
      options: [
        { id: "auditoria", label: "Auditoría técnica de un informe pericial" },
        {
          id: "revision-propia",
          label: "Revisión independiente de un informe propio antes de su entrega",
          hint: "Nuevo · pensado para investigadores",
        },
        { id: "litigacion", label: "Asesoría técnica para un procedimiento judicial" },
        { id: "controvertidas", label: "Revisión de pericias controvertidas" },
        { id: "investigacion", label: "Investigación del origen y causa de un incendio" },
        { id: "evaluacion", label: "Evaluación preliminar de antecedentes" },
        { id: "capacitacion", label: "Capacitación especializada" },
        { id: "no-se", label: "No tengo claridad sobre el servicio que necesito" },
      ],
    },
    estado: {
      title: "¿Cuál es el estado actual del asunto?",
      help: "Puede marcar más de una.",
      variants: {
        revision: [
          { id: "informe", label: "Existe un informe pericial que requiere revisión" },
          { id: "informes-distintos", label: "Existen dos o más informes con conclusiones diferentes" },
          { id: "judicial", label: "El asunto se encuentra en un procedimiento judicial" },
          { id: "evaluando-acciones", label: "Se está evaluando iniciar acciones judiciales" },
          { id: "antes-de-entrega", label: "Se requiere revisar un informe antes de su entrega" },
        ],
        incendio: [
          { id: "reciente", label: "El incendio ocurrió recientemente" },
          { id: "sitio-disponible", label: "El sitio se encuentra disponible para inspección" },
          { id: "sitio-intervenido", label: "El sitio ha sido modificado o intervenido" },
          { id: "no-se-si-es-posible", label: "No sé si todavía es posible realizar una investigación" },
        ],
        general: [
          { id: "informe", label: "Existe un informe pericial que requiere revisión" },
          { id: "informes-distintos", label: "Existen dos o más informes con conclusiones diferentes" },
          { id: "judicial", label: "El asunto se encuentra en un procedimiento judicial" },
          { id: "evaluando-acciones", label: "Se está evaluando iniciar acciones judiciales" },
          { id: "reciente", label: "Ocurrió un incendio recientemente" },
          { id: "otra", label: "Otra situación" },
        ],
      },
    },
    caso: {
      title: "Información básica del caso",
      help: "Esta información permite evaluar preliminarmente la naturaleza del encargo.",
      lugar: { label: "Lugar donde ocurrió el incendio", placeholder: "Comuna o ciudad" },
      fecha: { label: "Fecha aproximada del incidente", placeholder: "Por ejemplo: marzo de 2026" },
      descripcion: {
        label: "Breve descripción de la consulta",
        placeholder: "Cuéntenos en pocas líneas qué ocurrió y qué necesita.",
        placeholderCapacitacion: "Tema, cantidad aproximada de participantes y fechas tentativas.",
      },
      urgencia: {
        label: "¿Existen plazos relevantes o urgencia?",
        options: [
          { id: "sin-plazo", label: "Sin plazos urgentes" },
          { id: "semanas", label: "Hay un plazo en las próximas semanas" },
          { id: "urgente", label: "Es urgente" },
        ],
      },
      plazoDetalle: { label: "¿Cuál es el plazo?", placeholder: "Por ejemplo: audiencia el 15 de diciembre" },
    },
    contacto: {
      title: "Sus datos de contacto",
      nombre: { label: "Nombre", placeholder: "Nombre y apellido" },
      empresa: { label: "Empresa o institución", placeholder: "Estudio, compañía u organización" },
      correo: { label: "Correo electrónico", placeholder: "nombre@correo.cl" },
      telefono: { label: "Teléfono", placeholder: "+56 9 1234 5678" },
      privacy:
        "Sus datos se usan solo para responder esta consulta. Se envían directamente al correo de Domingo Soto Gamé y no se guardan en este sitio.",
    },
  },
  errors: {
    pick: "Elija una opción para continuar.",
    pickSome: "Marque al menos una opción para continuar.",
    descripcion: "Describa brevemente su consulta (al menos 10 caracteres).",
    nombre: "Indique su nombre.",
    correo: "Revise su correo electrónico: no parece válido.",
    telefono: "Revise el teléfono: use solo números, espacios y el signo +.",
    invalido: "Algunos datos no se pudieron validar. Revíselos e intente de nuevo.",
    limite: "Recibimos varias consultas seguidas desde su conexión. Espere unos minutos o escríbanos por WhatsApp.",
    noDisponible: "El envío por formulario no está disponible en este momento.",
    red: "No pudimos enviar su consulta. Revise su conexión e intente de nuevo.",
  },
  done: {
    title: "Consulta enviada",
    text: (email) => `Domingo recibió su consulta y le responderá a ${email}.`,
    again: "Enviar otra consulta",
  },
  failure: {
    title: "No pudimos enviar su consulta",
    whatsapp: "Escribir por WhatsApp",
    email: "O escriba a",
  },
  whatsappText: (cliente, servicio) =>
    `Hola Domingo, quiero solicitar una asesoría con NEXUS. Solicito como: ${cliente}. Servicio: ${servicio}.`,
  alternatives: "¿Prefiere hablar directamente?",
};

export const formTexts: { es: FormTexts } & Partial<Record<Locale, FormTexts>> = { es };

/** Textos en el idioma pedido; mientras no exista la traducción, en español. */
export const getFormTexts = (locale: Locale = "es"): FormTexts => formTexts[locale] ?? formTexts.es;

// ---------- Correo a Domingo (siempre en español) ----------

export const emailTexts = {
  subject: (cliente: string, servicio: string) => `Consulta web: ${cliente} · ${servicio}`,
  heading: "Nueva consulta desde el sitio web",
  sections: {
    cliente: "1. Quién solicita",
    servicio: "2. Servicio",
    estado: "3. Estado actual del asunto",
    caso: "4. Información del caso",
    contacto: "5. Datos de contacto",
  },
  labels: {
    lugar: "Lugar",
    fecha: "Fecha aproximada",
    descripcion: "Descripción",
    urgencia: "Plazos o urgencia",
    plazoDetalle: "Detalle del plazo",
    nombre: "Nombre",
    empresa: "Empresa o institución",
    correo: "Correo",
    telefono: "Teléfono",
  },
  empty: "No indicado",
  skipped: "No aplica",
  replyHint: "Responda este correo para contestar directamente al remitente.",
  footer: (fecha: string, idioma: string) => `Enviado desde el formulario de nexuschile.net el ${fecha} (idioma del formulario: ${idioma}).`,
};

// ---------- Abrir el formulario con un servicio ya elegido ----------

/** Nombre del evento de ventana que abre el formulario con un servicio elegido. */
export const openFormEvent = "nexus:contacto";

/** Enlace que lleva a Contacto con el servicio ya elegido, por ejemplo `#contacto?servicio=auditoria`. */
export const contactFormHref = (servicio: ServiceId | keyof typeof serviceAliases) => `#contacto?servicio=${servicio}`;

/** Convierte un id de servicio o un alias en un id válido, o `null`. */
export function resolveServiceId(value: string | null | undefined): ServiceId | null {
  if (!value) return null;
  if ((serviceIds as readonly string[]).includes(value)) return value as ServiceId;
  return serviceAliases[value] ?? null;
}
