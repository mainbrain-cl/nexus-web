// Todo lo editable del sitio vive aquí. Ningún texto ni dato de contacto va escrito dentro de los componentes.
// Fuente: portafolio PDF 2026, brochure de NEXUS y respuestas de Domingo del 12-11. Lo que no está en esos
// materiales no se publica.
//
// Tono (Domingo, 12-11): NEXUS no fiscaliza a sus pares ni busca errores para desacreditar a nadie. Ofrece una
// evaluación independiente que integra investigación de incendios, análisis técnico-científico y comprensión
// jurídica de la prueba pericial: sirve a quien evalúa un informe y a quien quiere fortalecer el suyo.
// Evitar "cuestionar", "desacreditar", "no se sostiene", "interrogar" y cualquier tono de confrontación
// (y sus equivalentes en inglés y portugués: "challenge", "discredit", "contestar", "desqualificar").
//
// Cómo está armado:
// 1. Datos comunes: lo que no es texto (teléfono, correo, fotos, ids, años). Se escribe una sola vez.
// 2. `Texts`: la forma de los textos. TypeScript falla si a un idioma le falta una clave o un elemento.
// 3. Los textos de cada idioma: `es`, `en` y `pt`. Las palabras entre **dobles asteriscos** van en negrita.
// 4. `content[idioma]`: los datos comunes y los textos ya unidos, que es lo que leen los componentes.
//
// Los comentarios `// REVISAR:` marcan términos técnicos o jurídicos de la traducción que Domingo debe confirmar.

import { localeInfo, type Locale } from "./idiomas";

/** Lista de largo fijo: TypeScript exige exactamente `N` elementos. */
type Tuple<T, N extends number, R extends T[] = []> = R["length"] extends N ? R : Tuple<T, N, [...R, T]>;

// ============================================================================================================
// 1. Datos comunes
// ============================================================================================================

const phoneE164 = "+56998835977";

export const contact = {
  name: "Domingo Soto Gamé",
  firstName: "Domingo",
  lastName: "Soto Gamé",
  phoneDisplay: "+56 9 9883 5977",
  phoneE164,
  email: "domingosoto@nexuschile.net",
  web: "nexuschile.net",
};

/** Enlace a WhatsApp con un mensaje ya escrito. */
export const whatsapp = (text: string) => `https://wa.me/${phoneE164.replace("+", "")}?text=${encodeURIComponent(text)}`;

export const links = {
  // Formulario de contacto (Domingo y Aaron, 12-11): canal principal. WhatsApp queda como alternativa.
  formulario: "#contacto",
  email: `mailto:${contact.email}`,
  phone: `tel:${phoneE164}`,
};

const siteBase = {
  name: "NEXUS",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexuschile.net",
};

// Servicios: el orden de la página. Los ids abren el formulario con el servicio elegido (ver formulario.ts).
// "Formación especializada" viene del brochure; Aaron confirmó incluirla el 10-11.
// "Revisión independiente de su informe pericial" la pidió Domingo el 12-11: es para quien escribe un informe.
// La Auditoría, en cambio, es para quien recibe uno.
export const serviceIds = [
  "auditoria",
  "controvertidas",
  "revision",
  "litigacion",
  "prejudicial",
  "investigacion",
  "formacion",
] as const;
export type ServiceCardId = (typeof serviceIds)[number];

// Las tres líneas de servicio (Aaron, 12-11), en el orden de la página. Cada servicio va en una sola, y los de
// una misma línea quedan seguidos en `serviceIds`.
export const serviceGroupIds = ["evaluar", "fortalecer", "investigar"] as const;
export type ServiceGroupId = (typeof serviceGroupIds)[number];
const serviceGroup: Record<ServiceCardId, ServiceGroupId> = {
  auditoria: "evaluar",
  controvertidas: "evaluar",
  revision: "fortalecer",
  litigacion: "fortalecer",
  prejudicial: "fortalecer",
  investigacion: "investigar",
  formacion: "investigar",
};

const standardCodes = ["NFPA 921", "NFPA 1033"] as const;

export type Verdict = "sustentada" | "respaldo" | "insuficiente";
const verdicts: Verdict[] = ["sustentada", "respaldo", "insuficiente"];

// Sellos de afiliación y credencial, con los logos del portafolio PDF del cliente (Aaron pidió usarlos, 10-11).
const sealLogos = ["/logos/iaai.webp", "/logos/iaai-capitulo-82.webp", "/logos/iaai-fit.webp"] as const;

// Trayectoria: la lista de Domingo (12-11), ordenada por año. `since` agrega el rótulo "Desde" sobre el año en
// lo que sigue vigente; `logo` ocupa el lugar del año cuando Domingo no lo indicó.
const ledgerMeta: Tuple<{ year: string; since?: boolean; logo?: string }, 8> = [
  { year: "1997" },
  { year: "2011" },
  { year: "2012", since: true },
  { year: "2023" },
  { year: "2023" },
  { year: "2023" },
  { year: "2024", since: true },
  { year: "", logo: "/logos/iaai-fit.webp" },
];

// Escenas generadas con IA, entregadas por Aaron (10-11 y 18-11), sin el rótulo "Imagen referencial". Domingo aparece
// en la portada, en el retrato de Perfil y en una sola escena, la de terreno con el casco de NEXUS, que a él le gustó.
// La de la reunión se quitó porque no se parecía a él (18-11). Las tres de incendio son fotos reales que envió Domingo
// (17-11), pasadas por IA casi sin cambios: el lugar se reconoce y en una salen bomberos. Aaron decidió usarlas así (18-11).
const photoFiles = {
  terreno: { src: "/fotos/terreno.webp", width: 1671, height: 941 },
  evidencia: { src: "/fotos/evidencia.webp", width: 1672, height: 941 },
  informe: { src: "/fotos/informe.webp", width: 1672, height: 941 },
  // Franja al cierre de Método (18-11): escenas generadas, sin personas, con los marcadores 1 a 4 en orden.
  escena: { src: "/fotos/escena.webp", width: 1671, height: 941 },
  marcador: { src: "/fotos/marcador.webp", width: 1672, height: 941 },
  marcador3: { src: "/fotos/marcador3.webp", width: 1670, height: 941 },
  tablero: { src: "/fotos/tablero.webp", width: 1671, height: 941 },
  // Cierre de Perfil (18-11): fotos reales de Domingo pasadas por IA, en vertical. Aaron las usa tal cual.
  incendio1: { src: "/fotos/incendio-1.webp", width: 1086, height: 1448 },
  incendio2: { src: "/fotos/incendio-2.webp", width: 1086, height: 1448 },
  incendio3: { src: "/fotos/incendio-3.webp", width: 1086, height: 1448 },
};
type PhotoId = keyof typeof photoFiles;

