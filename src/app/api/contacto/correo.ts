// Arma el correo a Domingo a partir de una consulta ya validada. Siempre en español.
//
// Diseño: de lectura fácil y visual. Franja oscura con el logo; título con el servicio, fecha y, si la hay, la
// urgencia en una banda; el aviso fijo; y cuatro tarjetas con ícono: quién escribe, qué necesita, detalles del caso
// (solo los que vienen con dato) y cómo responder, con botones grandes. Los datos cortos van en dos columnas que
// en el celular pasan a una. Hecho para Gmail: tablas, estilos en línea,
// 600 px de ancho máximo y fuentes del sistema; no depende de fuentes web, y la única regla en `<style>` es una mejora.
//
// Defensas (si el diseño choca con una, gana la defensa):
// - Todo valor del visitante se escapa antes de entrar al HTML; el asunto solo lleva textos de las listas blancas.
// - Arriba del aviso fijo va solo lo que arma el sistema con listas cerradas (servicio, urgencia) y la fecha.
//   Todo lo del visitante va después del aviso, bajo una etiqueta y en peso normal: la negrita es de los textos
//   fijos, así que no puede escribir algo que parezca un título o un aviso de NEXUS.
// - Enlaces desactivados (`https://x.com` → `hxxps://x[.]com`), también los disfrazados con caracteres invisibles.
// - En texto plano, la descripción va con sangría para que no pueda imitar una sección del correo.
// - Los enlaces de los botones (mailto, wa.me y tel) se arman solo con el correo ya validado y con los dígitos
//   del teléfono; si no pasan su propia revisión, el botón no se muestra.

import { emailTexts, getFormTexts, servicesWithoutIncident, statusVariantByService } from "@/data/formulario";
import { isEmail, type ContactPayload } from "@/lib/contacto";

const es = getFormTexts("es");

/**
 * Base de las imágenes del correo (logo e íconos): PNG servidos por el sitio, porque Gmail no muestra SVG.
 * Se generan con `scripts/correo-logo.mjs` y `scripts/correo-iconos.mjs` en `public/correo/`.
 */
export const ASSET_BASE = "https://nexuschile.net/correo";
const LOGO = { width: 124, height: 40 };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Desactiva enlaces y dominios para que el cliente de correo no los convierta en enlaces. */
export const defang = (s: string) =>
  s
    // Antes de buscar: forma compatible (letras de ancho completo, puntos parecidos como U+2024 o U+FE52 → `.`) y
    // fuera los caracteres que no se ven (U+034F, selectores de variación U+FE0F…). Sin esto, `h͏ttps://` o
    // `evil️.com` se leen igual que un enlace pero no calzan con las reglas de abajo.
    .normalize("NFKC")
    .replace(/\p{Default_Ignorable_Code_Point}/gu, "")
    // Sin exigir inicio de palabra: `textohttps://x.com` también queda desactivado.
    .replace(/(h)(t)tp(s?):\/\//gi, (_m, h: string, t: string, sec: string) => `${h}${t === "T" ? "XX" : "xx"}p${sec}://`)
    // Una IP sin esquema: `1.2.3.4/login` → `1[.]2[.]3[.]4/login`.
    .replace(/(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\d])/g, "$1[.]$2[.]$3[.]$4")
    // Un punto entre dos partes de nombre de dominio (la segunda con al menos dos caracteres y una letra):
    // `x.com` → `x[.]com`; quedan igual `S.A.`, `3.5` y el punto final de una frase. Las marcas combinantes
    // (`\p{M}`, un acento pegado a la letra) cuentan como parte del nombre.
    .replace(/([\p{L}\p{N}\p{M}_-])[.。．｡․﹒۔](?=[\p{L}\p{N}\p{M}-]{2})(?=[\p{L}\p{N}\p{M}-]*\p{L})/gu, "$1[.]");

// ---------- Enlaces para responder ----------

/**
 * `mailto:` al visitante. El correo ya pasó `isEmail` en el servidor; aquí se revisa otra vez y se codifica la
 * parte local, que admite `%` y `+`. El asunto es un texto fijo.
 */
