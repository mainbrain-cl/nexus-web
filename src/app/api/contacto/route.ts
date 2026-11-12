// /api/contacto
// - GET: entrega el token de tiempo firmado que el formulario pide en la primera interacción.
// - POST: recibe la consulta y la envía al correo de Domingo con la API HTTP de Resend.
// No guarda nada: la consulta solo existe en el correo enviado. Las respuestas de error no dan detalles internos.
// Nunca se responde `ok: true` sin enviar, salvo a la trampa invisible para robots (honeypot).

import { isEmail, validatePayload } from "@/lib/contacto";
import { buildEmail } from "./correo";
import {
  allow,
  checkToken,
  claimToken,
  clientIp,
  issueToken,
  originAllowed,
  rateKey,
  releaseToken,
  turnstileEnabled,
  verifyTurnstile,
} from "./seguridad";

export const dynamic = "force-dynamic";

const MAX_BODY = 32 * 1024; // bytes

const DEFAULT_TO = "domingosoto@nexuschile.net";
const DEFAULT_FROM = "NEXUS Web <onboarding@resend.dev>";

type ErrorCode = "invalido" | "vencido" | "verificacion" | "limite" | "no-disponible" | "error";

const json = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });
const fail = (error: ErrorCode, status: number) => json({ ok: false, error }, status);

/** Solo `application/json`, con `charset=utf-8` opcional. */
const JSON_TYPE = /^application\/json[ \t]*(;[ \t]*charset[ \t]*=[ \t]*("utf-8"|utf-8)[ \t]*)?$/i;

/** Lee el cuerpo cortando apenas supera el máximo, aunque no venga Content-Length. */
async function readBody(req: Request): Promise<{ text: string } | { error: "grande" | "utf8" }> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY) return { error: "grande" };
  if (!req.body) return { text: "" };
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return { error: "grande" };
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
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(all) };
  } catch {
    return { error: "utf8" };
  }
}

const NO_CONTROL = /^[^\u0000-\u001F\u007F]+$/;

export async function GET(req: Request) {
  if (!originAllowed(req)) return fail("invalido", 403);
  return json({ token: issueToken() });
}

export async function POST(req: Request) {
  let nonce: string | null = null;
  try {
    if (!originAllowed(req)) return fail("invalido", 403);
    if (!JSON_TYPE.test(req.headers.get("content-type") ?? "")) return fail("invalido", 415);

    const raw = await readBody(req);
    if ("error" in raw) return fail("invalido", raw.error === "grande" ? 413 : 400);

    let body: unknown;
    try {
      body = JSON.parse(raw.text);
    } catch {
      return fail("invalido", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("invalido", 400);
    const { datos, web, token, turnstile } = body as Record<string, unknown>;

    // Trampa para robots: el campo invisible lleno. Se responde como si todo hubiera salido bien, sin enviar nada.
    if (typeof web !== "string") return fail("invalido", 400);
    if (web !== "") return json({ ok: true });

    // Token de tiempo firmado por el servidor: un error real, nunca un éxito falso.
    const tk = checkToken(token);
    if (!tk.ok) return tk.reason === "vencido" ? fail("vencido", 400) : fail("invalido", tk.reason === "usado" ? 409 : 400);

    const result = validatePayload(datos);
    if (!result.ok) return fail("invalido", 422);

    const ip = clientIp(req);
    if (!allow(rateKey(ip))) return fail("limite", 429);

    // Turnstile, si está configurado, antes de cualquier envío.
    if (turnstileEnabled()) {
      const ts = await verifyTurnstile(turnstile, ip);
      if (ts === "rechazado") return fail("verificacion", 403);
      if (ts === "caido") return fail("error", 502);
    }

    // El token se consume ahora; si el envío falla se libera para que el visitante pueda reintentar.
    if (!claimToken(tk.nonce)) return fail("invalido", 409);
    nonce = tk.nonce;

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
      releaseToken(nonce);
      return fail("no-disponible", 503);
    }
    if (!isEmail(to) || !NO_CONTROL.test(from)) {
      console.error("[contacto] FORM_TO o FORM_FROM no son válidos");
      releaseToken(nonce);
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
      releaseToken(nonce);
      return fail("error", 502);
    }
    return json({ ok: true });
  } catch {
    console.error("[contacto] Error inesperado al procesar la consulta");
    releaseToken(nonce);
    return fail("error", 500);
  }
}
