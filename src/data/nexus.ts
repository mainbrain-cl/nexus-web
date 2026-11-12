// Todo lo editable del sitio vive aquí. Ningún texto ni dato de contacto va escrito dentro de los componentes.
// Fuente: portafolio PDF 2026, brochure de NEXUS y respuestas de Domingo del 12-11. Lo que no está en esos
// materiales no se publica.
//
// Tono (Domingo, 12-11): NEXUS no fiscaliza a sus pares ni busca errores para desacreditar a nadie. Ofrece una
// evaluación independiente que integra investigación de incendios, análisis técnico-científico y comprensión
// jurídica de la prueba pericial: sirve a quien evalúa un informe y a quien quiere fortalecer el suyo.
// Evitar "cuestionar", "desacreditar", "no se sostiene", "interrogar" y cualquier tono de confrontación.

const phoneE164 = "+56998835977";
const whatsappText = "Hola Domingo, quiero solicitar una asesoría con NEXUS.";

export const contact = {
  name: "Domingo Soto Gamé",
  phoneDisplay: "+56 9 9883 5977",
  phoneE164,
  email: "domingosoto@nexuschile.net",
  web: "nexuschile.net",
  city: "Valdivia, Chile",
};

/** Enlace a WhatsApp con un mensaje ya escrito. */
export const whatsapp = (text: string) => `https://wa.me/${phoneE164.replace("+", "")}?text=${encodeURIComponent(text)}`;

export const links = {
  // Formulario de contacto (Domingo y Aaron, 12-11): canal principal. WhatsApp queda como alternativa.
  formulario: "#contacto",
  // Canal principal: WhatsApp, con correo y teléfono como alternativas, sin formulario (Aaron, 10-11).
  asesoria: whatsapp(whatsappText),
  email: `mailto:${contact.email}`,
  phone: `tel:${phoneE164}`,
};

export const navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#metodo", label: "Método" },
  // "Quién soy" en vez de "Perfil" (Aaron, 10-11).
  { href: "#perfil", label: "Quién soy" },
  { href: "#contacto", label: "Contacto" },
] as const;

/** Textos que solo leen los lectores de pantalla o que no se ven en pantalla. */
export const a11y = {
  skipLink: "Saltar al contenido",
  mainNav: "Principal",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  footerNav: "Secciones del sitio",
  footerContact: "Contacto",
  backHome: "volver al inicio",
};

export const hero = {
  titleLines: ["Investigación", "de incendios"],
  name: "Domingo Soto Gamé",
  firstName: "Domingo",
  lastName: "Soto Gamé",
  // Dos partes para cortar la línea en móvil
  roleLines: ["Auditoría forense e", "investigación de incendios"],
  // Etiqueta rotativa junto al nombre: solo datos de la trayectoria, nada inventado.
  tags: ["Abogado desde 1997", "IAAI-FIT", "Método NFPA 921", "IAAI · Capítulo 82 Chile"],
  primaryCta: "Solicitar asesoría",
  secondaryCta: "Ver servicios",
  photoAlt: "Domingo Soto Gamé con uniforme de la International Association of Arson Investigators",
  sealsLabel: "Afiliaciones y credencial IAAI",
};

// ---------- Intersección: qué es NEXUS ----------
// Un solo bloque (Aaron, 10-11): título, una línea, a quiénes atiende como etiquetas, la X y la foto de terreno.
// Las tres competencias van en palabras de Domingo (12-11).

export const intersection = {
  title: ["Tres competencias,", "un solo criterio"],
  // Las palabras entre **dobles asteriscos** se destacan en negrita.
  body: "Investigación de incendios, análisis técnico-científico y comprensión jurídica de la prueba pericial en una misma evaluación independiente. **Sirve a quien evalúa un informe y a quien quiere fortalecer el suyo.**",
  // Los tres hilos que llegan a la X del logo.
  threads: ["Investigación de incendios", "Análisis técnico-científico", "Comprensión jurídica de la prueba pericial"],
  knot: "Una conclusión fundada",
  // Descripción del diagrama para lectores de pantalla.
  diagramLabel:
    "Diagrama: la investigación de incendios, el análisis técnico-científico y la comprensión jurídica de la prueba pericial se cruzan en la X de NEXUS. De ese cruce sale un solo hilo: una conclusión fundada.",
  audiencesTitle: "Trabajamos con",
  // Orden pedido por Domingo (12-11).
  audiences: [
    "Aseguradoras y liquidadores",
    "Abogados y estudios jurídicos",
    "Investigadores y empresas de investigación",
    "Empresas",
  ],
};