// Secciones con enlace en la barra y el pie, en el orden de la página. La barra no lleva Contacto: lo cubre el
// botón "Solicitar asesoría" (revisión general, 12-11); el pie sí.
const navHrefs = { servicios: "#servicios", perfil: "#perfil", metodo: "#metodo", contacto: "#contacto" } as const;
type NavKey = keyof typeof navHrefs;
const barNavKeys: NavKey[] = ["servicios", "perfil", "metodo"];

/**
 * Enlace a Servicios con una línea ya elegida, por ejemplo `#servicios?grupo=fortalecer`: la sección abre el
 * primer servicio de esa línea (ver Servicios.tsx). Lo usa el submenú de la barra.
 */
export const serviceGroupHref = (group: ServiceGroupId) => `#servicios?grupo=${group}`;

// ============================================================================================================
// 2. Forma de los textos
// ============================================================================================================

type ServiceText = {
  /** Texto del botón: "Solicitar …" más el servicio, corto para que quepa en un celular. */
  cta: string;
  /** Nombre corto, para el submenú de Servicios en la barra. */
  short: string;
  /** La situación del visitante, en sus palabras: es la puerta de entrada al servicio. */
  situation: string;
  name: string;
  /** Una sola línea. */
  text: string;
  /** Tres puntos. */
  includes: Tuple<string, 3>;
};

type MethodStepText = {
  name: string;
  /** Condición que completa el nombre; se muestra más pequeña, tras una coma. */
  note?: string;
  text: string;
};

export type Texts = {
  site: { title: string; description: string; tagline: string };
  /** Mensaje ya escrito del botón de WhatsApp. */
  whatsappText: string;
  nav: { links: Record<NavKey, string>; cta: string };
  /** Selector de idioma: nombre del grupo para lectores de pantalla. */
  languageLabel: string;
  /** Textos que solo leen los lectores de pantalla o que no se ven en pantalla. */
  a11y: {
    skipLink: string;
    mainNav: string;
    openMenu: string;
    closeMenu: string;
    /** Lista del submenú de Servicios (las tres líneas). */
    servicesMenu: string;
    footerNav: string;
    footerContact: string;
    backHome: string;
  };
  hero: {
    titleLines: Tuple<string, 2>;
    /** Dos frases: en escritorio van en una línea, separadas por un punto medio que pone el componente; en celular, una por línea. */
    roleLines: Tuple<string, 2>;
    /** Etiqueta rotativa junto al nombre: solo datos de la trayectoria, nada inventado. */
    tags: Tuple<string, 4>;
    primaryCta: string;
    secondaryCta: string;
    sealsLabel: string;
    /** Tarjeta chica de Domingo, abajo a la derecha en escritorio. El rol es `profile.role` abreviado, sin datos nuevos. */
    card: { role: string; cta: string };
  };
  /** Asesor flotante: la foto de Domingo fija abajo a la derecha, con un mensaje que lleva al formulario. */
  advisor: { label: string; message: string; cta: string; close: string };
  intersection: {
    title: Tuple<string, 2>;
    body: string;
    /** Los tres hilos que llegan a la X del logo. */
    threads: Tuple<string, 3>;
    knot: string;
    /** Descripción del diagrama para lectores de pantalla. */
    diagramLabel: string;
    audiencesTitle: string;
    audiences: Tuple<string, 4>;
  };
  servicesIntro: {
    title: Tuple<string, 2>;
    text: string;
    includesTitle: string;
    /** Rótulo de cada línea de servicio. */
    groups: Record<ServiceGroupId, string>;
  };
  services: Record<ServiceCardId, ServiceText>;
  method: {
    title: Tuple<string, 2>;
    text: string;
    /** Nombres de NFPA 921 y NFPA 1033, en ese orden. */
    standards: Tuple<string, 2>;
    standardsLabel: string;
    stepsLabel: string;
    steps: Tuple<MethodStepText, 7>;
    /** Nota del ciclo bajo el paso 6: una hipótesis que no resiste devuelve el trabajo a los datos. */
    loopText: string;
  };
  result: { title: Tuple<string, 2>; text: string; levels: Record<Verdict, string> };
  profile: {
    role: string;
    bio: string;
    portraitAlt: string;
    sealsLabel: string;
    sealAlt: (name: string) => string;
    /** En el orden de los logos: IAAI, Capítulo 82, IAAI-FIT. */
    seals: Tuple<{ name: string; by: string }, 3>;
    ledgerTitle: string;
    /** Rótulo sobre el año en lo que sigue vigente. */
    since: string;
    /** En el orden de los años de `ledgerMeta`. */
    ledger: Tuple<{ name: string; by?: string }, 8>;
  };
  closing: {
    title: Tuple<string, 2>;
    text: string;
    whatsappLabel: string;
    emailLabel: string;
    phoneLabel: string;
    cityLabel: string;
    /** Alcance: todo Chile y fuera de Chile, no solo Valdivia (Aaron, 18-11). Va en Contacto, el pie y el menú. */
    coverage: string;
  };
  photoAlts: Record<PhotoId, string>;
  footer: { motto: string; legal: string };
  /** Página 404. */
  notFound: { metaTitle: string; title: string; text: string; back: string };
  /** Texto alternativo de la imagen al compartir (Open Graph). */
  ogAlt: string;
};

// ============================================================================================================
// 3. Textos
// ============================================================================================================

// ---------- Español ----------

