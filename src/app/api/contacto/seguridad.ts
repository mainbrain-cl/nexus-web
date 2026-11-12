// Defensas del envío del formulario: token de tiempo firmado, límite por IP, origen permitido y Turnstile.
// Solo corre en el servidor (usa node:crypto).

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// ---------- Token de tiempo firmado ----------
// El servidor emite `<ms>.<nonce>.<firma>` (HMAC-SHA256). Al recibir la consulta comprueba la firma, que hayan
// pasado al menos 4 s desde que se emitió y que no se haya usado ya en un envío exitoso (en esta instancia).

export const TOKEN_MIN_MS = 4000; // nadie responde cinco pasos en menos de 4 s
export const TOKEN_MAX_MS = 6 * 60 * 60 * 1000; // el formulario pide uno nuevo si el suyo tiene más de 5 h

let secretCache: Buffer | null | undefined;

/**
 * Clave del token: `FORM_SECRET`; si falta, se deriva de `RESEND_API_KEY` con HMAC (la clave derivada no revela
 * la de Resend). Sin ninguna de las dos, el token se desactiva y se avisa en los logs.
 */
function tokenSecret(): Buffer | null {
  if (secretCache !== undefined) return secretCache;
  const own = process.env.FORM_SECRET;
  const resend = process.env.RESEND_API_KEY;
  if (own) {
    if (own.length < 32) console.warn("[contacto] FORM_SECRET es corto: use al menos 32 caracteres aleatorios");
    secretCache = Buffer.from(own, "utf8");
  } else if (resend) {
    secretCache = createHmac("sha256", resend).update("nexus-web/form-token/v1").digest();
  } else {
    console.warn("[contacto] Sin FORM_SECRET ni RESEND_API_KEY: el token de tiempo del formulario está desactivado");
    secretCache = null;
  }
  return secretCache;
}

const sign = (secret: Buffer, payload: string) => createHmac("sha256", secret).update(payload).digest("base64url");

/** Emite un token nuevo, o `null` si el token está desactivado. */
export function issueToken(now = Date.now()): string | null {
  const secret = tokenSecret();
  if (!secret) return null;
  const payload = `${now}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(secret, payload)}`;
}

export type TokenCheck = { ok: true; nonce: string | null } | { ok: false; reason: "invalido" | "rapido" | "vencido" | "usado" };

const TOKEN_RE = /^(\d{13})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{43})$/;
const used = new Map<string, number>(); // nonce → hora de emisión

