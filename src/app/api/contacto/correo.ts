// Arma el correo a Domingo a partir de una consulta ya validada. Siempre en español.
//
// Diseño: minimalista y de lectura fácil, en una sola columna. Franja oscura con el logo; título con el servicio,
// fecha y, si la hay, la urgencia; el aviso fijo; y cuatro bloques: quién escribe, qué necesita, detalles del caso
// (solo los que vienen con dato) y cómo responder, con botones grandes. Hecho para Gmail: tablas, estilos en línea,
// 600 px de ancho máximo y fuentes del sistema; no depende de `<style>` ni de fuentes web.
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

/** Logo para el correo: PNG servido por el sitio (Gmail no muestra SVG). Se genera con `scripts/correo-logo.mjs`. */
export const LOGO_URL = "https://nexuschile.net/correo/nexus-logo.png";
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

type Row = [string, string];

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
// Una sola columna, letra grande y casi negro sobre claro. La jerarquía se marca con el tamaño y el peso, siempre igual:
// título (25 px, 800) > título de sección (20 px, 700) > dato o párrafo (18 px, 400) > etiqueta (15 px, 600, un
// tono más suave) > aviso (15 px) > pie (13 px). La negrita queda para los textos fijos del correo: lo que escribió
// el visitante va siempre en peso normal.