// ---------- Servicios ----------
// "Formación especializada" viene del brochure; Aaron confirmó incluirla el 10-11.
// "Revisión independiente de informe pericial" la pidió Domingo el 12-11: es para quien escribe un informe.
// La Auditoría, en cambio, es para quien recibe uno.

export type Service = {
  id: string;
  /** La situación del visitante, en sus palabras: es la puerta de entrada al servicio. */
  situation: string;
  name: string;
  /** Una sola línea. */
  text: string;
  /** Tres puntos como máximo. */
  includes: string[];
  /** Texto del botón: nombra el servicio y el canal, corto para que quepa en un celular. */
  cta: string;
};

export const servicesIntro = {
  title: ["¿En qué punto", "está su caso?"],
  text: "Elija la situación más parecida a la suya.",
  includesTitle: "Qué incluye",
};

export const services: Service[] = [
  {
    id: "auditoria",
    cta: "Pedir auditoría",
    situation: "Recibí un informe pericial y necesito una opinión independiente",
    name: "Auditoría técnica de informes periciales",
    text: "Evaluación **independiente** de un informe pericial presentado en su caso, para decidir con fundamento.",
    includes: ["Evaluación conforme a NFPA 921", "Coherencia y trazabilidad del razonamiento", "Informe con observaciones fundadas"],
  },
  {
    id: "revision",
    cta: "Pedir revisión",
    situation: "Soy investigador y quiero reforzar mi informe antes de entregarlo",
    name: "Revisión independiente antes de la entrega",
    text: "Metodología, sustento técnico y conclusiones: una segunda mirada **técnica y jurídica**, confidencial, antes de entregar su informe.",
    includes: [
      "Metodología y sustento técnico según NFPA 921",
      "Lectura jurídica del informe como prueba pericial",
      "Observaciones confidenciales, solo para usted",
    ],
  },
  {
    id: "litigacion",
    cta: "Pedir asesoría",
    situation: "Estoy en juicio y la prueba técnica es decisiva",
    name: "Consultoría técnica para litigación",
    text: "Asesoría a abogados para **comprender y usar con solidez** la prueba técnica.",
    includes: ["Lectura técnica de informes periciales", "Puntos clave para la teoría del caso", "Preparación de audiencias con prueba pericial"],
  },
  {
    id: "controvertidas",
    cta: "Pedir análisis",
    situation: "Hay pericias que llegan a conclusiones distintas",
    name: "Revisión técnica de pericias controvertidas",
    text: "Análisis técnico de pericias **con conclusiones en discusión**, para ordenar el debate sobre bases verificables.",
    includes: ["Contraste entre datos y conclusiones", "Análisis de hipótesis alternativas", "Fundamentos técnicos para la discusión"],
  },
  {
    id: "investigacion",
    cta: "Pedir investigación",
    situation: "Ocurrió un incendio y hay que determinar su origen y causa",
    name: "Investigación de incendios",
    text: "Determinación del **origen y la causa** del incendio, con un proceso documentado.",
    includes: ["Examen y registro del sitio", "Patrones de fuego y fuentes posibles", "Informe técnico pericial"],
  },
  {
    id: "prejudicial",
    cta: "Pedir evaluación",
    situation: "Todavía no judicializo y quiero evaluar el caso",
    name: "Asesoría prejudicial estratégica",
    text: "Evaluación técnica **antes de judicializar**: alcance de la evidencia y próximos pasos.",
    includes: ["Análisis preliminar de antecedentes", "Riesgos probatorios y peritajes necesarios", "Apoyo en negociación temprana"],
  },
  {
    id: "formacion",
    cta: "Consultar formación",
    situation: "Mi equipo necesita formarse en investigación de incendios",
    name: "Formación especializada",
    text: "Capacitaciones en **investigación de incendios**, análisis de evidencia e informes.",
    includes: ["Investigación de incendios", "Análisis de evidencia", "Elaboración de informes"],
  },
];