const es: Texts = {
  site: {
    title: "NEXUS | Evaluación pericial independiente en incendios",
    description:
      "Evaluación independiente que integra investigación de incendios, análisis técnico-científico y comprensión jurídica de la prueba pericial, para evaluar un informe o fortalecer el suyo. Domingo Soto Gamé, abogado e investigador de incendios, IAAI-FIT. Atención en todo Chile y en el extranjero.",
    tagline: "Método científico. Utilidad jurídica.",
  },
  whatsappText: "Hola Domingo, quiero solicitar una asesoría con NEXUS.",
  // "Trayectoria" en vez de "Quién soy" (revisión general, 12-11).
  nav: { links: { servicios: "Servicios", perfil: "Trayectoria", metodo: "Método", contacto: "Contacto" }, cta: "Solicitar asesoría" },
  languageLabel: "Idioma",
  a11y: {
    skipLink: "Saltar al contenido",
    mainNav: "Principal",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    servicesMenu: "Líneas de servicio",
    footerNav: "Secciones del sitio",
    footerContact: "Contacto",
    backHome: "volver al inicio",
  },
  hero: {
    titleLines: ["Auditoría forense", "de incendios"],
    roleLines: ["Asesoría experta en investigación de incendios", "Evaluación pericial independiente"],
    tags: ["Abogado desde 1997", "IAAI-FIT", "Método NFPA 921", "Investigador de incendios desde 2012"],
    primaryCta: "Solicitar asesoría",
    secondaryCta: "Ver servicios",
    sealsLabel: "Afiliaciones y credencial IAAI",
    card: { role: "Dirección técnica · Abogado · IAAI-FIT", cta: "Conocer a Domingo" },
  },
  // Intersección: un solo bloque (Aaron, 10-11). Las tres competencias van en palabras de Domingo (12-11).
  advisor: {
    label: "Escribir a Domingo Soto Gamé: abrir el formulario",
    message: "Hola, soy Domingo. ¿Necesita algo específico? Cuénteme su caso en el formulario y lo reviso personalmente.",
    cta: "Abrir el formulario",
    close: "Cerrar mensaje",
  },
  intersection: {
    title: ["Tres competencias,", "un solo criterio"],
    // El diagrama ya nombra las tres competencias: el texto no las repite (revisión general, 12-11).
    body: "Las tres en una misma evaluación independiente, **para quien necesita evaluar un informe y para quien quiere fortalecer el suyo.**",
    threads: ["Investigación de incendios", "Análisis técnico-científico", "Comprensión jurídica de la prueba pericial"],
    knot: "Una conclusión fundada",
    diagramLabel:
      "Diagrama: la investigación de incendios, el análisis técnico-científico y la comprensión jurídica de la prueba pericial se cruzan en la X de NEXUS. De ese cruce sale un solo hilo: una conclusión fundada.",
    audiencesTitle: "Trabajamos con",
    // Orden pedido por Domingo (12-11).
    audiences: ["Aseguradoras y liquidadores", "Abogados y estudios jurídicos", "Investigadores y empresas de investigación", "Empresas"],
  },
  servicesIntro: {
    title: ["¿Qué necesita", "resolver?"],
    text: "Evaluar un informe, fortalecer el suyo o investigar un incendio. Elija la situación más parecida a la suya.",
    includesTitle: "Qué incluye",
    groups: { evaluar: "Evaluar un informe", fortalecer: "Fortalecer su informe o su caso", investigar: "Investigar y formar" },
  },
  services: {
    auditoria: {
      cta: "Solicitar auditoría",
      short: "Auditoría de informes",
      situation: "Recibí un informe pericial y necesito una opinión independiente",
      name: "Auditoría técnica de informes periciales",
      text: "Evaluación **independiente** de un informe pericial presentado en su caso, para decidir con fundamento.",
      includes: ["Evaluación conforme a NFPA 921", "Coherencia y trazabilidad del razonamiento", "Informe con observaciones fundadas"],
    },
    revision: {
      cta: "Solicitar revisión",
      short: "Revisión de su informe",
      situation: "Soy investigador o empresa de investigación y quiero fortalecer mi informe antes de entregarlo",
      name: "Revisión independiente de su informe pericial",
      text: "Metodología, sustento técnico y conclusiones: una segunda mirada **técnica y jurídica**, confidencial, antes de entregar su informe.",
      includes: [
        "Metodología y sustento técnico según NFPA 921",
        "Lectura jurídica del informe como prueba pericial",
        "Observaciones confidenciales, solo para usted",
      ],
    },
    litigacion: {
      cta: "Solicitar asesoría",
      short: "Consultoría para litigación",
      situation: "Hay un juicio en curso y la prueba técnica es decisiva",
      name: "Consultoría técnica para litigación",
      text: "Asesoría a abogados para **comprender y usar con solidez** la prueba técnica.",
      includes: ["Lectura técnica de informes periciales", "Puntos clave para la teoría del caso", "Preparación de audiencias con prueba pericial"],
    },
    controvertidas: {
      cta: "Solicitar análisis",
      short: "Pericias controvertidas",
      situation: "Hay pericias que llegan a conclusiones distintas",
      name: "Revisión técnica de pericias controvertidas",
      text: "Análisis técnico de pericias **con conclusiones en discusión**, para ordenar el debate sobre bases verificables.",
      includes: ["Contraste entre datos y conclusiones", "Análisis de hipótesis alternativas", "Fundamentos técnicos para la discusión"],
    },
    investigacion: {
      cta: "Solicitar investigación",
      short: "Investigación de incendios",
      situation: "Ocurrió un incendio y hay que determinar su origen y causa",
      name: "Investigación de incendios",
      text: "Determinación del **origen y la causa** del incendio, con un proceso documentado.",
      includes: ["Examen y registro del sitio", "Patrones de fuego y fuentes de ignición posibles", "Informe técnico pericial"],
    },
    prejudicial: {
      cta: "Solicitar evaluación",
      short: "Asesoría prejudicial",
      situation: "El caso aún no llega a juicio y quiero evaluarlo",
      name: "Asesoría prejudicial estratégica",
      text: "Evaluación técnica **antes de judicializar**: alcance de la evidencia y próximos pasos.",
      includes: ["Análisis preliminar de antecedentes", "Riesgos probatorios y peritajes necesarios", "Apoyo en negociación temprana"],
    },
    formacion: {
      cta: "Solicitar formación",
      short: "Formación especializada",
      situation: "Somos investigadores con experiencia y queremos llevar nuestro trabajo a otro nivel",
      name: "Formación especializada",
      text: "Perfeccionamiento para **investigadores y equipos ya formados**: método, evidencia e informes, desde la experiencia de casos reales.",
      includes: ["Aplicación rigurosa de NFPA 921", "Análisis crítico de evidencia", "El informe como prueba pericial"],
    },
  },
  // Los siete pasos del método científico de NFPA 921 (edición 2024), con los nombres que dio Domingo (12-11).
  // Las frases resumen la norma sin agregarle requisitos.
  method: {
    title: ["Cada conclusión,", "atada a su evidencia"],
    text: "Todo trabajo de NEXUS, sea investigar o revisar un informe, sigue el **método científico de NFPA 921**: siete pasos, y ninguna hipótesis se adopta sin ponerla a prueba contra los hechos.",
    standards: ["Investigación de incendios", "Competencia del investigador"],
    standardsLabel: "Normas de referencia",
    stepsLabel: "Los siete pasos del método científico según NFPA 921",
    steps: [
      { name: "Reconocer la necesidad", text: "Ocurrió un incendio y **su causa debe determinarse**." },
      { name: "Definir el problema", text: "Se precisa **qué debe resolverse** y cómo abordarlo: el origen y la causa del incendio." },
      { name: "Recopilar datos", text: "Se reúnen **hechos verificables**: observación del sitio, registros, testimonios y ensayos." },
      { name: "Analizar los datos", text: "Los datos se interpretan **con fundamento científico**, a partir de conocimiento, formación y experiencia." },
      { name: "Desarrollar hipótesis", text: "A partir del análisis se formulan **hipótesis que expliquen** lo observado." },
      {
        name: "Poner a prueba las hipótesis",
        text: "Cada hipótesis se contrasta con **los hechos conocidos** y con el conocimiento científico aplicable, por razonamiento deductivo.",
      },
      {
        name: "Seleccionar una hipótesis final",
        note: "cuando los antecedentes lo permitan",
        text: "Se adopta la que **resiste la prueba**. Si ninguna lo hace, la causa queda como no determinada.",
      },
    ],
    // El ciclo de NFPA 921: una hipótesis que no resiste la prueba devuelve el trabajo a los datos.
    loopText: "Si una hipótesis no resiste, se descarta y se desarrollan otras. Eso puede requerir nuevos datos o un nuevo análisis de los existentes.",
  },
  result: {
    title: ["Qué está sólido", "y qué fortalecer"],
    text: "Cuando evaluamos o revisamos un informe, cada conclusión queda en **uno de estos tres niveles**, con su fundamento y lo que falta para respaldarla.",
    levels: { sustentada: "Sustentada", respaldo: "Requiere respaldo", insuficiente: "Sin sustento suficiente" },
  },
  // Perfil: bio de una frase; las credenciales van como sellos; la trayectoria es la lista de Domingo (12-11),
  // con sus palabras.
  profile: {
    role: "Dirección técnica · Abogado · Investigador de incendios · IAAI-FIT",
    bio: "Abogado desde 1997 e investigador de incendios desde 2012. Integra **investigación de incendios**, **análisis técnico-científico** y **comprensión jurídica de la prueba pericial**.",
    portraitAlt:
      "Retrato de Domingo Soto Gamé con la camisa de la International Association of Arson Investigators y el parche de Fire Investigator Technician (IAAI-FIT)",
    sealsLabel: "Credenciales",
    sealAlt: (name) => `Sello ${name}`,
    seals: [
      { name: "IAAI", by: "International Association of Arson Investigators" },
      { name: "IAAI Capítulo 82 Chile", by: "Miembro" },
      { name: "IAAI-FIT", by: "Fire Investigator Technician" },
    ],
    ledgerTitle: "Trayectoria",
    since: "Desde",
    ledger: [
      { name: "Abogado" },
      { name: "Curso de Investigación de Incendios y Explosiones", by: "ANB – Academia Nacional de Bomberos de Chile" },
      {
        name: "Investigador de Incendios",
        by: "Cuerpo de Bomberos de Valdivia. Desde 2020 Inspector jefe del Departamento de Investigación de Incendios del CB",
      },
      { name: "Curso de Investigación de Incendios Nivel II", by: "Escuela de Bomberos del Cuerpo de Bomberos de Santiago" },
      {
        name: "Curso de Investigación de Incendios Forestales",
        by: "Capítulo 79 Hispanoamericano – IAAI International Association of Arson Investigators",
      },
      { name: "Miembro de Cap 82 Chile IAAI", by: "International Association of Arson Investigators" },
      { name: "Miembro IAAI", by: "International Association of Arson Investigators" },
      { name: "Fire Investigator Technician (IAAI-FIT) – Técnico en Investigación de Incendios" },
    ],
  },
  closing: {
    title: ["Hablemos", "de su caso"],
    text: "Contacto **directo con Domingo Soto Gamé**. Atendemos casos en **todo Chile y en el extranjero**.",
    whatsappLabel: "Escribir por WhatsApp",
    emailLabel: "Correo",
    phoneLabel: "Teléfono",
    cityLabel: "Alcance",
    coverage: "Nacional e internacional",
  },
  photoAlts: {
    terreno:
      "Domingo Soto Gamé, con casco de NEXUS, lentes, respirador y guantes, inspecciona con una linterna un muro calcinado en una vivienda quemada, con una tabla de notas en la mano",
    escena: "Casco de NEXUS, respirador, guantes y linterna sobre una mesa en una habitación incendiada, junto al marcador de evidencia número 1",
    marcador: "Marcador de evidencia número 2 y una escala junto a un cable quemado al pie de un muro calcinado",
    marcador3: "Marcador de evidencia número 3 en el piso de una habitación calcinada, junto a un mueble quemado",
    tablero: "Tablero eléctrico calcinado y abierto, con el marcador de evidencia número 4 y una escala al pie",
    incendio1: "Casa de dos pisos envuelta en llamas de noche, con una columna de humo sobre los cables de la calle",
    incendio2: "Incendio nocturno de una casa antigua, con mangueras de bomberos sobre la calle mojada",
    incendio3: "Bomberos con una escalera frente a una casa en llamas, de noche",
    evidencia:
      "Muro con un patrón de quemadura en forma de V sobre una caja eléctrica dañada, junto a una cinta métrica y un marcador de evidencia numerado",
    informe: "Manos revisando un informe pericial impreso con un destacador, junto a una lámpara de escritorio",
  },
  footer: {
    motto: "Evidencia · Análisis · Contexto · Decisiones",
    legal: "Evaluación pericial independiente e investigación de incendios",
  },
  notFound: {
    metaTitle: "Página no encontrada | NEXUS",
    title: "Esta página no existe",
    text: "Puede que el enlace esté mal escrito o que la página se haya movido.",
    back: "Volver al inicio",
  },
  ogAlt: "NEXUS: Auditoría forense de incendios. Domingo Soto Gamé",
};