/** Revisa el token sin consumirlo. Con el token desactivado, siempre pasa. */
export function checkToken(token: unknown, now = Date.now()): TokenCheck {
  const secret = tokenSecret();
  if (!secret) return { ok: true, nonce: null };
  if (typeof token !== "string") return { ok: false, reason: "invalido" };
  const m = TOKEN_RE.exec(token);
  if (!m) return { ok: false, reason: "invalido" };
  const expected = Buffer.from(sign(secret, `${m[1]}.${m[2]}`));
  const given = Buffer.from(m[3]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalido" };
  const age = now - Number(m[1]);
  if (age < TOKEN_MIN_MS) return { ok: false, reason: "rapido" };
  if (age > TOKEN_MAX_MS) return { ok: false, reason: "vencido" };
  if (used.has(m[2])) return { ok: false, reason: "usado" };
  return { ok: true, nonce: m[2] };
}

/** Marca el token como usado justo antes de enviar. Devuelve `false` si otro envío lo tomó primero. */
export function claimToken(nonce: string | null, now = Date.now()): boolean {
  if (nonce === null) return true;
  if (used.has(nonce)) return false;
  if (used.size > 10_000) for (const [k, t] of used) if (now - t > TOKEN_MAX_MS) used.delete(k);
  used.set(nonce, now);
  return true;
}

/** Si el envío falló, el visitante puede reintentar con el mismo token. */
export function releaseToken(nonce: string | null) {
  if (nonce !== null) used.delete(nonce);
}

// ---------- Límite de envíos por IP ----------
// En memoria: vale por instancia del servidor. Basta para frenar ráfagas; no es un límite global estricto.

const RATE = { max: 5, windowMs: 15 * 60 * 1000 }; // por IP (IPv6: por /64)
const GLOBAL = { max: 60, windowMs: 60 * 60 * 1000 }; // por instancia, para no agotar la cuota de Resend

const hits = new Map<string, number[]>();
let globalHits: number[] = [];
let lastSweep = 0;

/** Borra de la tabla las IPs sin envíos recientes. Corre en los dos caminos (aceptado y rechazado). */
function sweep(now: number) {
  if (hits.size < 1000 && now - lastSweep < RATE.windowMs) return;
  lastSweep = now;
  for (const [k, v] of hits) {
    const live = v.filter((t) => now - t < RATE.windowMs);
    if (live.length) hits.set(k, live);
    else hits.delete(k);
  }
}

export function allow(ipKey: string, now = Date.now()) {
  sweep(now);
  globalHits = globalHits.filter((t) => now - t < GLOBAL.windowMs);
  const mine = (hits.get(ipKey) ?? []).filter((t) => now - t < RATE.windowMs);
  const ok = mine.length < RATE.max && globalHits.length < GLOBAL.max;
  if (ok) {
    mine.push(now);
    globalHits.push(now);
  }
  // Nunca se guarda una IP con lista vacía.
  if (mine.length) hits.set(ipKey, mine);
  else hits.delete(ipKey);
  return ok;
}

/**
 * IP del visitante. Depende de Vercel: la plataforma escribe `x-real-ip` con la IP real y descarta la que mande
 * el cliente. Fuera de Vercel (o detrás de otro proxy) esta cabecera no es confiable.
 */
export function clientIp(req: Request): string | null {
  const ip = req.headers.get("x-real-ip")?.trim();
  return ip && ip.length <= 64 ? ip : null;
}

/** Expande una IPv6 a sus 8 grupos de 16 bits, o `null` si no lo es. */
function ipv6Groups(ip: string): number[] | null {
  let s = ip.replace(/^\[|\]$/g, "").replace(/%.*$/, "").toLowerCase();
  // Cola IPv4 (::ffff:1.2.3.4): se convierte en dos grupos.
  const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (v4) {
    const b = v4.slice(1).map(Number);
    if (b.some((n) => n > 255)) return null;
    s = `${s.slice(0, v4.index)}${((b[0] << 8) | b[1]).toString(16)}:${((b[2] << 8) | b[3]).toString(16)}`;
  }
  if (!/^[0-9a-f:]+$/.test(s) || s.split("::").length > 2) return null;
  const [head, tail] = s.includes("::") ? s.split("::") : [s, null];
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const fill = tail === null ? 0 : 8 - h.length - t.length;
  if (fill < 0 || (tail === null && h.length !== 8)) return null;
  const all = [...h, ...Array(fill).fill("0"), ...t];
  if (all.length !== 8 || all.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return all.map((g) => parseInt(g, 16));
}

/** Clave del límite: la IPv4 tal cual; una IPv6 se agrupa por su /64 (un proveedor suele dar un /64 entero a cada cliente). */
export function rateKey(ip: string | null): string {
  if (!ip) return "desconocida";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
  const g = ipv6Groups(ip);
  if (!g) return "desconocida";
  // IPv4 mapeada en IPv6 (::ffff:a.b.c.d): se trata como la IPv4.
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  return `${g.slice(0, 4).map((x) => x.toString(16)).join(":")}::/64`;
}

// ---------- Origen ----------

const PROD_URL = "https://nexus-web-beryl-five.vercel.app";

function allowedOrigins(): Set<string> {
  const out = new Set<string>([PROD_URL]);
  const add = (url: string | undefined) => {
    if (!url) return;
    try {
      const u = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`);
      out.add(u.origin);
      // El dominio propio con y sin www.
      const alt = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
      if (!u.hostname.endsWith(".vercel.app")) out.add(`${u.protocol}//${alt}${u.port ? `:${u.port}` : ""}`);
    } catch {
      // URL mal escrita en la variable: se ignora.
    }
  };
  add(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexuschile.net");
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);
  return out;
}

/**
 * Se compara el `Origin` contra una lista fija, no contra `Host`/`X-Forwarded-Host` (que el cliente puede
 * mandar). Sin `Origin` (clientes que no son navegadores) se permite: las demás defensas siguen aplicando.
 */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (allowedOrigins().has(origin)) return true;
  // En desarrollo local, el propio equipo.
  return process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

// ---------- Cloudflare Turnstile (opcional) ----------

/** Activo solo si están las dos variables: la clave pública (el widget) y la secreta (la verificación). */
export function turnstileEnabled(): boolean {
  const site = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secret = !!process.env.TURNSTILE_SECRET_KEY;
  if (site !== secret) console.warn("[contacto] Turnstile a medias: faltan NEXT_PUBLIC_TURNSTILE_SITE_KEY o TURNSTILE_SECRET_KEY; queda desactivado");
  return site && secret;
}

export type TurnstileResult = "ok" | "rechazado" | "caido";

/** Verifica el token de Turnstile con siteverify. */
export async function verifyTurnstile(response: unknown, ip: string | null): Promise<TurnstileResult> {
  if (typeof response !== "string" || !response || response.length > 2048) return "rechazado";
  const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response });
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[contacto] Turnstile respondió ${res.status}`);
      return "caido";
    }
    const out = (await res.json()) as { success?: unknown };
    return out.success === true ? "ok" : "rechazado";
  } catch {
    console.error("[contacto] No se pudo verificar Turnstile");
    return "caido";
  }
}