export function mailtoHref(correo: string, subject: string): string | null {
  const at = correo.lastIndexOf("@");
  if (!isEmail(correo) || at < 1) return null;
  const local = correo.slice(0, at);
  const domain = correo.slice(at + 1);
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return null;
  const enc = (v: string) => encodeURIComponent(v).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `mailto:${enc(local)}@${domain}?subject=${enc(subject)}`;
}

/**
 * Enlaces de teléfono y WhatsApp: solo dígitos y, si corresponde, un `+` al inicio.
 * WhatsApp necesita el código de país: se ofrece si el número viene con `+` o si es un celular chileno
 * (9 dígitos que empiezan con 9, con o sin el 56 adelante). Si no, queda solo el botón de llamar.
 */
export function phoneHrefs(telefono: string): { tel: string; whatsapp: string | null } | null {
  const digits = telefono.replace(/[^0-9]/g, "");
  if (digits.length < 6 || digits.length > 15) return null;
  let intl: string | null = null;
  if (telefono.trim().startsWith("+")) intl = digits;
  else if (/^9[0-9]{8}$/.test(digits)) intl = `56${digits}`;
  else if (/^569[0-9]{8}$/.test(digits)) intl = digits;
  return { tel: `tel:${intl ? `+${intl}` : digits}`, whatsapp: intl ? `https://wa.me/${intl}` : null };
}

// ---------- Contenido ----------

const INDENT = "    ";
const indent = (v: string) => v.split("\n").map((l) => INDENT + l).join("\n");

const label = <T extends { id: string; label: string }>(list: T[], id: string) => list.find((o) => o.id === id)?.label ?? id;


/** Fecha y hora de Chile, en 24 horas: larga para el cuerpo (`20 de noviembre de 2026, 14:32`) y corta para el asunto. */
function chileDate(sentAt: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Santiago" })
      .formatToParts(sentAt)
      .map((x) => [x.type, x.value]),
  );
  const day = new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(sentAt);
  const two = (x: string) => x.padStart(2, "0"); // es-CL puede entregar el día y el mes sin cero
  const time = `${two(p.hour)}:${two(p.minute)}`;
  return { long: `${day}, ${time}`, short: `${two(p.day)}-${two(p.month)} ${time}` };
}

// ---------- Estilos en línea ----------
// Tarjetas blancas sobre un fondo cálido, cada una con su ícono y su título; los datos cortos van en una grilla de dos
// columnas que en el celular pasa a una. La jerarquía se marca con el tamaño y el peso, siempre igual:
// título (25 px, 800) > título de tarjeta (20 px, 700) > dato o párrafo (18 px, 400) > etiqueta (15 px, 600, un
// tono más suave) > aviso (15 px) > pie (13 px). La negrita queda para los textos fijos del correo: lo que escribió
// el visitante va siempre en peso normal.

const C = {
  ceniza: "#120f0d",
  oro: "#c9a26b",
  oroTinta: "#7c5c34", // oro oscuro del logo: fondo del botón principal
  hueso: "#f4eee6",
  fondo: "#f1ebe1",
  tarjeta: "#ffffff",
  aviso: "#f7ecd9",
  urgente: "#f3dfbd",
  borde: "#e2d6c3",
  tinta: "#14100d", // datos, párrafos y títulos
  etiqueta: "#4d4238", // etiquetas: más suave que el dato, pero de alto contraste (9:1 sobre blanco)
  pie: "#5c5148",
};
const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
/** Un texto largo sin espacios (una URL, por ejemplo) no ensancha el correo en el celular. */
const WRAP = "word-break:break-word;overflow-wrap:anywhere;";
const TABLE = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';

/**
 * Íconos del correo: nombres fijos de archivos en `public/correo/iconos/` (los genera `scripts/correo-iconos.mjs`).
 * Nunca dependen de lo que escribió el visitante. Son decorativos: llevan `alt=""` y el texto se entiende sin ellos.
 */
