// Arma el correo a Domingo a partir de una consulta ya validada. Siempre en español.
// Todo valor del visitante se escapa antes de entrar al HTML; el asunto solo lleva textos de las listas blancas.
// Contra el phishing dentro del correo: aviso fijo sobre lo escrito por el visitante, enlaces desactivados
// (`https://x.com` → `hxxps://x[.]com`) y, en texto plano, cada línea de un valor largo con sangría para que no
// pueda imitar una sección del correo.

import { emailTexts, getFormTexts, servicesWithoutIncident, statusVariantByService } from "@/data/formulario";
import type { ContactPayload } from "@/lib/contacto";

const es = getFormTexts("es");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Desactiva enlaces y dominios para que el cliente de correo no los convierta en enlaces. */
export const defang = (s: string) =>
  s
    .replace(/\b(h)(t)tp(s?):\/\//gi, (_m, h: string, t: string, sec: string) => `${h}${t === "T" ? "XX" : "xx"}p${sec}://`)
    // Un punto entre dos partes de nombre de dominio (la segunda con al menos dos caracteres y una letra):
    // `x.com` → `x[.]com`; quedan igual `S.A.`, `3.5` y el punto final de una frase.
    .replace(/([\p{L}\p{N}_-])[.。．｡](?=[\p{L}\p{N}-]{2})(?=[\p{L}\p{N}-]*\p{L})/gu, "$1[.]");

const INDENT = "    ";
const indent = (v: string) => v.split("\n").map((l) => INDENT + l).join("\n");

const label = <T extends { id: string; label: string }>(list: T[], id: string) => list.find((o) => o.id === id)?.label ?? id;

type Row = [string, string];
type Block = { title: string; rows?: Row[]; items?: string[]; text?: string };

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

  const blocks: Block[] = [
    { title: t.sections.cliente, text: clienteFull },
    { title: t.sections.servicio, text: servicio },
    d.estado.length
      ? { title: t.sections.estado, items: d.estado.map((id) => label(variant, id)) }
      : { title: t.sections.estado, text: t.skipped },
    {
      title: t.sections.caso,
      rows: [
        ...(noIncident
          ? []
          : ([
              [t.labels.lugar, v.lugar],
              [t.labels.fecha, v.fecha],
            ] as Row[])),
        [t.labels.descripcion, v.descripcion],
        [t.labels.urgencia, urgencia],
        ...(v.plazoDetalle ? ([[t.labels.plazoDetalle, v.plazoDetalle]] as Row[]) : []),
      ],
    },
    {
      title: t.sections.contacto,
      rows: [
        [t.labels.nombre, v.nombre],
        ...(d.cliente === "particular" ? [] : ([[t.labels.empresa, v.empresa]] as Row[])),
        [t.labels.correo, d.correo],
        [t.labels.telefono, v.telefono],
      ],
    },
  ];

  const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeStyle: "short", timeZone: "America/Santiago" }).format(sentAt);
  const footer = t.footer(fecha, d.idioma);

  // ----- Texto plano -----
  const text = [
    t.heading,
    "",
    `[ ${t.visitorNotice} ]`,
    "",
    ...blocks.flatMap((b) => [
      b.title.toUpperCase(),
      ...(b.text !== undefined ? [b.text] : []),
      ...(b.items ?? []).map((i) => `- ${i}`),
      ...(b.rows ?? []).map(([k, val]) => (val.includes("\n") ? `${k}:\n${indent(val)}` : `${k}: ${val || t.empty}`)),
      "",
    ]),
    t.replyHint,
    footer,
  ].join("\n");

  // ----- HTML -----
  const cell = "padding:6px 0;vertical-align:top;font-size:15px;line-height:1.5;color:#2a231e;";
  const value = (v: string) =>
    v ? escapeHtml(v).replace(/\n/g, "<br>") : `<span style="color:#8a8079">${escapeHtml(t.empty)}</span>`;
  const blockHtml = (b: Block) => {
    const head = `<h2 style="margin:28px 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#9c7a4a;border-bottom:1px solid #e6dccd;padding-bottom:6px">${escapeHtml(b.title)}</h2>`;
    if (b.text !== undefined) return `${head}<p style="margin:0;${cell}font-weight:600">${escapeHtml(b.text)}</p>`;
    if (b.items) return `${head}<ul style="margin:0;padding-left:20px">${b.items.map((i) => `<li style="${cell}">${escapeHtml(i)}</li>`).join("")}</ul>`;
    const rows = (b.rows ?? [])
      .map(([k, v]) => `<tr><td style="${cell}width:38%;padding-right:16px;color:#6f655c">${escapeHtml(k)}</td><td style="${cell}">${value(v)}</td></tr>`)
      .join("");
    return `${head}<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${rows}</table>`;
  };

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4eee6;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:32px 28px;background:#ffffff">
<p style="margin:0;font-size:22px;font-weight:800;letter-spacing:.06em;color:#120f0d">NE<span style="color:#c9a26b">X</span>US</p>
<h1 style="margin:8px 0 0;font-size:18px;color:#2a231e">${escapeHtml(t.heading)}</h1>
<p style="margin:20px 0 0;padding:10px 14px;border-left:3px solid #c9a26b;background:#faf6f0;font-size:13px;line-height:1.5;color:#6f655c">${escapeHtml(t.visitorNotice)}</p>
${blocks.map(blockHtml).join("\n")}
<p style="margin:32px 0 0;font-size:13px;color:#6f655c">${escapeHtml(t.replyHint)}</p>
<p style="margin:6px 0 0;font-size:12px;color:#8a8079">${escapeHtml(footer)}</p>
</div></body></html>`;

  return { subject: t.subject(cliente, servicio), text, html };
}