// ---------- Método ----------
// Los siete pasos del método científico de NFPA 921 (edición 2024), con los nombres que dio Domingo (12-11).
// Las frases resumen la norma sin agregarle requisitos.

export type MethodStep = {
  name: string;
  /** Condición que completa el nombre; se muestra más pequeña, tras una coma. */
  note?: string;
  text: string;
};

export const method = {
  title: ["Cada conclusión,", "atada a su evidencia"],
  text: "La investigación sigue el **método científico de NFPA 921**: siete pasos, y ninguna hipótesis se adopta sin ponerla a prueba contra los hechos.",
  standards: [
    { code: "NFPA 921", name: "Investigación de incendios" },
    { code: "NFPA 1033", name: "Competencia del investigador" },
  ],
  standardsLabel: "Normas de referencia",
  stepsLabel: "Los siete pasos del método científico según NFPA 921",
  steps: [
    { name: "Reconocer la necesidad", text: "Ocurrió un incendio y **su causa debe determinarse**." },
    { name: "Definir el problema", text: "Se precisa **qué debe resolverse** y cómo abordarlo: origen, causa o responsabilidad." },
    { name: "Recopilar datos", text: "Se reúnen **hechos verificables**: observación del sitio, registros, testimonios y ensayos." },
    { name: "Analizar los datos", text: "Los datos se interpretan **con fundamento científico**, a partir de conocimiento, formación y experiencia." },
    { name: "Desarrollar hipótesis", text: "A partir del análisis se formulan **hipótesis que expliquen** lo observado." },
    { name: "Poner a prueba las hipótesis", text: "Cada hipótesis se contrasta con **los hechos conocidos** y con el conocimiento científico aplicable, por razonamiento deductivo." },
    {
      name: "Seleccionar una hipótesis final",
      note: "cuando los antecedentes lo permitan",
      text: "Se adopta la que **resiste la prueba**. Si ninguna lo hace, la causa queda como no determinada.",
    },
  ] as MethodStep[],
  // El ciclo de NFPA 921: una hipótesis que no resiste la prueba devuelve el trabajo a los datos.
  // Los pasos se cuentan desde 1: el hilo de retorno va del paso 6 al 3.
  loop: {
    from: 6,
    to: 3,
    text: "Si una hipótesis no resiste, se descarta y se desarrollan otras. Eso puede requerir nuevos datos o un nuevo análisis de los existentes.",
  },
};

// ---------- Resultado: qué entrega una revisión ----------

export type Verdict = "sustentada" | "respaldo" | "insuficiente";

export const result = {
  title: ["Qué está sólido", "y qué reforzar"],
  text: "Cada conclusión del informe queda en **uno de estos tres niveles**, con su fundamento y lo que falta para respaldarla.",
  levels: [
    { id: "sustentada", name: "Sustentada" },
    { id: "respaldo", name: "Requiere respaldo" },
    { id: "insuficiente", name: "Sin sustento suficiente" },
  ] as { id: Verdict; name: string }[],
};

// ---------- Perfil ----------
// Bio de una frase; las credenciales van como sellos; la trayectoria es la lista de Domingo (12-11), con sus
// palabras, ordenada por año y con el año separado del nombre.

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

