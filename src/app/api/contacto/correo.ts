// Arma el correo a Domingo a partir de una consulta ya validada. Siempre en español.
//
// Diseño: encabezado oscuro con el logo, un resumen (servicio, tipo de cliente, urgencia, fecha) y el aviso fijo;
// después la descripción destacada, las respuestas en bloques y los botones para responder. Hecho para Gmail: tablas,
// estilos en línea, 600 px de ancho máximo y fuentes del sistema; no depende de `<style>` ni de fuentes web.
//
// Defensas (si el diseño choca con una, gana la defensa):
// - Todo valor del visitante se escapa antes de entrar al HTML; el asunto solo lleva textos de las listas blancas.
// - Aviso fijo arriba, en el encabezado, y enlaces desactivados (`https://x.com` → `hxxps://x[.]com`).
// - El encabezado solo lleva datos de listas cerradas; del visitante, apenas su nombre, recortado y rotulado.
//   Así no puede escribir ahí algo que parezca un aviso de NEXUS.
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

/** Largo máximo del nombre del visitante en el encabezado. Completo va en Datos de contacto. */
const NAME_MAX = 40;
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

  const urgencia = d.urgencia ? label(s.caso.urgencia.options, d.urgencia) : "";
  const urgente = d.urgencia === "urgente";
  const conPlazo = urgente || d.urgencia === "semanas";
  const estado = d.estado.map((id) => label(variant, id));
  const fecha = chileDate(sentAt);
  const idioma = t.languages[d.idioma];
  const footer = t.footer(idioma);
  const casoTitle = noIncident ? t.sections.capacitacion : t.sections.caso;

  // El encabezado es la parte que se lee como "del sistema": lleva solo datos de listas cerradas (servicio, tipo
  // de cliente, urgencia) y la fecha. Lo único del visitante es su nombre, recortado, en peso normal y rotulado.
  // Empresa, "¿Quién?" y el detalle del plazo van abajo, en sus bloques: ahí no pueden pasar por un aviso de NEXUS.
  const chars = Array.from(v.nombre);
  const recortado = chars.length > NAME_MAX;
  const nombreCorto = recortado ? `${chars.slice(0, NAME_MAX).join("").trimEnd()}…` : v.nombre;

  const mailto = mailtoHref(d.correo, t.actions.replySubject);
  const phone = d.telefono ? phoneHrefs(d.telefono) : null;

  // Sin datos repetidos: la urgencia con plazo ya está en el resumen, así que aquí queda solo su detalle.
  const caso: Row[] = [
    ...(noIncident
      ? []
      : ([
          [t.labels.lugar, v.lugar],
          [t.labels.fecha, v.fecha],
        ] as Row[])),
    ...(conPlazo ? [] : ([[t.labels.urgencia, urgencia]] as Row[])),
    ...(v.plazoDetalle ? ([[t.labels.plazoDetalle, v.plazoDetalle]] as Row[]) : []),
  ];
  const detalle: Row[] = [
    ...(d.cliente === "otro" && v.clienteOtro ? ([[t.labels.clienteOtro, v.clienteOtro]] as Row[]) : []),
    ...(d.cliente === "particular" ? [] : ([[t.labels.empresa, v.empresa]] as Row[])),
    [t.labels.correo, d.correo],
    [t.labels.telefono, v.telefono],
  ];
  // En el HTML el nombre ya está arriba: en Datos de contacto se repite solo si arriba quedó recortado.
  const contactoHtml: Row[] = [...(recortado ? ([[t.labels.nombre, v.nombre]] as Row[]) : []), ...detalle];
  const contactoText: Row[] = [[t.labels.nombre, v.nombre], ...detalle];

  // ----- Texto plano -----
  const line = ([k, val]: Row) => `${k}: ${val || t.empty}`;
  const text = [
    `${t.brand} · ${t.heading}`,
    "",
    `[ ${t.visitorNotice} ]`,
    "",
    t.summary.title.toUpperCase(),
    line([t.summary.servicio, servicio]),
    line([t.labels.cliente, cliente]),
    ...(conPlazo ? [line([t.summary.urgencia, urgencia])] : []),
    ...(d.idioma === "es" ? [] : [line([t.summary.idioma, t.summary.idiomaValue(idioma)])]),
    line([t.summary.recibida, t.summary.recibidaValue(fecha.long)]),
    "",
    t.sections.descripcion.toUpperCase(),
    indent(v.descripcion),
    "",
    t.sections.estado.toUpperCase(),
    ...(estado.length ? estado.map((i) => `- ${i}`) : [t.skipped]),
    "",
    ...(caso.length ? [casoTitle.toUpperCase(), ...caso.map(line), ""] : []),
    t.sections.contacto.toUpperCase(),
    ...contactoText.map(line),
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
  const summary = [
    summaryRow(t.summary.servicio, `<strong>${e(servicio)}</strong>`, true),
    summaryRow(t.summary.solicita, `<strong>${e(cliente)}</strong>`),
    summaryRow(
      t.labels.nombre,
      `${e(nombreCorto)}<br><span style="font-size:12px;color:${C.gris}">${e(t.visitorData)}</span>`,
    ),
    ...(conPlazo ? [summaryRow(t.summary.urgencia, `<strong style="color:${C.oroClaro}">${e(urgencia)}</strong>`)] : []),
    ...(d.idioma === "es" ? [] : [summaryRow(t.summary.idioma, e(t.summary.idiomaValue(idioma)))]),
    summaryRow(t.summary.recibida, e(t.summary.recibidaValue(fecha.long))),
  ].join("");
  // Aviso fijo, arriba y dentro del encabezado: se lee antes que cualquier texto del visitante.
  const notice =
    `<table ${TABLE} width="100%" style="width:100%;margin-top:16px"><tr><td bgcolor="${C.humo}" style="${FONT}padding:12px 14px;border:1px solid ${C.oro};border-radius:8px;background-color:${C.humo}">` +
    `<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.oroClaro}">${e(t.noticeTitle)}</div>` +
    `<div style="margin-top:3px;font-size:14px;line-height:21px;color:${C.hueso}">${e(t.visitorNotice)}</div></td></tr></table>`;

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

  // Los dos botones llevan letra clara sobre fondo oscuro. Con letra oscura sobre el dorado claro, un modo oscuro
  // forzado aclara la letra y deja el fondo igual: queda ilegible, aunque el color se fije de forma explícita.
  // El principal usa el oro oscuro del logo; así se lee igual con o sin inversión.
  const button = (href: string, text: string, primary = false) => {
    const bg = primary ? C.oroTinta : C.ceniza;
    return `<a href="${e(href)}" target="_blank" rel="noopener noreferrer" style="${FONT}display:inline-block;margin:0 8px 10px 0;padding:13px 22px;border:1px solid ${primary ? C.oroTinta : C.oro};border-radius:999px;background-color:${bg};font-size:15px;line-height:20px;font-weight:700;text-decoration:none;color:${C.hueso}"><span style="color:${C.hueso}">${e(text)}</span></a>`;
  };
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
${notice}
</td></tr>
<tr><td bgcolor="${C.oro}" height="2" style="height:2px;font-size:0;line-height:0;background-color:${C.oro}">&nbsp;</td></tr>
<tr><td bgcolor="${C.papel}" style="padding:2px 24px 30px;background-color:${C.papel}">
<table ${TABLE} width="100%" style="width:100%">
${sectionTitle(t.sections.descripcion, t.writtenByVisitor)}
<tr><td style="padding:14px 0 0"><div style="${FONT}${WRAP}padding:16px 18px;border:1px solid ${C.linea};border-radius:10px;background-color:${C.caja};font-size:16px;line-height:26px;color:${C.tinta}">${multiline(v.descripcion)}</div></td></tr>
${estadoHtml ? `${sectionTitle(t.sections.estado)}<tr><td><table ${TABLE} width="100%" style="width:100%">${estadoHtml}</table></td></tr>` : ""}
${caso.length ? `${sectionTitle(casoTitle)}${fields(caso)}` : ""}
${sectionTitle(t.sections.contacto)}
${fields(contactoHtml)}
${sectionTitle(t.sections.responder)}
<tr><td style="padding:16px 0 0">${buttons}</td></tr>
<tr><td style="${FONT}padding:4px 0 0;font-size:13px;line-height:20px;color:${C.tenue}">${e(t.replyHint)}</td></tr>
</table>
</td></tr>
<tr><td bgcolor="${C.fondo}" style="${FONT}padding:18px 24px 28px;background-color:${C.fondo};font-size:12px;line-height:18px;color:${C.tenue}">
<p style="margin:0">${e(footer)}</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  const subject = t.subject(t.short.servicio[d.servicio], t.short.cliente[d.cliente], fecha.short, urgente);
  return { subject, text, html };
}