// ---------- English ----------
// Para aseguradoras, ajustadores y abogados de EE. UU. "Informe pericial" es "expert report"; el informe de una
// investigación de origen y causa, "fire investigation report".

const en: Texts = {
  site: {
    // REVISAR: "Evaluación pericial" va como "expert review", el término usual en EE. UU. para la evaluación del
    // trabajo de un perito.
    title: "NEXUS | Independent expert review in fire cases",
    description:
      "Independent evaluation that brings together fire investigation, scientific and technical analysis, and a legal understanding of expert evidence, to assess a report or strengthen your own. Domingo Soto Gamé, attorney (Chile) and fire investigator, IAAI-FIT. Serving clients throughout Chile and abroad.",
    tagline: "Scientific method. Legal value.",
  },
  whatsappText: "Hello Domingo, I would like to request a consultation with NEXUS.",
  nav: { links: { servicios: "Services", perfil: "Background", metodo: "Method", contacto: "Contact" }, cta: "Request a consultation" },
  languageLabel: "Language",
  a11y: {
    skipLink: "Skip to content",
    mainNav: "Main",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    servicesMenu: "Service lines",
    footerNav: "Site sections",
    footerContact: "Contact",
    backHome: "back to top",
  },
  hero: {
    titleLines: ["Forensic fire", "audit"],
    roleLines: ["Specialist advice on fire investigation", "Independent expert evaluation"],
    tags: ["Chilean attorney since 1997", "IAAI-FIT", "NFPA 921 method", "Fire investigator since 2012"],
    primaryCta: "Request a consultation",
    secondaryCta: "View services",
    sealsLabel: "IAAI affiliations and credential",
    card: { role: "Technical director · Attorney (Chile) · IAAI-FIT", cta: "Meet Domingo" },
  },
  advisor: {
    label: "Write to Domingo Soto Gamé: open the form",
    message: "Hello, I'm Domingo. Do you need something specific? Tell me about your case in the form and I will review it personally.",
    cta: "Open the form",
    close: "Close message",
  },
  intersection: {
    title: ["Three disciplines,", "one judgment"],
    body: "All three in one independent evaluation, **for those who need to assess a report and for those who want to strengthen their own.**",
    threads: ["Fire investigation", "Scientific and technical analysis", "Legal understanding of expert evidence"],
    knot: "A sound conclusion",
    diagramLabel:
      "Diagram: fire investigation, scientific and technical analysis, and the legal understanding of expert evidence meet at the X of NEXUS. A single thread comes out of that intersection: a sound conclusion.",
    audiencesTitle: "We work with",
    audiences: ["Insurers and claims adjusters", "Attorneys and law firms", "Investigators and investigation firms", "Companies"],
  },
  servicesIntro: {
    title: ["What do you", "need to resolve?"],
    text: "Assess a report, strengthen your own, or investigate a fire. Choose the situation closest to yours.",
    includesTitle: "What it includes",
    groups: { evaluar: "Assess a report", fortalecer: "Strengthen your report or your case", investigar: "Investigate and train" },
  },
  services: {
    auditoria: {
      cta: "Request an audit",
      short: "Report audit",
      situation: "I received an expert report and need an independent opinion",
      name: "Technical audit of expert reports",
      text: "An **independent** evaluation of an expert report submitted in your case, so you can make well-founded decisions.",
      includes: ["Evaluation under NFPA 921", "Consistency and traceability of the reasoning", "Report with well-founded observations"],
    },
    revision: {
      cta: "Request a review",
      short: "Review of your report",
      situation: "I'm an investigator or investigation firm and want to strengthen my report before submitting it",
      name: "Independent review of your expert report",
      text: "Methodology, technical basis and conclusions: a confidential second look, **technical and legal**, before you submit your report.",
      includes: [
        "Methodology and technical basis under NFPA 921",
        "Legal reading of the report as expert evidence",
        "Confidential observations, for you only",
      ],
    },
    litigacion: {
      cta: "Request support",
      short: "Litigation consulting",
      situation: "A case is in litigation and the technical evidence is decisive",
      name: "Technical consulting for litigation",
      text: "Support for attorneys to **understand and use technical evidence** with confidence.",
      includes: ["Technical reading of expert reports", "Key points for the theory of the case", "Preparing for hearings with expert evidence"],
    },
    controvertidas: {
      cta: "Request an analysis",
      short: "Disputed expert findings",
      situation: "Expert reports have reached different conclusions",
      name: "Technical review of disputed expert findings",
      text: "Technical analysis of expert findings **whose conclusions are under discussion**, to frame the debate on verifiable grounds.",
      includes: ["Comparing data with conclusions", "Analysis of alternative hypotheses", "Technical grounds for the discussion"],
    },
    investigacion: {
      cta: "Request an investigation",
      short: "Fire investigation",
      situation: "A fire has occurred and its origin and cause must be determined",
      name: "Fire investigation",
      text: "Determination of the fire's **origin and cause**, through a documented process.",
      includes: ["Scene examination and documentation", "Fire patterns and potential ignition sources", "Fire investigation report"],
    },
    prejudicial: {
      cta: "Request an assessment",
      short: "Pre-litigation advisory",
      situation: "The case hasn't gone to court yet and I want to assess it",
      name: "Strategic pre-litigation advisory",
      text: "A technical assessment **before going to court**: what the evidence can support and the next steps.",
      includes: ["Preliminary review of the available information", "Evidentiary risks and expert work needed", "Support in early negotiations"],
    },
    formacion: {
      cta: "Request training",
      short: "Specialized training",
      situation: "We're experienced investigators and want to take our work to the next level",
      name: "Specialized training",
      text: "Advanced training for **experienced investigators and teams**: method, evidence and reports, drawing on real casework.",
      includes: ["Rigorous application of NFPA 921", "Critical evidence analysis", "The report as expert evidence"],
    },
  },
  // Nombres oficiales de los pasos del método científico en NFPA 921 (capítulo 4).
  method: {
    title: ["Every conclusion,", "tied to its evidence"],
    text: "All NEXUS work, whether investigating a fire or reviewing a report, follows the **scientific method of NFPA 921**: seven steps, and no hypothesis is adopted until it has been tested against the facts.",
    standards: ["Fire and explosion investigations", "Fire investigator qualifications"],
    standardsLabel: "Reference standards",
    stepsLabel: "The seven steps of the scientific method under NFPA 921",
    steps: [
      { name: "Recognize the Need", text: "A fire has occurred and **its cause must be determined**." },
      { name: "Define the Problem", text: "The investigator establishes **what must be resolved** and how to approach it: the origin and cause of the fire." },
      { name: "Collect Data", text: "**Verifiable facts** are gathered: scene observation, records, witness statements and testing." },
      { name: "Analyze the Data", text: "The data are interpreted **on a scientific basis**, drawing on knowledge, training and experience." },
      { name: "Develop Hypotheses", text: "Based on the analysis, **hypotheses that explain** the observations are formulated." },
      {
        name: "Test the Hypotheses",
        text: "Each hypothesis is tested against **the known facts** and the applicable scientific knowledge, through deductive reasoning.",
      },
      {
        name: "Select Final Hypothesis",
        note: "when the data allows",
        text: "The hypothesis that **withstands testing** is adopted. If none does, the cause is classified as undetermined.",
      },
    ],
    loopText:
      "If a hypothesis does not withstand testing, it is discarded and others are developed. This may require new data or a fresh analysis of the existing data.",
  },
  result: {
    title: ["What is solid,", "what to strengthen"],
    text: "When we assess or review a report, each conclusion is placed in **one of these three levels**, with its basis and what is needed to support it.",
    levels: { sustentada: "Supported", respaldo: "Needs support", insuficiente: "Not sufficiently supported" },
  },
  profile: {
    role: "Technical director · Attorney (Chile) · Fire investigator · IAAI-FIT",
    bio: "An attorney in Chile since 1997 and a fire investigator since 2012, he brings together **fire investigation**, **scientific and technical analysis** and a **legal understanding of expert evidence**.",
    portraitAlt:
      "Portrait of Domingo Soto Gamé wearing the International Association of Arson Investigators shirt and the Fire Investigator Technician (IAAI-FIT) patch",
    sealsLabel: "Credentials",
    sealAlt: (name) => `${name} seal`,
    seals: [
      { name: "IAAI", by: "International Association of Arson Investigators" },
      // REVISAR: nombre oficial del capítulo en inglés ("Chapter 82 Chile" o "Chile Chapter 82").
      { name: "IAAI Chapter 82 Chile", by: "Member" },
      { name: "IAAI-FIT", by: "Fire Investigator Technician" },
    ],
    ledgerTitle: "Career",
    since: "Since",
    ledger: [
      { name: "Attorney (Chile)" },
      {
        name: "Fire and Explosion Investigation Course",
        by: "ANB – Academia Nacional de Bomberos de Chile (Chile's national fire academy)",
      },
      {
        name: "Fire Investigator",
        // REVISAR: "Inspector jefe" como "Chief Inspector".
        by: "Cuerpo de Bomberos de Valdivia (Valdivia Fire Department). Since 2020, Chief Inspector of its Fire Investigation Department",
      },
      {
        name: "Fire Investigation Course, Level II",
        by: "Escuela de Bomberos del Cuerpo de Bomberos de Santiago (Santiago Fire Department training school)",
      },
      {
        name: "Wildland Fire Investigation Course",
        // REVISAR: nombre oficial en inglés del Capítulo 79 Hispanoamericano de IAAI.
        by: "IAAI Hispanic American Chapter 79 – International Association of Arson Investigators",
      },
      { name: "Member, IAAI Chapter 82 Chile", by: "International Association of Arson Investigators" },
      { name: "IAAI Member", by: "International Association of Arson Investigators" },
      { name: "Fire Investigator Technician (IAAI-FIT)" },
    ],
  },
  closing: {
    title: ["Let's discuss", "your case"],
    text: "Speak **directly with Domingo Soto Gamé**. We take cases **throughout Chile and abroad**.",
    whatsappLabel: "Message on WhatsApp",
    emailLabel: "Email",
    phoneLabel: "Phone",
    cityLabel: "Where we work",
    coverage: "Nationwide and international",
  },
  photoAlts: {
    terreno:
      "Domingo Soto Gamé, wearing a NEXUS hard hat, safety glasses, a respirator and gloves, uses a flashlight to inspect a charred wall in a burned house, clipboard in hand",
    escena: "A NEXUS hard hat, respirator, gloves and flashlight on a table in a burned room, next to evidence marker number 1",
    marcador: "Evidence marker number 2 and a scale next to a burned cable at the base of a charred wall",
    marcador3: "Evidence marker number 3 on the floor of a charred room, next to burned shelving",
    tablero: "An open, charred electrical panel with evidence marker number 4 and a scale below it",
    incendio1: "A two-story house engulfed in flames at night, with a column of smoke above the street wires",
    incendio2: "A night fire in an old house, with fire hoses across the wet street",
    incendio3: "Firefighters carrying a ladder in front of a burning house at night",
    evidencia:
      "Wall with a V-shaped burn pattern above a damaged electrical box, next to a measuring tape and a numbered evidence marker",
    informe: "Hands reviewing a printed expert report with a highlighter, next to a desk lamp",
  },
  footer: {
    motto: "Evidence · Analysis · Context · Decisions",
    legal: "Independent expert review and fire investigation",
  },
  notFound: {
    metaTitle: "Page not found | NEXUS",
    title: "This page doesn't exist",
    text: "The link may be mistyped, or the page may have moved.",
    back: "Back to home",
  },
  ogAlt: "NEXUS: Forensic fire audit. Domingo Soto Gamé",
};