export const profile = {
  role: "Dirección técnica · Abogado · Investigador de incendios · IAAI-FIT",
  bio: "Abogado desde 1997 e investigador de incendios desde 2012. Une la **investigación técnica** con la **comprensión jurídica de la prueba pericial**.",
  portraitAlt:
    "Retrato de Domingo Soto Gamé con la camisa de la International Association of Arson Investigators y el parche de Fire Investigator Technician (IAAI-FIT)",
  sealsLabel: "Credenciales",
  sealAlt: (name: string) => `Sello ${name}`,
  // Sellos de afiliación y credencial, con los logos del portafolio PDF del cliente (Aaron pidió usarlos, 10-11).
  seals: [
    { logo: "/logos/iaai.webp", name: "IAAI", by: "International Association of Arson Investigators" },
    { logo: "/logos/iaai-capitulo-82.webp", name: "IAAI Capítulo 82 Chile", by: "Miembro" },
    { logo: "/logos/iaai-fit.webp", name: "IAAI-FIT", by: "Fire Investigator Technician (IAAI-FIT) – Técnico en Investigación de Incendios" },
  ],
  ledgerTitle: "Trayectoria",
  ledger: [
    { year: "1997", name: "Abogado" },
    {
      year: "2011",
      name: "Curso de Investigación de Incendios y Explosiones",
      by: "ANB – Academia Nacional de Bomberos de Chile",
    },
    {
      year: "2012",
      yearNote: "Desde",
      name: "Investigador de Incendios",
      by: "Cuerpo de Bomberos de Valdivia. Desde 2020 Inspector jefe del Departamento de Investigación de Incendios del CB",
    },
    {
      year: "2023",
      name: "Curso de Investigación de Incendios Nivel II",
      by: "Escuela de Bomberos del Cuerpo de Bomberos de Santiago",
    },
    {
      year: "2023",
      name: "Curso de Investigación de Incendios Forestales",
      by: "Capítulo 79 Hispanoamericano – IAAI International Association of Arson Investigators",
    },
    { year: "2023", name: "Miembro de Cap 82 Chile IAAI", by: "International Association of Arson Investigators" },
    { year: "2024", yearNote: "Desde", name: "Miembro IAAI", by: "International Association of Arson Investigators" },
    {
      year: "",
      logo: "/logos/iaai-fit.webp",
      name: "Fire Investigator Technician (IAAI-FIT) – Técnico en Investigación de Incendios",
    },
  ] as LedgerRow[],
};

// ---------- Contacto ----------

export const closing = {
  title: ["Hablemos", "de su caso"],
  text: "Contacto **directo con Domingo Soto Gamé**.",
  whatsappLabel: "Escribir por WhatsApp",
  emailLabel: "Correo",
  phoneLabel: "Teléfono",
  cityLabel: "Base",
};

// Fotos entregadas por Aaron el 10-11; aparentan ser generadas con IA. Aaron pidió usarlas todas y sin el rótulo
// "Imagen referencial". Las dos en que aparece Domingo requieren su aprobación antes de publicar el sitio.
// Domingo no quiere fotos reales de Bomberos (12-11).
export const photos = {
  terreno: {
    src: "/fotos/terreno.webp",
    width: 1672,
    height: 941,
    alt: "Domingo Soto Gamé, con la camisa del uniforme IAAI, inspecciona con una linterna un muro calcinado en una vivienda quemada",
  },
  reunion: {
    src: "/fotos/reunion.webp",
    width: 1672,
    height: 941,
    alt: "Domingo Soto Gamé explica un informe con fotografías a un abogado en una oficina",
  },
  evidencia: {
    src: "/fotos/evidencia.webp",
    width: 1672,
    height: 941,
    alt: "Muro con un patrón de quemadura en forma de V sobre una caja eléctrica dañada, junto a una cinta métrica y un marcador de evidencia numerado",
  },
  informe: {
    src: "/fotos/informe.webp",
    width: 1672,
    height: 941,
    alt: "Manos revisando un informe pericial impreso con un destacador, junto a una lámpara de escritorio",
  },
};

export const footer = {
  motto: "Evidencia · Análisis · Contexto · Decisiones",
  legal: "Auditoría forense y consultoría experta en investigación de incendios",
};

export const site = {
  name: "NEXUS",
  title: "NEXUS | Auditoría forense e investigación de incendios",
  description:
    "Evaluación independiente de informes periciales e investigación de incendios según NFPA 921, con mirada técnica y jurídica. Domingo Soto Gamé, abogado e investigador de incendios, IAAI-FIT. Valdivia, Chile.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexuschile.net",
  tagline: "Método científico. Utilidad jurídica.",
};