export const ICONS = [
  "persona", "mensaje", "llama", "responder", "aviso", "urgencia", "cliente", "identificacion", "empresa", "idioma",
  "situacion", "lugar", "fecha", "plazo", "correo", "telefono",
] as const;
type Icon = (typeof ICONS)[number];
const icon = (name: Icon, size: number, style: string) =>
  `<img src="${ASSET_BASE}/iconos/${name}.png" width="${size}" height="${size}" alt="" style="width:${size}px;height:${size}px;border:0;outline:none;${style}">`;

/** Ancho de cada columna de la grilla: dos caben en la tarjeta a 600 px; en el celular queda una por fila. */
const COL = 260;
/**
 * Única regla en `<style>`, como mejora: en el celular cada columna ocupa todo el ancho de la tarjeta. Si el
 * cliente de correo la descarta, la columna queda de 260 px y el correo se lee igual.
 */
const STYLE = `@media (max-width:560px){.nx-col{max-width:100%!important}}`;

/** Dato de una tarjeta: ícono fijo, etiqueta fija y valor. */
type Field = [Icon, string, string];

export function buildEmail(d: ContactPayload, sentAt: Date) {
  const s = es.steps;
  const t = emailTexts;
  const cliente = label(s.cliente.options, d.cliente);
  const servicio = label(s.servicio.options, d.servicio);
  const statusVariant = statusVariantByService[d.servicio];
  const variant: { id: string; label: string }[] = statusVariant ? s.estado.variants[statusVariant] : [];
  const noIncident = servicesWithoutIncident.includes(d.servicio);

  // Lo que el visitante escribió a mano pasa por `defang`. El correo no: ya está validado y es el `reply_to`.
  const v = {
    clienteOtro: defang(d.clienteOtro),
    lugar: defang(d.lugar),
    fecha: defang(d.fecha),
    descripcion: defang(d.descripcion),
    plazoDetalle: defang(d.plazoDetalle),
    nombre: defang(d.nombre),
    empresa: defang(d.empresa),
    telefono: defang(d.telefono),
  };

  const urgencia = d.urgencia ? label(s.caso.urgencia.options, d.urgencia) : "";
  const urgente = d.urgencia === "urgente";
  const conPlazo = urgente || d.urgencia === "semanas";
  const estado = d.estado.map((id) => label(variant, id));
  const fecha = chileDate(sentAt);
  const idioma = t.languages[d.idioma];
  const title = t.title(servicio);
  const detallesTitle = noIncident ? t.sections.detallesCapacitacion : t.sections.detalles;

  const mailto = mailtoHref(d.correo, t.actions.replySubject);
  const phone = d.telefono ? phoneHrefs(d.telefono) : null;

  // Arriba del aviso fijo va solo lo que arma el sistema con listas cerradas: el servicio en el título, la fecha y la
  // urgencia. Todo lo que escribió el visitante va después del aviso, cada dato bajo su etiqueta y en peso normal.
  // Solo se muestran los datos que vienen con algo: un campo opcional en blanco no ocupa lugar.
  const filled = (rows: Field[]) => rows.filter(([, , val]) => val);
  const quien = filled([
    ["persona", t.labels.nombre, v.nombre],
    ["cliente", t.labels.cliente, cliente],
    ["identificacion", t.labels.clienteOtro, d.cliente === "otro" ? v.clienteOtro : ""],
    ["empresa", t.labels.empresa, v.empresa],
    ["idioma", t.labels.idioma, d.idioma === "es" ? "" : t.idiomaValue(idioma)],
  ]);
  // La urgencia con plazo ya está arriba, en su banda: aquí queda solo el detalle.
  const detalles = filled([
    ["lugar", t.labels.lugar, noIncident ? "" : v.lugar],
    ["fecha", t.labels.fecha, noIncident ? "" : v.fecha],
    ["plazo", t.labels.urgencia, conPlazo ? "" : urgencia],
    ["plazo", t.labels.plazoDetalle, v.plazoDetalle],
  ]);

  // ----- Texto plano -----
  const line = ([, k, val]: Field) => `${k}: ${val}`;
  const text = [
    `${t.brand} · ${title}`,
    t.received(fecha.long),
    ...(conPlazo ? [`${t.labels.urgencia}: ${urgencia}`] : []),
    "",
    `[ ${t.visitorNotice} ]`,
    "",
    t.sections.quien.toUpperCase(),
    ...quien.map(line),
    "",
    t.sections.necesita.toUpperCase(),
    indent(v.descripcion),
    "",
    ...(estado.length || detalles.length
      ? [detallesTitle.toUpperCase(), ...estado.map((i) => `- ${i}`), ...detalles.map(line), ""]
      : []),
    t.sections.responder.toUpperCase(),
    `${t.labels.correo}: ${d.correo}`,
    ...(v.telefono ? [`${t.labels.telefono}: ${v.telefono}`] : []),
    ...(phone?.whatsapp ? [`${t.labels.whatsapp}: ${phone.whatsapp}`] : []),
    t.replyHint,
    "",
    "--",
    t.footer(idioma),
  ].join("\n");

  // ----- HTML -----
  const e = escapeHtml;
  const multiline = (val: string) => e(val).replace(/\n/g, "<br>");

  const labelHtml = (ic: Icon, k: string) =>
    `<div style="font-size:15px;line-height:22px;font-weight:600;color:${C.etiqueta}">${icon(ic, 18, "vertical-align:-3px;margin-right:7px;")}${e(k)}:</div>`;
  const valueHtml = (html: string) => `<div style="${WRAP}font-size:18px;line-height:28px;font-weight:400;color:${C.tinta}">${html}</div>`;
  /** Una celda de la grilla. `html` reemplaza al valor cuando la celda lleva algo más (los botones). */
  const cell = (ic: Icon, k: string, html: string) =>
    `<div class="nx-col" style="display:inline-block;width:100%;max-width:${COL}px;vertical-align:top"><div style="${FONT}padding:16px 14px 0 0">${labelHtml(ic, k)}${html}</div></div>`;
  /** Grilla fluida: celdas `inline-block` de ancho máximo fijo. `font-size:0` quita el espacio entre celdas. */
  const grid = (cells: string[]) => (cells.length ? `<div style="font-size:0;line-height:0">${cells.join("")}</div>` : "");
  const fieldCells = (rows: Field[]) => rows.map(([ic, k, val]) => cell(ic, k, valueHtml(e(val))));

  /** Tarjeta de sección: ícono y título en la cabecera, y el contenido debajo. */
  const card = (ic: Icon, title: string, body: string) =>
    `<tr><td style="padding:14px 0 0"><div style="${FONT}padding:20px 20px 22px;border:1px solid ${C.borde};border-radius:12px;background-color:${C.tarjeta}">` +
    `<div style="font-size:20px;line-height:26px;font-weight:700;color:${C.tinta}">${icon(ic, 24, "vertical-align:-5px;margin-right:10px;")}${e(title)}</div>${body}</div></td></tr>`;
  /** Banda de aviso: ícono a la izquierda y texto fijo. */
  const band = (ic: Icon, bg: string, html: string, size: number, weight: number) =>
    `<tr><td style="padding:14px 0 0"><table ${TABLE} width="100%" style="width:100%"><tr>` +
    `<td width="40" valign="top" bgcolor="${bg}" style="width:40px;padding:14px 0 14px 16px;border-radius:12px 0 0 12px;background-color:${bg}">${icon(ic, 24, "display:block;")}</td>` +
    `<td valign="top" bgcolor="${bg}" style="${FONT}padding:14px 16px 14px 12px;border-radius:0 12px 12px 0;background-color:${bg};font-size:${size}px;line-height:${size + 8}px;font-weight:${weight};color:${C.tinta}">${html}</td>` +
    `</tr></table></td></tr>`;

  // Botones a todo el ancho de su columna y de 52 px de alto. Letra clara sobre fondo oscuro: con letra oscura sobre
  // dorado claro, un modo oscuro forzado aclara la letra y deja el fondo igual, y no se lee.
  const button = (href: string, text: string, primary = false) =>
    `<a href="${e(href)}" target="_blank" rel="noopener noreferrer" style="${FONT}display:block;margin-top:12px;padding:14px 12px;border:1px solid ${primary ? C.oroTinta : C.ceniza};border-radius:10px;background-color:${primary ? C.oroTinta : C.ceniza};font-size:18px;line-height:22px;font-weight:700;text-align:center;text-decoration:none;color:${C.hueso}"><span style="color:${C.hueso}">${e(text)}</span></a>`;
  const responder = grid([
    cell("correo", t.labels.correo, valueHtml(e(d.correo)) + (mailto ? button(mailto, t.actions.correo, true) : "")),
    ...(v.telefono
      ? [
          cell(
            "telefono",
            t.labels.telefono,
            valueHtml(e(v.telefono)) + (phone?.whatsapp ? button(phone.whatsapp, t.actions.whatsapp) : "") + (phone ? button(phone.tel, t.actions.telefono) : ""),
          ),
        ]
      : []),
  ]);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${e(title)}</title>
<style>${STYLE}</style>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};-webkit-text-size-adjust:100%">
<table ${TABLE} width="100%" bgcolor="${C.fondo}" style="width:100%;background-color:${C.fondo}"><tr><td align="center" style="padding:0">
<table ${TABLE} width="600" style="width:100%;max-width:600px">
<tr><td bgcolor="${C.ceniza}" style="padding:20px 20px;background-color:${C.ceniza}">
<img src="${ASSET_BASE}/nexus-logo.png" width="${LOGO.width}" height="${LOGO.height}" alt="${e(t.brand)}" style="${FONT}display:block;border:0;outline:none;text-decoration:none;font-size:26px;line-height:${LOGO.height}px;font-weight:700;letter-spacing:.06em;color:${C.hueso}">
</td></tr>
<tr><td bgcolor="${C.oro}" height="2" style="height:2px;font-size:0;line-height:0;background-color:${C.oro}">&nbsp;</td></tr>
<tr><td bgcolor="${C.fondo}" style="padding:26px 16px 22px;background-color:${C.fondo}">
<table ${TABLE} width="100%" style="width:100%">
<tr><td style="${FONT}padding:0 4px">
<h1 style="${FONT}margin:0;font-size:25px;line-height:32px;font-weight:800;color:${C.tinta}">${e(title)}</h1>
<div style="margin-top:8px;font-size:15px;line-height:22px;font-weight:400;color:${C.etiqueta}">${e(t.received(fecha.long))}</div>
</td></tr>
${conPlazo ? band("urgencia", C.urgente, e(urgencia), 18, 700) : ""}
${band("aviso", C.aviso, `<span style="font-weight:600">${e(t.noticeTitle)}:</span> ${e(t.visitorNotice)}`, 15, 400)}
${card("persona", t.sections.quien, grid(fieldCells(quien)))}
${card("mensaje", t.sections.necesita, `<div style="padding:14px 0 0">${valueHtml(multiline(v.descripcion))}</div>`)}
${
  estado.length || detalles.length
    ? card(
        "llama",
        detallesTitle,
        (estado.length
          ? `<div style="padding:16px 0 0">${labelHtml("situacion", t.labels.estado)}${estado.map((i) => valueHtml(`&bull;&nbsp;${e(i)}`)).join("")}</div>`
          : "") + grid(fieldCells(detalles)),
      )
    : ""
}
${card(
  "responder",
  t.sections.responder,
  `${responder}<div style="padding:18px 0 0;font-size:15px;line-height:23px;font-weight:400;color:${C.etiqueta}">${e(t.replyHint)}</div>`,
)}
<tr><td style="${FONT}padding:18px 4px 0;font-size:13px;line-height:20px;font-weight:400;color:${C.pie}">${e(t.footer(idioma))}</td></tr>
</table>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  const subject = t.subject(t.short.servicio[d.servicio], t.short.cliente[d.cliente], fecha.short, urgente);
  return { subject, text, html };
}