// ---------- Português (Brasil) ----------
// "Informe pericial" é "laudo pericial"; o profissional, "perito". Registro cordial com "você", como é usual
// no Brasil. Evitar "antecedentes" (no Brasil remete a antecedentes criminais): usar "informações" ou "dados".

const pt: Texts = {
  site: {
    title: "NEXUS | Avaliação pericial independente em incêndios",
    description:
      "Avaliação independente que integra investigação de incêndios, análise técnico-científica e compreensão jurídica da prova pericial, para avaliar um laudo ou fortalecer o seu. Domingo Soto Gamé, advogado (Chile) e investigador de incêndios, IAAI-FIT. Atendimento em todo o Chile e no exterior.",
    tagline: "Método científico. Utilidade jurídica.",
  },
  whatsappText: "Olá, Domingo. Gostaria de solicitar uma assessoria da NEXUS.",
  nav: { links: { servicios: "Serviços", perfil: "Trajetória", metodo: "Método", contacto: "Contato" }, cta: "Solicitar assessoria" },
  languageLabel: "Idioma",
  a11y: {
    skipLink: "Pular para o conteúdo",
    mainNav: "Principal",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    servicesMenu: "Linhas de serviço",
    footerNav: "Seções do site",
    footerContact: "Contato",
    backHome: "voltar ao início",
  },
  hero: {
    titleLines: ["Auditoria forense", "de incêndios"],
    roleLines: ["Assessoria técnica em investigação de incêndios", "Avaliação pericial independente"],
    tags: ["Advogado no Chile desde 1997", "IAAI-FIT", "Método NFPA 921", "Investigador de incêndios desde 2012"],
    primaryCta: "Solicitar assessoria",
    secondaryCta: "Ver serviços",
    sealsLabel: "Afiliações e credencial IAAI",
    card: { role: "Direção técnica · Advogado (Chile) · IAAI-FIT", cta: "Conheça o Domingo" },
  },
  advisor: {
    label: "Escrever para Domingo Soto Gamé: abrir o formulário",
    message: "Olá, sou o Domingo. Precisa de algo específico? Conte-me o seu caso no formulário e eu o analiso pessoalmente.",
    cta: "Abrir o formulário",
    close: "Fechar mensagem",
  },
  intersection: {
    title: ["Três competências,", "um só critério"],
    body: "As três em uma mesma avaliação independente, **para quem precisa avaliar um laudo e para quem quer fortalecer o seu.**",
    threads: ["Investigação de incêndios", "Análise técnico-científica", "Compreensão jurídica da prova pericial"],
    knot: "Uma conclusão embasada",
    diagramLabel:
      "Diagrama: a investigação de incêndios, a análise técnico-científica e a compreensão jurídica da prova pericial se cruzam no X da NEXUS. Desse cruzamento sai um único fio: uma conclusão embasada.",
    audiencesTitle: "Trabalhamos com",
    // REVISAR: "liquidadores" como "reguladores de sinistros", el término usado por las aseguradoras en Brasil.
    audiences: ["Seguradoras e reguladores de sinistros", "Advogados e escritórios de advocacia", "Investigadores e empresas de investigação", "Empresas"],
  },
  servicesIntro: {
    title: ["O que você", "precisa resolver?"],
    text: "Avaliar um laudo, fortalecer o seu ou investigar um incêndio. Escolha a situação mais parecida com a sua.",
    includesTitle: "O que inclui",
    groups: { evaluar: "Avaliar um laudo", fortalecer: "Fortalecer seu laudo ou seu caso", investigar: "Investigar e capacitar" },
  },
  services: {
    auditoria: {
      cta: "Solicitar auditoria",
      short: "Auditoria de laudos",
      situation: "Recebi um laudo pericial e preciso de uma opinião independente",
      name: "Auditoria técnica de laudos periciais",
      text: "Avaliação **independente** de um laudo pericial apresentado no seu caso, para decidir com fundamento.",
      includes: ["Avaliação conforme a NFPA 921", "Coerência e rastreabilidade do raciocínio", "Relatório com observações fundamentadas"],
    },
    revision: {
      cta: "Solicitar revisão",
      short: "Revisão do seu laudo",
      situation: "Sou investigador ou empresa de investigação e quero fortalecer meu laudo antes de entregá-lo",
      name: "Revisão independente do seu laudo pericial",
      text: "Metodologia, fundamentação técnica e conclusões: um segundo olhar **técnico e jurídico**, confidencial, antes de entregar seu laudo.",
      includes: [
        "Metodologia e fundamentação técnica segundo a NFPA 921",
        "Leitura jurídica do laudo como prova pericial",
        "Observações confidenciais, só para você",
      ],
    },
    litigacion: {
      cta: "Solicitar assessoria",
      short: "Consultoria para litígios",
      situation: "Há um processo judicial em andamento e a prova técnica é decisiva",
      name: "Consultoria técnica para litígios",
      text: "Assessoria a advogados para **compreender e usar com solidez** a prova técnica.",
      // REVISAR: "teoría del caso" como "estratégia do caso" (en Brasil "teoria do caso" es poco usual).
      includes: ["Leitura técnica de laudos periciais", "Pontos-chave para a estratégia do caso", "Preparação de audiências com prova pericial"],
    },
    controvertidas: {
      cta: "Solicitar análise",
      short: "Perícias controvertidas",
      situation: "Há perícias que chegam a conclusões diferentes",
      name: "Revisão técnica de perícias controvertidas",
      text: "Análise técnica de perícias **com conclusões em discussão**, para organizar o debate sobre bases verificáveis.",
      includes: ["Confronto entre dados e conclusões", "Análise de hipóteses alternativas", "Fundamentos técnicos para a discussão"],
    },
    investigacion: {
      cta: "Solicitar investigação",
      short: "Investigação de incêndios",
      situation: "Ocorreu um incêndio e é preciso determinar sua origem e causa",
      name: "Investigação de incêndios",
      text: "Determinação da **origem e da causa** do incêndio, com um processo documentado.",
      // REVISAR: "patrones de fuego" como "padrões de queima" (otras traducciones de NFPA 921 usan "padrões de fogo").
      includes: ["Exame e registro do local", "Padrões de queima e possíveis fontes de ignição", "Laudo técnico pericial"],
    },
    prejudicial: {
      cta: "Solicitar avaliação",
      short: "Assessoria pré-processual",
      situation: "O caso ainda não chegou à Justiça e quero avaliá-lo",
      name: "Assessoria pré-processual estratégica",
      text: "Avaliação técnica **antes de judicializar**: alcance das evidências e próximos passos.",
      includes: ["Análise preliminar das informações", "Riscos probatórios e perícias necessárias", "Apoio na negociação inicial"],
    },
    formacion: {
      cta: "Solicitar capacitação",
      short: "Capacitação especializada",
      situation: "Somos investigadores com experiência e queremos levar nosso trabalho a um novo patamar",
      name: "Capacitação especializada",
      text: "Aperfeiçoamento para **investigadores e equipes já formados**: método, evidências e laudos, a partir da experiência em casos reais.",
      includes: ["Aplicação rigorosa da NFPA 921", "Análise crítica de evidências", "O laudo como prova pericial"],
    },
  },
  method: {
    title: ["Cada conclusão,", "ligada à evidência"],
    text: "Todo trabalho da NEXUS, seja investigar um incêndio ou revisar um laudo, segue o **método científico da NFPA 921**: sete etapas, e nenhuma hipótese é adotada sem ser testada contra os fatos.",
    standards: ["Investigação de incêndios", "Qualificação do investigador"],
    standardsLabel: "Normas de referência",
    stepsLabel: "As sete etapas do método científico segundo a NFPA 921",
    steps: [
      { name: "Reconhecer a necessidade", text: "Ocorreu um incêndio e **sua causa precisa ser determinada**." },
      { name: "Definir o problema", text: "Define-se **o que deve ser resolvido** e como abordá-lo: a origem e a causa do incêndio." },
      { name: "Coletar dados", text: "Reúnem-se **fatos verificáveis**: observação do local, registros, depoimentos e ensaios." },
      { name: "Analisar os dados", text: "Os dados são interpretados **com fundamento científico**, a partir de conhecimento, formação e experiência." },
      { name: "Desenvolver hipóteses", text: "A partir da análise, formulam-se **hipóteses que expliquem** o que foi observado." },
      {
        name: "Testar as hipóteses",
        text: "Cada hipótese é confrontada com **os fatos conhecidos** e com o conhecimento científico aplicável, por raciocínio dedutivo.",
      },
      {
        name: "Selecionar a hipótese final",
        note: "quando os dados permitirem",
        text: "Adota-se a que **resiste ao teste**. Se nenhuma resistir, a causa é classificada como indeterminada.",
      },
    ],
    loopText:
      "Se uma hipótese não resiste, ela é descartada e outras são desenvolvidas. Isso pode exigir novos dados ou uma nova análise dos dados existentes.",
  },
  result: {
    title: ["O que está sólido", "e o que fortalecer"],
    text: "Quando avaliamos ou revisamos um laudo, cada conclusão fica em **um destes três níveis**, com seu fundamento e o que falta para sustentá-la.",
    levels: { sustentada: "Sustentada", respaldo: "Requer respaldo", insuficiente: "Sem sustentação suficiente" },
  },
  profile: {
    role: "Direção técnica · Advogado (Chile) · Investigador de incêndios · IAAI-FIT",
    bio: "Advogado no Chile desde 1997 e investigador de incêndios desde 2012. Integra **investigação de incêndios**, **análise técnico-científica** e **compreensão jurídica da prova pericial**.",
    portraitAlt:
      "Retrato de Domingo Soto Gamé com a camisa da International Association of Arson Investigators e o distintivo de Fire Investigator Technician (IAAI-FIT)",
    sealsLabel: "Credenciais",
    sealAlt: (name) => `Selo ${name}`,
    seals: [
      { name: "IAAI", by: "International Association of Arson Investigators" },
      { name: "IAAI Capítulo 82 Chile", by: "Membro" },
      { name: "IAAI-FIT", by: "Fire Investigator Technician" },
    ],
    ledgerTitle: "Trajetória",
    since: "Desde",
    ledger: [
      { name: "Advogado (Chile)" },
      { name: "Curso de Investigação de Incêndios e Explosões", by: "ANB – Academia Nacional de Bomberos de Chile" },
      {
        name: "Investigador de Incêndios",
        by: "Cuerpo de Bomberos de Valdivia (Corpo de Bombeiros de Valdivia). Desde 2020, inspetor-chefe do seu Departamento de Investigação de Incêndios",
      },
      { name: "Curso de Investigação de Incêndios Nível II", by: "Escuela de Bomberos del Cuerpo de Bomberos de Santiago" },
      {
        name: "Curso de Investigação de Incêndios Florestais",
        by: "Capítulo 79 Hispano-Americano – IAAI International Association of Arson Investigators",
      },
      { name: "Membro do Capítulo 82 Chile da IAAI", by: "International Association of Arson Investigators" },
      { name: "Membro da IAAI", by: "International Association of Arson Investigators" },
      { name: "Fire Investigator Technician (IAAI-FIT) – Técnico em Investigação de Incêndios" },
    ],
  },
  closing: {
    title: ["Vamos falar", "do seu caso"],
    text: "Contato **direto com Domingo Soto Gamé**. Atendemos casos **em todo o Chile e no exterior**.",
    whatsappLabel: "Escrever pelo WhatsApp",
    emailLabel: "E-mail",
    phoneLabel: "Telefone",
    cityLabel: "Área de atuação",
    coverage: "Nacional e internacional",
  },
  photoAlts: {
    terreno:
      "Domingo Soto Gamé, com capacete da NEXUS, óculos, respirador e luvas, inspeciona com uma lanterna uma parede carbonizada em uma casa incendiada, com uma prancheta na mão",
    escena: "Capacete da NEXUS, respirador, luvas e lanterna sobre uma mesa em um cômodo incendiado, ao lado do marcador de evidência número 1",
    marcador: "Marcador de evidência número 2 e uma escala ao lado de um cabo queimado na base de uma parede carbonizada",
    marcador3: "Marcador de evidência número 3 no chão de um cômodo carbonizado, ao lado de um móvel queimado",
    tablero: "Quadro elétrico carbonizado e aberto, com o marcador de evidência número 4 e uma escala logo abaixo",
    incendio1: "Casa de dois andares tomada pelas chamas à noite, com uma coluna de fumaça sobre os fios da rua",
    incendio2: "Incêndio noturno em uma casa antiga, com mangueiras de bombeiros na rua molhada",
    incendio3: "Bombeiros com uma escada diante de uma casa em chamas, à noite",
    evidencia:
      "Parede com um padrão de queima em forma de V sobre uma caixa elétrica danificada, ao lado de uma trena e de um marcador de evidência numerado",
    informe: "Mãos revisando um laudo pericial impresso com um marca-texto, ao lado de uma luminária de mesa",
  },
  footer: {
    motto: "Evidência · Análise · Contexto · Decisões",
    legal: "Avaliação pericial independente e investigação de incêndios",
  },
  notFound: {
    metaTitle: "Página não encontrada | NEXUS",
    title: "Esta página não existe",
    text: "O link pode estar digitado errado ou a página pode ter mudado de endereço.",
    back: "Voltar ao início",
  },
  ogAlt: "NEXUS: Auditoria forense de incêndios. Domingo Soto Gamé",
};

