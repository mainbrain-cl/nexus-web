// Textos del formulario de contacto. Ningún texto del formulario va escrito dentro de los componentes.
//
// Preguntas y opciones definidas por Domingo Soto Gamé (12-11), con su redacción.
// Los ids de opción son estables e independientes del texto: el servidor valida contra ellos y el correo
// a Domingo se arma siempre con los textos en español, aunque el visitante use otro idioma.
// Los tres idiomas (`es`, `en`, `pt`) tienen la misma forma: TypeScript falla si a uno le falta un texto.

import type { Locale } from "./idiomas";

export { locales, type Locale } from "./idiomas";

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

/** Opciones del paso 3, cada variante con sus propios ids. */
type StatusOptions = { [V in StatusVariant]: Option<(typeof statusIds)[V][number]>[] };

export type FormTexts = {
  stepOf: (n: number, total: number) => string;
  back: string;
  next: string;
  submit: string;
  sending: string;
  optional: string;
  /** Etiqueta del campo trampa para robots (invisible para las personas). */
  honeypotLabel: string;
  /** Valor en el mensaje de WhatsApp cuando aún no se eligió quién solicita o el servicio. */
  unknown: string;
  steps: {
    cliente: { title: string; options: Option<ClientId>[]; otherLabel: string; otherPlaceholder: string };
    servicio: { title: string; options: Option<ServiceId>[] };
    estado: { title: string; help: string; variants: StatusOptions };
    caso: {
      title: string;
      help: string;
      /** Título y ayuda cuando el servicio es capacitación (no hay incidente). */
      titleCapacitacion: string;
      helpCapacitacion: string;
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
    descripcion: (min: number) => string;
    nombre: string;
    /** El correo quedó vacío. */
    correoVacio: string;
    /** El correo no tiene un formato válido. */
    correo: string;
    telefono: string;
    /** Respuestas del servidor */
    invalido: string;
    limite: string;
    noDisponible: string;
    /** El servidor recibió la consulta pero el servicio de correo falló. */
    envio: string;
    /** La verificación anti-robots (Turnstile) no se superó. */
    verificacion: string;
    /** El formulario estuvo abierto demasiado tiempo. */
    vencido: string;
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
  stepOf: (n, total) => `Paso ${n} de ${total}`,
  back: "Volver",
  next: "Continuar",
  submit: "Enviar consulta",
  sending: "Enviando…",
  optional: "opcional",
  honeypotLabel: "Sitio web",
  unknown: "-",
  steps: {
    cliente: {
      title: "¿Quién solicita la asesoría?",
      options: [
        { id: "abogado", label: "Abogado o estudio jurídico" },
        { id: "aseguradora", label: "Compañía de seguros o empresa liquidadora" },
        { id: "investigador", label: "Investigador, perito o empresa de investigación" },
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
          label: "Revisión independiente de su informe pericial",
          hint: "Pensado para investigadores y empresas de investigación",
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
      titleCapacitacion: "Sobre la capacitación",
      helpCapacitacion: "Cuéntenos el tema, cuántas personas participarían y las fechas tentativas.",
      lugar: { label: "Lugar donde ocurrió el incendio", placeholder: "Comuna o ciudad" },
      fecha: { label: "Fecha aproximada del incidente", placeholder: "Por ejemplo: marzo de 2026" },
      descripcion: {
        label: "Breve descripción de la consulta",
        placeholder: "Cuéntenos en pocas líneas qué ocurrió y qué necesita.",
        placeholderCapacitacion: "Por ejemplo: investigación de incendios para 12 brigadistas, en marzo.",
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
    descripcion: (min) => `Describa brevemente su consulta (al menos ${min} caracteres).`,
    nombre: "Indique su nombre.",
    correoVacio: "Indique su correo electrónico.",
    correo: "Revise su correo electrónico: no parece válido.",
    telefono: "Revise el teléfono: use solo números, espacios, el signo + y los símbolos ( ), - y punto.",
    invalido: "Algunos datos no se pudieron validar. Revíselos e intente de nuevo.",
    limite: "Recibimos varias consultas seguidas desde su conexión. Espere unos minutos o escríbanos por WhatsApp.",
    noDisponible: "El envío por formulario no está disponible en este momento.",
    envio: "El servicio de correo no respondió y su consulta no se envió. Intente de nuevo en unos minutos o escríbanos por WhatsApp.",
    verificacion: "No pudimos confirmar que el envío viene de una persona. Intente de nuevo o escríbanos por WhatsApp.",
    vencido: "El formulario estuvo abierto mucho tiempo. Presione Enviar consulta de nuevo.",
    red: "Revise su conexión a internet e intente de nuevo.",
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

const en: FormTexts = {
  stepOf: (n, total) => `Step ${n} of ${total}`,
  back: "Back",
  next: "Continue",
  submit: "Send inquiry",
  sending: "Sending…",
  optional: "optional",
  honeypotLabel: "Website",
  unknown: "-",
  steps: {
    cliente: {
      title: "Who is requesting the consultation?",
      options: [
        { id: "abogado", label: "Attorney or law firm" },
        { id: "aseguradora", label: "Insurance company or claims adjusting firm" },
        { id: "investigador", label: "Investigator, expert or investigation firm" },
        { id: "empresa", label: "Company or organization" },
        { id: "particular", label: "Individual" },
        { id: "otro", label: "Other" },
      ],
      otherLabel: "Who?",
      otherPlaceholder: "For example: municipality, homeowners association",
    },
    servicio: {
      title: "What service do you need?",
      options: [
        { id: "auditoria", label: "Technical audit of an expert report" },
        {
          id: "revision-propia",
          label: "Independent review of your expert report",
          hint: "Designed for investigators and investigation firms",
        },
        { id: "litigacion", label: "Technical support in court proceedings" },
        { id: "controvertidas", label: "Review of disputed expert findings" },
        { id: "investigacion", label: "Investigation of the origin and cause of a fire" },
        { id: "evaluacion", label: "Preliminary evaluation of the available information" },
        { id: "capacitacion", label: "Specialized training" },
        { id: "no-se", label: "I'm not sure which service I need" },
      ],
    },
    estado: {
      title: "What is the current status of the matter?",
      help: "You may select more than one.",
      variants: {
        revision: [
          { id: "informe", label: "There is an expert report that needs review" },
          { id: "informes-distintos", label: "There are two or more reports with different conclusions" },
          { id: "judicial", label: "The matter is in court proceedings" },
          { id: "evaluando-acciones", label: "Legal action is being considered" },
          { id: "antes-de-entrega", label: "A report needs to be reviewed before submission" },
        ],
        incendio: [
          { id: "reciente", label: "The fire occurred recently" },
          { id: "sitio-disponible", label: "The scene is available for inspection" },
          { id: "sitio-intervenido", label: "The scene has been altered or disturbed" },
          { id: "no-se-si-es-posible", label: "I'm not sure an investigation is still possible" },
        ],
        general: [
          { id: "informe", label: "There is an expert report that needs review" },
          { id: "informes-distintos", label: "There are two or more reports with different conclusions" },
          { id: "judicial", label: "The matter is in court proceedings" },
          { id: "evaluando-acciones", label: "Legal action is being considered" },
          { id: "reciente", label: "A fire occurred recently" },
          { id: "otra", label: "Other situation" },
        ],
      },
    },
    caso: {
      title: "Basic case information",
      help: "This information allows a preliminary assessment of the nature of the engagement.",
      titleCapacitacion: "About the training",
      helpCapacitacion: "Tell us the topic, how many people would take part and tentative dates.",
      lugar: { label: "Where the fire occurred", placeholder: "City or town" },
      fecha: { label: "Approximate date of the incident", placeholder: "For example: March 2026" },
      descripcion: {
        label: "Brief description of your inquiry",
        placeholder: "Tell us in a few lines what happened and what you need.",
        placeholderCapacitacion: "For example: fire investigation for 12 firefighters, in March.",
      },
      urgencia: {
        label: "Are there relevant deadlines or urgency?",
        options: [
          { id: "sin-plazo", label: "No urgent deadlines" },
          { id: "semanas", label: "There is a deadline in the coming weeks" },
          { id: "urgente", label: "It is urgent" },
        ],
      },
      plazoDetalle: { label: "What is the deadline?", placeholder: "For example: hearing on December 15" },
    },
    contacto: {
      title: "Your contact details",
      nombre: { label: "Name", placeholder: "First and last name" },
      empresa: { label: "Company or institution", placeholder: "Firm, company or organization" },
      correo: { label: "Email", placeholder: "name@company.com" },
      telefono: { label: "Phone", placeholder: "+1 555 123 4567" },
      privacy:
        "Your information is used only to answer this inquiry. It goes directly to Domingo Soto Gamé's email and is not stored on this site.",
    },
  },
  errors: {
    pick: "Choose an option to continue.",
    pickSome: "Select at least one option to continue.",
    descripcion: (min) => `Briefly describe your inquiry (at least ${min} characters).`,
    nombre: "Please enter your name.",
    correoVacio: "Please enter your email address.",
    correo: "Please check your email address: it does not appear to be valid.",
    telefono: "Please check the phone number: use only digits, spaces, the + sign and the symbols ( ), - and period.",
    invalido: "Some of the information could not be validated. Please review it and try again.",
    limite: "We received several inquiries in a row from your connection. Please wait a few minutes or message us on WhatsApp.",
    noDisponible: "The form is not available right now.",
    envio: "The email service did not respond and your inquiry was not sent. Please try again in a few minutes or message us on WhatsApp.",
    verificacion: "We could not confirm that the inquiry comes from a person. Please try again or message us on WhatsApp.",
    vencido: "The form was open for a long time. Please press Send inquiry again.",
    red: "Please check your internet connection and try again.",
  },
  done: {
    title: "Inquiry sent",
    text: (email) => `Domingo has received your inquiry and will reply to ${email}.`,
    again: "Send another inquiry",
  },
  failure: {
    title: "We could not send your inquiry",
    whatsapp: "Message on WhatsApp",
    email: "Or write to",
  },
  whatsappText: (cliente, servicio) =>
    `Hello Domingo, I would like to request a consultation with NEXUS. Requesting as: ${cliente}. Service: ${servicio}.`,
  alternatives: "Prefer to talk directly?",
};

const pt: FormTexts = {
  stepOf: (n, total) => `Etapa ${n} de ${total}`,
  back: "Voltar",
  next: "Continuar",
  submit: "Enviar consulta",
  sending: "Enviando…",
  optional: "opcional",
  honeypotLabel: "Site",
  unknown: "-",
  steps: {
    cliente: {
      title: "Quem está solicitando a assessoria?",
      options: [
        { id: "abogado", label: "Advogado ou escritório de advocacia" },
        { id: "aseguradora", label: "Seguradora ou empresa de regulação de sinistros" },
        { id: "investigador", label: "Investigador, perito ou empresa de investigação" },
        { id: "empresa", label: "Empresa ou organização" },
        { id: "particular", label: "Pessoa física" },
        { id: "otro", label: "Outro" },
      ],
      otherLabel: "Quem?",
      otherPlaceholder: "Por exemplo: prefeitura, associação de moradores",
    },
    servicio: {
      title: "De qual serviço você precisa?",
      options: [
        { id: "auditoria", label: "Auditoria técnica de um laudo pericial" },
        {
          id: "revision-propia",
          label: "Revisão independente do seu laudo pericial",
          hint: "Pensado para investigadores e empresas de investigação",
        },
        { id: "litigacion", label: "Assessoria técnica para um processo judicial" },
        { id: "controvertidas", label: "Revisão de perícias controvertidas" },
        { id: "investigacion", label: "Investigação da origem e da causa de um incêndio" },
        { id: "evaluacion", label: "Avaliação preliminar das informações disponíveis" },
        { id: "capacitacion", label: "Capacitação especializada" },
        { id: "no-se", label: "Não sei ao certo de qual serviço preciso" },
      ],
    },
    estado: {
      title: "Qual é a situação atual do caso?",
      help: "Você pode marcar mais de uma.",
      variants: {
        revision: [
          { id: "informe", label: "Há um laudo pericial que precisa ser revisado" },
          { id: "informes-distintos", label: "Há dois ou mais laudos com conclusões diferentes" },
          { id: "judicial", label: "O caso está em um processo judicial" },
          { id: "evaluando-acciones", label: "Está sendo avaliado o ajuizamento de uma ação" },
          { id: "antes-de-entrega", label: "É preciso revisar um laudo antes da entrega" },
        ],
        incendio: [
          { id: "reciente", label: "O incêndio ocorreu recentemente" },
          { id: "sitio-disponible", label: "O local está disponível para inspeção" },
          { id: "sitio-intervenido", label: "O local foi modificado ou alterado" },
          { id: "no-se-si-es-posible", label: "Não sei se ainda é possível realizar uma investigação" },
        ],
        general: [
          { id: "informe", label: "Há um laudo pericial que precisa ser revisado" },
          { id: "informes-distintos", label: "Há dois ou mais laudos com conclusões diferentes" },
          { id: "judicial", label: "O caso está em um processo judicial" },
          { id: "evaluando-acciones", label: "Está sendo avaliado o ajuizamento de uma ação" },
          { id: "reciente", label: "Ocorreu um incêndio recentemente" },
          { id: "otra", label: "Outra situação" },
        ],
      },
    },
    caso: {
      title: "Informações básicas do caso",
      help: "Essas informações permitem uma avaliação preliminar da natureza do trabalho.",
      titleCapacitacion: "Sobre o treinamento",
      helpCapacitacion: "Conte-nos o tema, quantas pessoas participariam e as datas previstas.",
      lugar: { label: "Local onde ocorreu o incêndio", placeholder: "Cidade ou município" },
      fecha: { label: "Data aproximada do incidente", placeholder: "Por exemplo: março de 2026" },
      descripcion: {
        label: "Breve descrição da consulta",
        placeholder: "Conte em poucas linhas o que aconteceu e do que você precisa.",
        placeholderCapacitacion: "Por exemplo: investigação de incêndios para 12 brigadistas, em março.",
      },
      urgencia: {
        label: "Há prazos relevantes ou urgência?",
        options: [
          { id: "sin-plazo", label: "Sem prazos urgentes" },
          { id: "semanas", label: "Há um prazo nas próximas semanas" },
          { id: "urgente", label: "É urgente" },
        ],
      },
      plazoDetalle: { label: "Qual é o prazo?", placeholder: "Por exemplo: audiência em 15 de dezembro" },
    },
    contacto: {
      title: "Seus dados de contato",
      nombre: { label: "Nome", placeholder: "Nome e sobrenome" },
      empresa: { label: "Empresa ou instituição", placeholder: "Escritório, empresa ou organização" },
      correo: { label: "E-mail", placeholder: "nome@empresa.com.br" },
      telefono: { label: "Telefone", placeholder: "+55 11 91234 5678" },
      privacy:
        "Seus dados são usados apenas para responder a esta consulta. Eles são enviados diretamente ao e-mail de Domingo Soto Gamé e não ficam armazenados neste site.",
    },
  },
  errors: {
    pick: "Escolha uma opção para continuar.",
    pickSome: "Marque pelo menos uma opção para continuar.",
    descripcion: (min) => `Descreva brevemente sua consulta (pelo menos ${min} caracteres).`,
    nombre: "Informe seu nome.",
    correoVacio: "Informe seu e-mail.",
    correo: "Verifique seu e-mail: ele não parece válido.",
    telefono: "Verifique o telefone: use apenas números, espaços, o sinal + e os símbolos ( ), - e ponto.",
    invalido: "Alguns dados não puderam ser validados. Revise-os e tente novamente.",
    limite: "Recebemos várias consultas seguidas da sua conexão. Aguarde alguns minutos ou fale conosco pelo WhatsApp.",
    noDisponible: "O envio pelo formulário não está disponível no momento.",
    envio: "O serviço de e-mail não respondeu e sua consulta não foi enviada. Tente novamente em alguns minutos ou fale conosco pelo WhatsApp.",
    verificacion: "Não foi possível confirmar que o envio vem de uma pessoa. Tente novamente ou fale conosco pelo WhatsApp.",
    vencido: "O formulário ficou aberto por muito tempo. Clique em Enviar consulta novamente.",
    red: "Verifique sua conexão com a internet e tente novamente.",
  },
  done: {
    title: "Consulta enviada",
    text: (email) => `Domingo recebeu sua consulta e responderá para ${email}.`,
    again: "Enviar outra consulta",
  },
  failure: {
    title: "Não foi possível enviar sua consulta",
    whatsapp: "Escrever pelo WhatsApp",
    email: "Ou escreva para",
  },
  whatsappText: (cliente, servicio) =>
    `Olá, Domingo. Gostaria de solicitar uma assessoria da NEXUS. Solicito como: ${cliente}. Serviço: ${servicio}.`,
  alternatives: "Prefere falar diretamente?",
};

export const formTexts: Record<Locale, FormTexts> = { es, en, pt };

/** Textos del formulario en el idioma de la página. */
export const getFormTexts = (locale: Locale = "es"): FormTexts => formTexts[locale];

// ---------- Correo a Domingo (siempre en español) ----------

export const emailTexts = {
  /**
   * Asunto: solo textos de estas listas y la hora de Chile, nunca algo escrito por el visitante. La hora hace
   * único cada asunto, para que Gmail no junte en una misma conversación las consultas de personas distintas.
   */
  subject: (servicio: string, cliente: string, hora: string, urgente: boolean) =>
    `${urgente ? "URGENTE · " : ""}Consulta web: ${servicio} · ${cliente} · ${hora}`,
  /** Nombres cortos para el asunto: en el celular se ven los primeros 40 a 50 caracteres. */
  short: {
    cliente: {
      abogado: "Abogado",
      aseguradora: "Aseguradora o liquidadora",
      investigador: "Investigador o perito",
      empresa: "Empresa",
      particular: "Particular",
      otro: "Otro",
    } satisfies Record<ClientId, string>,
    servicio: {
      auditoria: "Auditoría de informe pericial",
      "revision-propia": "Revisión de informe propio",
      litigacion: "Asesoría para procedimiento judicial",
      controvertidas: "Pericias controvertidas",
      investigacion: "Investigación de incendio",
      evaluacion: "Evaluación preliminar",
      capacitacion: "Capacitación",
      "no-se": "Servicio por definir",
    } satisfies Record<ServiceId, string>,
  },
  /** Texto alternativo del logo y marca en el texto plano. */
  brand: "NEXUS",
  eyebrow: "Formulario de contacto",
  heading: "Nueva consulta desde el sitio web",
  summary: {
    title: "Resumen",
    solicita: "Solicita",
    servicio: "Servicio",
    urgencia: "Urgencia",
    idioma: "Idioma",
    recibida: "Recibida",
    /** Hora de Chile continental, que es la de Domingo. */
    recibidaValue: (fecha: string) => `${fecha} (hora de Chile)`,
    /** Solo se muestra si el visitante usó el sitio en otro idioma. */
    idiomaValue: (idioma: string) => `El visitante usó el sitio en ${idioma}`,
  },
  languages: { es: "español", en: "inglés", pt: "portugués" } satisfies Record<Locale, string>,
  sections: {
    descripcion: "Descripción de la consulta",
    estado: "Estado actual del asunto",
    caso: "Información del caso",
    /** Título del bloque del caso cuando el servicio es capacitación: no hay un caso ni un incendio. */
    capacitacion: "Sobre la capacitación",
    contacto: "Datos de contacto",
    responder: "Responder",
  },
  labels: {
    cliente: "Quién solicita",
    /** Lo que el visitante escribió en "¿Quién?" al elegir "Otro". */
    clienteOtro: "Se identifica como",
    lugar: "Lugar",
    fecha: "Fecha aproximada",
    urgencia: "Plazos o urgencia",
    plazoDetalle: "Detalle del plazo",
    nombre: "Nombre",
    empresa: "Empresa o institución",
    correo: "Correo",
    telefono: "Teléfono",
    whatsapp: "WhatsApp",
  },
  /** Marca bajo el nombre en el encabezado: es lo único de esa zona que escribió el visitante. */
  visitorData: "Dato escrito por el visitante",
  /** Título del recuadro del aviso fijo, en el encabezado. */
  noticeTitle: "Aviso de NEXUS",
  /** Rótulo sobre la descripción: recuerda que ese texto es del visitante. */
  writtenByVisitor: "Escrita por el visitante",
  /** Campos opcionales que quedaron en blanco, en una sola línea. */
  notGiven: (campos: string) => `Sin indicar: ${campos}.`,
  actions: {
    correo: "Responder por correo",
    whatsapp: "Escribir por WhatsApp",
    telefono: "Llamar",
    /** Asunto del correo de respuesta que abre el botón. Texto fijo, sin datos del visitante. */
    replySubject: "Su consulta a NEXUS",
  },
  visitorNotice: "Texto escrito por el visitante, no verificado. No abra enlaces ni adjuntos de terceros.",
  empty: "No indicado",
  skipped: "No aplica",
  replyHint: "Responda este correo para contestar directamente al remitente.",
  /** De dónde vino la consulta y en qué idioma. La fecha ya está en el resumen. */
  footer: (idioma: string) => `Enviado desde el formulario de nexuschile.net (idioma del formulario: ${idioma}).`,
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
