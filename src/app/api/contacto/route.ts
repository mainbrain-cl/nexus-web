// POST /api/contacto: recibe la consulta del formulario y la envía al correo de Domingo con la API HTTP de Resend.
// No guarda nada: la consulta solo existe en el correo enviado. Las respuestas de error no dan detalles internos.

import { isEmail, validatePayload } from "@/lib/contacto";
import { buildEmail } from "./correo";

const MAX_BODY = 32 * 1024; // bytes
const MIN_FILL_MS = 4000; // nadie responde cinco pasos en menos de 4 s
const MAX_FILL_MS = 1000 * 60 * 60 * 24;
const RATE = { max: 5, windowMs: 15 * 60 * 1000 }; // por IP
const GLOBAL = { max: 60, windowMs: 60 * 60 * 1000 }; // por instancia, para no agotar la cuota de Resend

const DEFAULT_TO = "domingosoto@nexuschile.net";
const DEFAULT_FROM = "NEXUS Web <onboarding@resend.dev>";

type ErrorCode = "invalido" | "limite" | "no-disponible" | "error";

const json = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });
const fail = (error: ErrorCode, status: number) => json({ ok: false, error }, status);

// ---------- Límite de envíos ----------
// En memoria: vale por instancia del servidor. Basta para frenar ráfagas; no es un límite global estricto.

const hits = new Map<string, number[]>();
let globalHits: number[] = [];

function allow(ip: string, now: number) {
  globalHits = globalHits.filter((t) => now - t < GLOBAL.windowMs);
  const mine = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  if (mine.length >= RATE.max || globalHits.length >= GLOBAL.max) {
    hits.set(ip, mine);
    return false;
  }
  mine.push(now);
  globalHits.push(now);
  hits.set(ip, mine);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < RATE.windowMs)) hits.delete(k);
  }
  return true;
}

/** En Vercel, x-forwarded-for lo reescribe la plataforma con la IP real del visitante. */
function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  return (fwd || real || "desconocida").slice(0, 64);
}

/** Lee el cuerpo cortando apenas supera el máximo, aunque no venga Content-Length. */
async function readBody(req: Request): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(all);
  } catch {
    return null;
  }
}

/** Solo se aceptan envíos desde el propio sitio cuando el navegador declara su origen. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const NO_CONTROL = /^[^\u0000-\u001F\u007F]+$/;

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return fail("invalido", 403);
    if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return fail("invalido", 415);

    const raw = await readBody(req);
    if (raw === null) return fail("invalido", 413);

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail("invalido", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("invalido", 400);
    const { datos, web, tiempo } = body as Record<string, unknown>;

    // Trampas para robots: el campo invisible lleno o un llenado imposible de rápido.
    // Se responde como si todo hubiera salido bien, sin enviar nada, para no darles pistas.
    if (typeof web !== "string" || typeof tiempo !== "number" || !Number.isFinite(tiempo)) return fail("invalido", 400);
    if (web !== "" || tiempo < MIN_FILL_MS || tiempo > MAX_FILL_MS) return json({ ok: true });

    const result = validatePayload(datos);
    if (!result.ok) return fail("invalido", 422);

    if (!allow(clientIp(req), Date.now())) return fail("limite", 429);

    const email = buildEmail(result.data, new Date());
    const key = process.env.RESEND_API_KEY;
    const to = process.env.FORM_TO || DEFAULT_TO;
    const from = process.env.FORM_FROM || DEFAULT_FROM;

    if (!key) {
      if (process.env.NODE_ENV !== "production") {
        console.info(`\n[contacto] Sin RESEND_API_KEY: el correo no se envía. Así se vería:\nPara: ${to}\nDe: ${from}\nResponder a: ${result.data.correo}\nAsunto: ${email.subject}\n\n${email.text}\n`);
        return json({ ok: true });
      }
      console.error("[contacto] Falta RESEND_API_KEY");
      return fail("no-disponible", 503);
    }
    if (!isEmail(to) || !NO_CONTROL.test(from)) {
      console.error("[contacto] FORM_TO o FORM_FROM no son válidos");
      return fail("no-disponible", 503);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: result.data.correo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) {
      // Solo el código: el cuerpo de Resend puede repetir datos del correo.
      console.error(`[contacto] Resend respondió ${res.status}`);
      return fail("error", 502);
    }
    return json({ ok: true });
  } catch {
    console.error("[contacto] Error inesperado al procesar la consulta");
    return fail("error", 500);
  }
}
