// Arma el correo a Domingo a partir de una consulta ya validada. Siempre en español.
//
// Diseño: encabezado oscuro con el logo y un resumen (quién, qué servicio, cuándo), la descripción destacada,
// las respuestas en bloques, los botones para responder y el aviso fijo al pie. Hecho para Gmail: tablas,
// estilos en línea, 600 px de ancho máximo y fuentes del sistema; no depende de `<style>` ni de fuentes web.
//
// Defensas (si el diseño choca con una, gana la defensa):
// - Todo valor del visitante se escapa antes de entrar al HTML; el asunto solo lleva textos de las listas blancas.
// - Aviso fijo sobre lo escrito por el visitante y enlaces desactivados (`https://x.com` → `hxxps://x[.]com`).
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
    // Sin exigir inicio de palabra: `textohttps://x.com` también queda desactivado.
    .replace(/(h)(t)tp(s?):\/\//gi, (_m, h: string, t: string, sec: string) => `${h}${t === "T" ? "XX" : "xx"}p${sec}://`)
    // Un punto entre dos partes de nombre de dominio (la segunda con al menos dos caracteres y una letra):
    // `x.com` → `x[.]com`; quedan igual `S.A.`, `3.5` y el punto final de una frase.
    .replace(/([\p{L}\p{N}_-])[.。．｡](?=[\p{L}\p{N}-]{2})(?=[\p{L}\p{N}-]*\p{L})/gu, "$1[.]");

// ---------- Enlaces para responder ----------

/**
 * `mailto:` al visitante. El correo ya pasó `isEmail` en el servidor; aquí se revisa otra vez y se codifica la
 * parte local, que admite `&`, `?`, `#`, `%` o `'`. El asunto es un texto fijo.
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
  const time = `${p.hour}:${p.minute}`;
  return { long: `${day}, ${time}`, short: `${p.day}-${p.month} ${time}` };
}

// ---------- Estilos en línea ----------

const C = {
  ceniza: "#120f0d",
  humo: "#1d1815",
  hilo: "#3a3029", // separador sobre fondo oscuro
  oro: "#c9a26b",
  oroClaro: "#e0c08f",
  oroTinta: "#7c5c34", // oro oscuro legible sobre papel
  hueso: "#f4eee6",
  gris: "#b3aaa0",
  fondo: "#ece5da",
  papel: "#fdfbf7",
  caja: "#f6f0e6",
  linea: "#e4d9c8",
  tinta: "#241e1a",
  tenue: "#6b6158",
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

  const clienteFull = d.cliente === "otro" && v.clienteOtro ? `${cliente}: ${v.clienteOtro}` : cliente;
  const urgencia = d.urgencia ? label(s.caso.urgencia.options, d.urgencia) : "";
  const urgente = d.urgencia === "urgente";
  const conPlazo = urgente || d.urgencia === "semanas";
  const plazo = conPlazo ? (v.plazoDetalle ? `${urgencia}: ${v.plazoDetalle}` : urgencia) : "";
  const estado = d.estado.map((id) => label(variant, id));
  const fecha = chileDate(sentAt);
  const idioma = t.languages[d.idioma];
  const footer = t.footer(fecha.long, idioma);

  const mailto = mailtoHref(d.correo, t.actions.replySubject);
  const phone = d.telefono ? phoneHrefs(d.telefono) : null;

  const caso: Row[] = [
    ...(noIncident
      ? []
      : ([
          [t.labels.lugar, v.lugar],
          [t.labels.fecha, v.fecha],
        ] as Row[])),
    [t.labels.urgencia, urgencia],
    ...(v.plazoDetalle ? ([[t.labels.plazoDetalle, v.plazoDetalle]] as Row[]) : []),
  ];
  const contacto: Row[] = [
    [t.labels.nombre, v.nombre],
    ...(d.cliente === "particular" ? [] : ([[t.labels.empresa, v.empresa]] as Row[])),
    [t.labels.correo, d.correo],
    [t.labels.telefono, v.telefono],
  ];

  // ----- Texto plano -----
  const line = ([k, val]: Row) => `${k}: ${val || t.empty}`;
  const text = [
    `${t.brand} · ${t.heading}`,
    `${t.summary.recibida}: ${t.summary.recibidaValue(fecha.long)}`,
    "",
    `[ ${t.visitorNotice} ]`,
    "",
    t.summary.title.toUpperCase(),
    line([t.labels.nombre, v.empresa ? `${v.nombre} (${v.empresa})` : v.nombre]),
    line([t.labels.cliente, clienteFull]),
    line([t.summary.servicio, servicio]),
    ...(plazo ? [line([t.summary.plazo, plazo])] : []),
    ...(d.idioma === "es" ? [] : [line([t.summary.idioma, t.summary.idiomaValue(idioma)])]),
    "",
    t.sections.descripcion.toUpperCase(),
    indent(v.descripcion),
    "",
    t.sections.estado.toUpperCase(),
    ...(estado.length ? estado.map((i) => `- ${i}`) : [t.skipped]),
    "",
    t.sections.caso.toUpperCase(),
    ...caso.map(line),
    "",
    t.sections.contacto.toUpperCase(),
    ...contacto.map(line),
    "",
    t.sections.responder.toUpperCase(),
    t.replyHint,
    ...(phone?.whatsapp ? [`${t.labels.whatsapp}: ${phone.whatsapp}`] : []),
    ...(phone ? [`${t.actions.telefono}: ${phone.tel.slice(4)}`] : []),
    "",
    "--",
    footer,
  ].join("\n");

  // ----- HTML -----
  const e = escapeHtml;
  const multiline = (val: string) => e(val).replace(/\n/g, "<br>");

  // Resumen, sobre el fondo oscuro del encabezado.
  const summaryRow = (k: string, html: string, first = false) =>
    `<tr><td width="92" valign="top" style="${FONT}width:92px;padding:11px 12px 11px 0;${first ? "" : `border-top:1px solid ${C.hilo};`}font-size:11px;line-height:20px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.gris}">${e(k)}</td>` +
    `<td valign="top" style="${FONT}${WRAP}padding:11px 0;${first ? "" : `border-top:1px solid ${C.hilo};`}font-size:15px;line-height:20px;color:${C.hueso}">${html}</td></tr>`;
  const quien =
    `<strong style="font-size:17px;color:${C.hueso}">${e(v.nombre)}</strong>` +
    (v.empresa ? `<br>${e(v.empresa)}` : "") +
    `<br><span style="color:${C.gris}">${e(clienteFull)}</span>`;
  const summary = [
    summaryRow(t.summary.solicita, quien, true),
    summaryRow(t.summary.servicio, `<strong>${e(servicio)}</strong>`),
    ...(plazo ? [summaryRow(t.summary.plazo, `<strong style="color:${C.oroClaro}">${e(plazo)}</strong>`)] : []),
    ...(d.idioma === "es" ? [] : [summaryRow(t.summary.idioma, e(t.summary.idiomaValue(idioma)))]),
    summaryRow(t.summary.recibida, e(t.summary.recibidaValue(fecha.long))),
  ].join("");

  // Bloques sobre papel: título con hilo dorado, etiqueta en mayúscula pequeña y valor debajo.
  const sectionTitle = (title: string, note = "") =>
    `<tr><td style="${FONT}padding:26px 0 9px;border-bottom:1px solid ${C.oro};font-size:16px;line-height:22px;font-weight:700;color:${C.ceniza}">${e(title)}` +
    (note ? ` <span style="font-size:12px;font-weight:400;color:${C.tenue}">· ${e(note)}</span>` : "") +
    `</td></tr>`;
  const field = ([k, val]: Row) =>
    `<tr><td style="${FONT}${WRAP}padding:12px 0 0">` +
    `<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.tenue}">${e(k)}</div>` +
    `<div style="font-size:16px;line-height:24px;color:${C.tinta}">${e(val)}</div></td></tr>`;
  /** Los campos opcionales en blanco no ocupan una fila cada uno: se nombran juntos en una línea tenue. */
  const fields = (rows: Row[]) => {
    const missing = rows.filter(([, val]) => !val).map(([k]) => k.toLowerCase());
    return (
      rows.filter(([, val]) => val).map(field).join("") +
      (missing.length
        ? `<tr><td style="${FONT}padding:12px 0 0;font-size:13px;line-height:20px;color:${C.tenue}">${e(t.notGiven(missing.join(", ")))}</td></tr>`
        : "")
    );
  };
  const estadoHtml = estado.length
    ? estado
        .map(
          (i) =>
            `<tr><td width="18" valign="top" style="${FONT}width:18px;padding:10px 0 0;font-size:16px;line-height:24px;color:${C.oro}">&bull;</td>` +
            `<td valign="top" style="${FONT}padding:10px 0 0;font-size:16px;line-height:24px;color:${C.tinta}">${e(i)}</td></tr>`,
        )
        .join("")
    : "";

  const button = (href: string, text: string, primary = false) =>
    `<a href="${e(href)}" target="_blank" rel="noopener noreferrer" style="${FONT}display:inline-block;margin:0 8px 10px 0;padding:13px 22px;border:1px solid ${C.oro};border-radius:999px;background-color:${primary ? C.oro : C.ceniza};font-size:15px;line-height:20px;font-weight:700;text-decoration:none;color:${primary ? C.ceniza : C.hueso}">${e(text)}</a>`;
  const buttons = [
    ...(mailto ? [button(mailto, t.actions.correo, true)] : []),
    ...(phone?.whatsapp ? [button(phone.whatsapp, t.actions.whatsapp)] : []),
    ...(phone ? [button(phone.tel, t.actions.telefono)] : []),
  ].join("");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${e(t.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};-webkit-text-size-adjust:100%">
<table ${TABLE} width="100%" bgcolor="${C.fondo}" style="width:100%;background-color:${C.fondo}"><tr><td align="center" style="padding:0">
<table ${TABLE} width="600" style="width:100%;max-width:600px">
<tr><td bgcolor="${C.ceniza}" style="padding:26px 24px 22px;background-color:${C.ceniza}">
<img src="${LOGO_URL}" width="${LOGO.width}" height="${LOGO.height}" alt="${e(t.brand)}" style="${FONT}display:block;border:0;outline:none;text-decoration:none;font-size:26px;line-height:${LOGO.height}px;font-weight:700;letter-spacing:.06em;color:${C.hueso}">
<p style="${FONT}margin:22px 0 0;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.oroClaro}">${e(t.eyebrow)}</p>
<h1 style="${FONT}margin:4px 0 0;font-size:23px;line-height:29px;font-weight:700;color:${C.hueso}">${e(t.heading)}</h1>
<table ${TABLE} width="100%" style="width:100%;margin-top:14px">${summary}</table>
</td></tr>
<tr><td bgcolor="${C.oro}" height="2" style="height:2px;font-size:0;line-height:0;background-color:${C.oro}">&nbsp;</td></tr>
<tr><td bgcolor="${C.papel}" style="padding:2px 24px 30px;background-color:${C.papel}">
<table ${TABLE} width="100%" style="width:100%">
${sectionTitle(t.sections.descripcion, t.writtenByVisitor)}
<tr><td style="padding:14px 0 0"><div style="${FONT}${WRAP}padding:16px 18px;border:1px solid ${C.linea};border-radius:10px;background-color:${C.caja};font-size:16px;line-height:26px;color:${C.tinta}">${multiline(v.descripcion)}</div></td></tr>
${estadoHtml ? `${sectionTitle(t.sections.estado)}<tr><td><table ${TABLE} width="100%" style="width:100%">${estadoHtml}</table></td></tr>` : ""}
${sectionTitle(t.sections.caso)}
${fields(caso)}
${sectionTitle(t.sections.contacto)}
${fields(contacto)}
${sectionTitle(t.sections.responder)}
<tr><td style="padding:16px 0 0">${buttons}</td></tr>
<tr><td style="${FONT}padding:4px 0 0;font-size:13px;line-height:20px;color:${C.tenue}">${e(t.replyHint)}</td></tr>
</table>
</td></tr>
<tr><td bgcolor="${C.fondo}" style="${FONT}padding:18px 24px 28px;background-color:${C.fondo};font-size:12px;line-height:18px;color:${C.tenue}">
<p style="margin:0">${e(t.visitorNotice)}</p>
<p style="margin:6px 0 0">${e(footer)}</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  const subject = t.subject(t.short.servicio[d.servicio], t.short.cliente[d.cliente], fecha.short, urgente);
  return { subject, text, html };
}