const C = {
  ceniza: "#120f0d",
  oro: "#c9a26b",
  oroTinta: "#7c5c34", // oro oscuro del logo: fondo del botón principal
  hueso: "#f4eee6",
  fondo: "#ece5da",
  papel: "#fdfbf7",
  aviso: "#f5ecdd",
  urgente: "#f3dfbd",
  linea: "#ddd0bc",
  tinta: "#14100d", // datos, párrafos y títulos
  etiqueta: "#4d4238", // etiquetas: más suave que el dato, pero de alto contraste (9:1 sobre el papel)
  pie: "#5c5148",
};
const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
/** Un texto largo sin espacios (una URL, por ejemplo) no ensancha el correo en el celular. */
const WRAP = "word-break:break-word;overflow-wrap:anywhere;";
const TABLE = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';

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
  const filled = (rows: Row[]) => rows.filter(([, val]) => val);
  const quien = filled([
    [t.labels.nombre, v.nombre],
    [t.labels.cliente, cliente],
    [t.labels.clienteOtro, d.cliente === "otro" ? v.clienteOtro : ""],
    [t.labels.empresa, v.empresa],
    [t.labels.idioma, d.idioma === "es" ? "" : t.idiomaValue(idioma)],
  ]);
  // La urgencia con plazo ya está arriba, en su línea: aquí queda solo el detalle.
  const detalles = filled([
    [t.labels.lugar, noIncident ? "" : v.lugar],
    [t.labels.fecha, noIncident ? "" : v.fecha],
    [t.labels.urgencia, conPlazo ? "" : urgencia],
    [t.labels.plazoDetalle, v.plazoDetalle],
  ]);

  // ----- Texto plano -----
  const line = ([k, val]: Row) => `${k}: ${val}`;
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
    line([t.labels.correo, d.correo]),
    ...(v.telefono ? [line([t.labels.telefono, v.telefono])] : []),
    ...(phone?.whatsapp ? [line([t.labels.whatsapp, phone.whatsapp])] : []),
    t.replyHint,
    "",
    "--",
    t.footer(idioma),
  ].join("\n");

  // ----- HTML -----
  const e = escapeHtml;
  const multiline = (val: string) => e(val).replace(/\n/g, "<br>");

  const sectionTitle = (text: string) =>
    `<tr><td style="${FONT}padding:34px 0 0"><div style="border-top:1px solid ${C.linea};padding-top:22px;font-size:20px;line-height:26px;font-weight:700;color:${C.tinta}">${e(text)}</div></td></tr>`;
  const labelHtml = (k: string) => `<div style="font-size:15px;line-height:21px;font-weight:600;color:${C.etiqueta}">${e(k)}:</div>`;
  const valueHtml = (html: string) => `<div style="${WRAP}font-size:18px;line-height:28px;font-weight:400;color:${C.tinta}">${html}</div>`;
  const field = ([k, val]: Row) => `<tr><td style="${FONT}padding:14px 0 0">${labelHtml(k)}${valueHtml(e(val))}</td></tr>`;
  const fields = (rows: Row[]) => rows.map(field).join("");

  // Botones a todo el ancho y de 52 px de alto. Letra clara sobre fondo oscuro: con letra oscura sobre dorado claro,
  // un modo oscuro forzado aclara la letra y deja el fondo igual, y no se lee.
  const button = (href: string, text: string, primary = false) =>
    `<tr><td style="padding:12px 0 0"><a href="${e(href)}" target="_blank" rel="noopener noreferrer" style="${FONT}display:block;padding:14px 16px;border:1px solid ${primary ? C.oroTinta : C.ceniza};border-radius:10px;background-color:${primary ? C.oroTinta : C.ceniza};font-size:18px;line-height:22px;font-weight:700;text-align:center;text-decoration:none;color:${C.hueso}"><span style="color:${C.hueso}">${e(text)}</span></a></td></tr>`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${e(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};-webkit-text-size-adjust:100%">
<table ${TABLE} width="100%" bgcolor="${C.fondo}" style="width:100%;background-color:${C.fondo}"><tr><td align="center" style="padding:0">
<table ${TABLE} width="600" style="width:100%;max-width:600px">
<tr><td bgcolor="${C.ceniza}" style="padding:20px 24px;background-color:${C.ceniza}">
<img src="${LOGO_URL}" width="${LOGO.width}" height="${LOGO.height}" alt="${e(t.brand)}" style="${FONT}display:block;border:0;outline:none;text-decoration:none;font-size:26px;line-height:${LOGO.height}px;font-weight:700;letter-spacing:.06em;color:${C.hueso}">
</td></tr>
<tr><td bgcolor="${C.oro}" height="2" style="height:2px;font-size:0;line-height:0;background-color:${C.oro}">&nbsp;</td></tr>
<tr><td bgcolor="${C.papel}" style="padding:28px 24px 34px;background-color:${C.papel}">
<table ${TABLE} width="100%" style="width:100%">
<tr><td style="${FONT}">
<h1 style="${FONT}margin:0;font-size:25px;line-height:32px;font-weight:800;color:${C.tinta}">${e(title)}</h1>
<div style="margin-top:8px;font-size:15px;line-height:22px;font-weight:400;color:${C.etiqueta}">${e(t.received(fecha.long))}</div>
</td></tr>
${conPlazo ? `<tr><td style="padding:18px 0 0"><div style="${FONT}padding:12px 16px;border-radius:8px;background-color:${C.urgente};font-size:18px;line-height:26px;font-weight:700;color:${C.tinta}">${e(urgencia)}</div></td></tr>` : ""}
<tr><td style="padding:18px 0 0"><div style="${FONT}padding:12px 16px;border-radius:8px;background-color:${C.aviso};font-size:15px;line-height:23px;font-weight:400;color:${C.tinta}"><span style="font-weight:600">${e(t.noticeTitle)}:</span> ${e(t.visitorNotice)}</div></td></tr>
${sectionTitle(t.sections.quien)}
${fields(quien)}
${sectionTitle(t.sections.necesita)}
<tr><td style="${FONT}padding:14px 0 0">${valueHtml(multiline(v.descripcion))}</td></tr>
${
  estado.length || detalles.length
    ? sectionTitle(detallesTitle) +
      (estado.length ? `<tr><td style="${FONT}padding:14px 0 0">${labelHtml(t.labels.estado)}${estado.map((i) => valueHtml(`&bull;&nbsp;${e(i)}`)).join("")}</td></tr>` : "") +
      fields(detalles)
    : ""
}
${sectionTitle(t.sections.responder)}
${field([t.labels.correo, d.correo])}
${mailto ? button(mailto, t.actions.correo, true) : ""}
${v.telefono ? `<tr><td style="font-size:0;line-height:0;height:10px">&nbsp;</td></tr>${field([t.labels.telefono, v.telefono])}` : ""}
${phone?.whatsapp ? button(phone.whatsapp, t.actions.whatsapp) : ""}
${phone ? button(phone.tel, t.actions.telefono) : ""}
<tr><td style="${FONT}padding:18px 0 0;font-size:15px;line-height:23px;font-weight:400;color:${C.etiqueta}">${e(t.replyHint)}</td></tr>
</table>
</td></tr>
<tr><td bgcolor="${C.fondo}" style="${FONT}padding:16px 24px 26px;background-color:${C.fondo};font-size:13px;line-height:20px;font-weight:400;color:${C.pie}">${e(t.footer(idioma))}</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  const subject = t.subject(t.short.servicio[d.servicio], t.short.cliente[d.cliente], fecha.short, urgente);
  return { subject, text, html };
}
