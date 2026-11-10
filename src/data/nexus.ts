// Todo lo editable del sitio vive aquí. Ningún texto ni dato de contacto va escrito dentro de los componentes.
// Fuente: portafolio PDF 2026 y brochure de NEXUS. Lo que no está en esos materiales no se publica.

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

export const hero = {
  titleLines: ["Investigación", "de incendios"],
  name: "Domingo Soto Gamé",
  firstName: "Domingo",
  lastName: "Soto Gamé",
  // Dos partes para cortar la línea en móvil
  roleLines: ["Auditoría forense e", "investigación de incendios"],
  // Etiqueta rotativa junto al nombre: solo datos del portafolio, nada inventado.
  tags: ["Abogado desde 1997", "Investigador IAAI-FIT", "Método NFPA 921", "IAAI · Capítulo 82 Chile"],
  primaryCta: "Solicitar asesoría",
  secondaryCta: "Ver servicios",
};

// ---------- Intersección: qué es NEXUS ----------
// Un solo bloque (Aaron, 10-11): título, una línea, a quiénes atiende como etiquetas, la X y la foto de terreno.

export const intersection = {
  title: ["Tres disciplinas,", "un solo criterio"],
  // Las palabras entre **dobles asteriscos** se destacan en negrita.
  body: "Derecho, ciencia forense e investigación de incendios en un mismo análisis. **El mismo criterio, sin importar quién contrata.**",
  // Los tres hilos que llegan a la X del logo.
  threads: ["Derecho", "Ciencia forense", "Investigación de incendios"],
  knot: "Una conclusión fundada",
  audiencesTitle: "Trabajamos con",
  audiences: ["Peritos e investigadores", "Abogados y estudios jurídicos", "Aseguradoras", "Empresas"],
};

// ---------- Servicios ----------
// "Formación especializada" viene del brochure; Aaron confirmó incluirla el 10-11.

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
    cta: "Pedir auditoría por WhatsApp",
    situation: "Tengo un informe pericial y necesito saber si se sostiene",
    name: "Auditoría técnica de informes periciales",
    text: "Revisión **independiente** de un informe pericial: metodología, sustento técnico y conclusiones.",
    includes: ["Evaluación conforme a NFPA 921", "Coherencia y trazabilidad del razonamiento", "Informe con observaciones fundadas"],
  },
  {
    id: "litigacion",
    cta: "Pedir asesoría por WhatsApp",
    situation: "Estoy en juicio y debo usar o cuestionar prueba técnica",
    name: "Consultoría técnica para litigación",
    text: "Asesoría a abogados para **comprender, usar y cuestionar** la evidencia técnica.",
    includes: ["Lectura técnica de informes periciales", "Puntos clave para la teoría del caso", "Preparación para interrogar peritos"],
  },
  {
    id: "controvertidas",
    cta: "Pedir revisión por WhatsApp",
    situation: "Hay una pericia en disputa",
    name: "Revisión técnica de pericias controvertidas",
    text: "Evaluación de pericias cuya **metodología o conclusiones** están en disputa.",
    includes: ["Contraste entre datos y conclusiones", "Análisis de hipótesis alternativas", "Fundamentos técnicos para la discusión"],
  },
  {
    id: "investigacion",
    cta: "Pedir investigación por WhatsApp",
    situation: "Ocurrió un incendio y hay que determinar su origen y causa",
    name: "Investigación de incendios",
    text: "Determinación del **origen y la causa** del incendio, con un proceso documentado.",
    includes: ["Examen y registro del sitio", "Patrones de fuego y fuentes posibles", "Informe técnico pericial"],
  },
  {
    id: "prejudicial",
    cta: "Pedir evaluación por WhatsApp",
    situation: "Todavía no judicializo y quiero evaluar el caso",
    name: "Asesoría prejudicial estratégica",
    text: "Evaluación técnica **antes de judicializar**: alcance de la evidencia y próximos pasos.",
    includes: ["Análisis preliminar de antecedentes", "Riesgos probatorios y peritajes necesarios", "Apoyo en negociación temprana"],
  },
  {
    id: "formacion",
    cta: "Consultar formación por WhatsApp",
    situation: "Mi equipo necesita formarse en investigación de incendios",
    name: "Formación especializada",
    text: "Capacitaciones en **investigación de incendios**, análisis de evidencia e informes.",
    includes: ["Investigación de incendios", "Análisis de evidencia", "Elaboración de informes"],
  },
];