export const texts: Record<Locale, Texts> = { es, en, pt };

// ============================================================================================================
// 4. Contenido por idioma: datos comunes más textos, con la forma que usan los componentes
// ============================================================================================================

function build(locale: Locale) {
  const t = texts[locale];
  return {
    locale,
    path: localeInfo[locale].path,
    site: { ...siteBase, ...t.site },
    links: { ...links, asesoria: whatsapp(t.whatsappText) },
    navLinks: barNavKeys.map((k) => ({ key: k, href: navHrefs[k], label: t.nav.links[k] })),
    footerLinks: (Object.keys(navHrefs) as NavKey[]).map((k) => ({ key: k, href: navHrefs[k], label: t.nav.links[k] })),
    /** Las tres líneas de servicio con sus servicios, para el submenú de la barra. */
    serviceGroups: serviceGroupIds.map((id) => ({
      id,
      href: serviceGroupHref(id),
      label: t.servicesIntro.groups[id],
      services: serviceIds.filter((s) => serviceGroup[s] === id).map((s) => t.services[s].short),
    })),
    navCta: t.nav.cta,
    languageLabel: t.languageLabel,
    a11y: t.a11y,
    hero: { ...t.hero, name: contact.name, firstName: contact.firstName, lastName: contact.lastName },
    advisor: t.advisor,
    intersection: t.intersection,
    servicesIntro: t.servicesIntro,
    services: serviceIds.map((id) => ({ id, group: serviceGroup[id], ...t.services[id] })),
    method: {
      ...t.method,
      standards: standardCodes.map((code, i) => ({ code, name: t.method.standards[i] })),
      steps: t.method.steps as MethodStepText[],
      // Los pasos se cuentan desde 1: la nota del ciclo va bajo el paso 6.
      loop: { from: 6, text: t.method.loopText },
    },
    result: { ...t.result, levels: verdicts.map((id) => ({ id, name: t.result.levels[id] })) },
    profile: {
      ...t.profile,
      seals: sealLogos.map((logo, i) => ({ logo, ...t.profile.seals[i] })),
      ledger: ledgerMeta.map((m, i) => ({
        year: m.year,
        yearNote: m.since ? t.profile.since : undefined,
        logo: m.logo,
        ...t.profile.ledger[i],
      })) as LedgerRow[],
    },
    closing: t.closing,
    photos: Object.fromEntries(
      (Object.keys(photoFiles) as PhotoId[]).map((id) => [id, { ...photoFiles[id], alt: t.photoAlts[id] }]),
    ) as Record<PhotoId, (typeof photoFiles)[PhotoId] & { alt: string }>,
    footer: t.footer,
    notFound: t.notFound,
    og: { image: `/og/${locale}-3.jpg`, width: 1200, height: 630, alt: t.ogAlt },
  };
}

export type Content = ReturnType<typeof build>;
export type Service = Content["services"][number];
export type MethodStep = MethodStepText;

export type LedgerRow = {
  /** Año del hito. Vacío si Domingo no lo indicó. */
  year: string;
  /** Rótulo corto sobre el año: "Desde" en lo que sigue vigente. */
  yearNote?: string;
  /** Sello que ocupa el lugar del año cuando no hay año. */
  logo?: string;
  name: string;
  by?: string;
};

export const content: Record<Locale, Content> = { es: build("es"), en: build("en"), pt: build("pt") };