/** Mensaje de WhatsApp para consultar por un servicio puntual. */
export const serviceWhatsapp = (s: Service) => whatsapp(`Hola Domingo, quiero consultar por el servicio de ${s.name.toLowerCase()}.`);

// ---------- Método ----------
// Una línea, las dos normas como etiquetas, la foto y la cadena con frases cortas (Aaron, 10-11).

export const method = {
  title: ["Cada conclusión,", "atada a su evidencia"],
  text: "Método científico: **todas las hipótesis razonables**, toda la evidencia disponible.",
  standards: [
    { code: "NFPA 921", name: "Investigación de incendios" },
    { code: "NFPA 1033", name: "Competencia del investigador" },
  ],
  // La cadena de trazabilidad: el orden es información, por eso se muestra en secuencia.
  chain: [
    { name: "Datos", text: "Examen y registro **del sitio**." },
    { name: "Análisis", text: "**Patrones de fuego** y fuentes posibles." },
    { name: "Hipótesis", text: "**Todas las razonables**, no solo la obvia." },
    { name: "Conclusión", text: "Solo lo que **la evidencia sostiene**." },
  ],
};

// ---------- Resultado: informe de ejemplo ----------

export type Verdict = "sustentada" | "respaldo" | "no";

export const result = {
  title: ["Qué se sostiene", "y qué no"],
  text: "Cada conclusión del informe revisado queda en **uno de estos tres niveles**, con su fundamento.",
  levels: [
    { id: "sustentada", name: "Sustentada" },
    { id: "respaldo", name: "Requiere respaldo" },
    { id: "no", name: "No se sostiene" },
  ] as { id: Verdict; name: string }[],
};

// ---------- Perfil ----------
// Bio de una frase; las credenciales van como etiquetas; la trayectoria queda como registro con años.

export const profile = {
  role: "Dirección técnica · Abogado · Investigador de incendios IAAI-FIT",
  bio: "Abogado desde 1997 e investigador certificado: une el **análisis jurídico de la prueba** con la **investigación técnica de incendios**.",
  // Sellos de afiliación y credencial, con los logos del portafolio PDF del cliente (Aaron pidió usarlos, 10-11).
  seals: [
    { logo: "/logos/iaai.webp", name: "IAAI", by: "International Association of Arson Investigators" },
    { logo: "/logos/iaai-capitulo-82.webp", name: "IAAI Capítulo 82 Chile", by: "Miembro" },
    { logo: "/logos/iaai-fit.webp", name: "IAAI-FIT®", by: "Fire Investigation Technician" },
  ],
  ledgerTitle: "Trayectoria",
  ledger: [
    { year: "1997", name: "Abogado", by: "Ejercicio profesional" },
    { year: "2011", name: "Investigación de Incendios y Explosiones", by: "Academia Nacional de Bomberos de Chile" },
    { year: "2023", name: "Investigación de Incendios, Nivel II", by: "Cuerpo de Bomberos de Santiago" },
    { year: "2023", name: "Investigación de Incendios Forestales", by: "IAAI" },
  ],
};

/** Lista plana de credenciales. */
export const credentials = [
  "IAAI-FIT®, Fire Investigation Technician, International Association of Arson Investigators",
  "Miembro IAAI, Capítulo 82 Chile",
  "Investigación de Incendios y Explosiones, Academia Nacional de Bomberos de Chile, 2011",
  "Investigación de Incendios, Nivel II, Cuerpo de Bomberos de Santiago, 2023",
  "Investigación de Incendios Forestales, IAAI, 2023",
];

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
    "Auditoría técnica de informes periciales, investigación de incendios y consultoría para litigación, según NFPA 921. Domingo Soto Gamé, abogado e investigador IAAI-FIT. Valdivia, Chile.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexuschile.net",
  tagline: "Método científico. Utilidad jurídica.",
};
