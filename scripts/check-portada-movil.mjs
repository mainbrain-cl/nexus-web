// Verifica la portada en celular y tablet: que nada se monte sobre la cara de Domingo, el título ni los sellos,
// que los botones se vean sin desplazarse y que el nombre y el rol se lean sobre fondo oscuro.
//
// Mide las cajas reales en el navegador a 1,5 s (fin de la entrada) y a 2,5 s, y otra vez tras bajar 150 px
// (parallax). La cara se estima como un rectángulo fijo dentro de la foto: del pelo al mentón es el 31 %
// superior de la imagen y, a lo ancho, del 28 % al 66 % (medido sobre la transparencia de domingo.webp).
//
// Uso: npm run build && npm run test:portada        (o BASE=http://127.0.0.1:3000 para un servidor ya abierto)
// Capturas: SHOTS=<carpeta> guarda una por pantalla, idioma y tiempo, y una con las cajas marcadas.

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium } from "playwright";

const FACE = { x0: 0.28, x1: 0.66, y0: 0, y1: 0.31 };

let base = process.env.BASE;
let next;
if (!base) {
  const port = await new Promise((ok) => {
    const s = createServer().listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => ok(p));
    });
  });
  next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  process.on("exit", () => next.exitCode === null && next.kill());
  base = `http://127.0.0.1:${port}`;
  for (let i = 0; ; i++) {
    if (next.exitCode !== null) throw new Error("next start terminó antes de responder. ¿Corriste npm run build?");
    try {
      if ((await fetch(base + "/")).ok) break;
    } catch {}
    if (i > 120) throw new Error("next start no respondió a tiempo");
    await new Promise((r) => setTimeout(r, 500));
  }
}

const shots = process.env.SHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const PATHS = { es: "/", en: "/en/", pt: "/pt/" };
const ONLY = process.env.CASES?.split(",");
const LANGS = process.env.LANGS?.split(",");
const CASES = [
  { w: 393, h: 680, dpr: 3, label: "WhatsApp/Instagram iPhone 15 Pro" },
  { w: 393, h: 760, dpr: 3, label: "Safari con barras" },
  { w: 393, h: 852, dpr: 3, label: "Pantalla completa" },
  { w: 375, h: 667, dpr: 2, label: "iPhone SE" },
  { w: 360, h: 640, dpr: 3, label: "Android chico" },
  { w: 412, h: 780, dpr: 3, label: "Chrome Android" },
  { w: 430, h: 830, dpr: 3, label: "iPhone Pro Max" },
  { w: 768, h: 1024, dpr: 2, label: "Tablet" },
  { w: 1024, h: 700, dpr: 2, label: "Tablet horizontal" },
];

// Cajas de todo lo que se lee en la portada, más la cara.
function measure(face) {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    if (!b.width || !b.height || getComputedStyle(el).display === "none") return null;
    return { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom };
  };
  const hero = document.getElementById("inicio");
  const boxes = {};
  hero.querySelectorAll("ul[aria-label] img").forEach((el, i) => (boxes[`sello${i + 1}`] = r(el)));
  hero.querySelectorAll("#hero-title > span[aria-hidden] > span").forEach((el, i) => (boxes[`titulo${i + 1}`] = r(el)));
  const tag = hero.querySelector(".in-tag");
  boxes.etiqueta = tag && getComputedStyle(tag).display !== "none" ? r(tag.querySelector("[aria-hidden]")) : null;
  const ps = hero.querySelectorAll(".font-name, .in-role");
  boxes.nombre = r(ps[0]);
  boxes.rol = r(ps[1]);
  hero.querySelectorAll("a.btn").forEach((el, i) => (boxes[i === 0 ? "botonOro" : "botonLinea"] = r(el)));
  const img = hero.querySelector("img[fetchpriority]");
  const p = img.getBoundingClientRect();
  const cara = {
    x0: p.left + p.width * face.x0,
    x1: p.left + p.width * face.x1,
    y0: p.top + p.height * face.y0,
    y1: p.top + p.height * face.y1,
  };
  return { boxes, cara, foto: { x0: p.left, y0: p.top, x1: p.right, y1: p.bottom }, vh: innerHeight, vw: innerWidth };
}

const overlap = (a, b) => a && b && a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function check(m) {
  const problems = [];
  const names = Object.keys(m.boxes).filter((k) => m.boxes[k]);
  // Los sellos se montan entre sí a propósito (fila apilada): no se comparan entre ellos.
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++) {
      const [a, b] = [names[i], names[j]];
      if (a.startsWith("sello") && b.startsWith("sello")) continue;
      if (overlap(m.boxes[a], m.boxes[b])) problems.push(`${a}∩${b}`);
    }
  for (const k of names) if (overlap(m.boxes[k], m.cara)) problems.push(`${k}∩cara`);
  const btn = m.boxes.botonOro;
  if (!btn || btn.y1 > m.vh + 0.5) problems.push("botón dorado fuera de pantalla");
  return problems;
}

// Contraste del nombre y el rol: se oculta el texto, se fotografía su caja y se toma el píxel claro del fondo
// (percentil 98, para no contar una brasa suelta) contra el color del texto.
async function contrast(page) {
  const sel = { nombre: "#inicio .font-name", rol: "#inicio .in-role" };
  const out = {};
  for (const [k, s] of Object.entries(sel)) {
    const box = await page.locator(s).boundingBox();
    await page.addStyleTag({ content: `${s} { visibility: hidden !important; }` });
    const png = (await page.screenshot({ clip: box })).toString("base64");
    await page.addStyleTag({ content: `${s} { visibility: visible !important; }` });
    out[k] = await page.evaluate(async ([src, k]) => {
      const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${src}`; });
      const cv = new OffscreenCanvas(img.width, img.height);
      const x = cv.getContext("2d");
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, img.width, img.height).data;
      const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      const L = [];
      for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      L.sort((a, b) => a - b);
      const bg = L[Math.floor(L.length * 0.98)];
      // Texto: hueso (nombre) y hueso al 85 % (rol) sobre ese fondo; el apellido en oro claro es el más oscuro.
      const fg = k === "nombre" ? 0.2126 * lin(0xe0) + 0.7152 * lin(0xc0) + 0.0722 * lin(0x8f) : 0.2126 * lin(210) + 0.7152 * lin(205) + 0.0722 * lin(198); // hueso al 85 % sobre ceniza
      return (fg + 0.05) / (bg + 0.05);
    }, [png, k]);
  }
  return out;
}

async function annotate(page, m) {
  await page.evaluate((m) => {
    const add = (b, color, label) => {
      if (!b) return;
      const d = document.createElement("div");
      d.dataset.anot = "";
      Object.assign(d.style, {
        position: "fixed", left: `${b.x0}px`, top: `${b.y0}px`, width: `${b.x1 - b.x0}px`, height: `${b.y1 - b.y0}px`,
        outline: `2px solid ${color}`, zIndex: 99, pointerEvents: "none", font: "10px sans-serif", color, textShadow: "0 0 3px #000",
      });
      d.textContent = label;
      document.body.append(d);
    };
    add(m.cara, "#ff2d55", "cara");
    for (const [k, b] of Object.entries(m.boxes)) add(b, "#2dd4ff", k);
  }, m);
}

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}

const rows = [];
let failed = 0;
for (const c of CASES) {
  if (ONLY && !ONLY.includes(`${c.w}x${c.h}`)) continue;
  for (const [lang, path] of Object.entries(PATHS)) {
    if (LANGS && !LANGS.includes(lang)) continue;
    const ctx = await browser.newContext({
      viewport: { width: c.w, height: c.h },
      deviceScaleFactor: c.dpr,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: "load" });
    // Los tiempos se cuentan desde que arranca la entrada (la primera animación CSS de la página), no desde la
    // petición: así una carga lenta del servidor no adelanta la medición.
    const wait = (ms) =>
      page.waitForFunction(
        (ms) => {
          const starts = document.getAnimations().map((a) => a.startTime).filter((t) => t != null);
          return starts.length > 0 && document.timeline.currentTime >= Math.min(...starts) + ms;
        },
        ms,
        { polling: 50 },
      );
    const name = `${lang}-${c.w}x${c.h}`;
    const res = { caso: `${c.w}×${c.h}`, lang };

    await wait(1500);
    const m15 = await page.evaluate(measure, FACE);
    if (shots) await page.screenshot({ path: join(shots, `${name}-1.5s.png`) });
    await wait(2500);
    const m25 = await page.evaluate(measure, FACE);
    if (shots) await page.screenshot({ path: join(shots, `${name}-2.5s.png`) });
    res.c = await contrast(page);
    if (shots && lang === "es") {
      await annotate(page, m25);
      await page.screenshot({ path: join(shots, `${name}-cajas.png`) });
      await page.evaluate(() => document.querySelectorAll("[data-anot]").forEach((e) => e.remove()));
    }
    await page.evaluate(() => window.scrollTo(0, 150));
    await page.waitForTimeout(700);
    const mScroll = await page.evaluate(measure, FACE);

    res.p15 = check(m15);
    res.p25 = check(m25);
    res.pScroll = check(mScroll).filter((p) => !p.startsWith("botón"));
    const b = m25.boxes;
    res.caraAlto = Math.round(m25.cara.y1 - m25.cara.y0);
    res.aireTitulo = Math.round(m25.cara.y0 - b.titulo2.y1);
    res.aireMenton = Math.round((b.etiqueta ?? b.nombre).y0 - m25.cara.y1);
    res.etiqueta = !!b.etiqueta;
    res.botones = b.botonLinea && b.botonLinea.y1 <= m25.vh + 0.5 ? "ambos" : b.botonOro && b.botonOro.y1 <= m25.vh + 0.5 ? "dorado" : "ninguno";
    const ok = !res.p15.length && !res.p25.length && !res.pScroll.length && res.c.nombre >= 4.5 && res.c.rol >= 4.5;
    if (!ok && c.w < 1024) failed++;
    res.ok = ok;
    rows.push(res);
    console.log(
      `${ok ? "OK   " : "FALLA"} ${lang} ${res.caso.padEnd(9)} cara ${String(res.caraAlto).padStart(3)} px · aire título ${String(res.aireTitulo).padStart(3)} · aire mentón ${String(res.aireMenton).padStart(3)} · etiqueta ${res.etiqueta ? "sí" : "no"} · botones ${res.botones} · contraste nombre ${res.c.nombre.toFixed(1)} rol ${res.c.rol.toFixed(1)}` +
        (res.p15.length ? ` · 1,5 s: ${res.p15.join(", ")}` : "") +
        (res.p25.length ? ` · 2,5 s: ${res.p25.join(", ")}` : "") +
        (res.pScroll.length ? ` · scroll: ${res.pScroll.join(", ")}` : ""),
    );
    await ctx.close();
  }
}

await browser.close();
next?.kill();
if (failed) {
  console.error(`\n${failed} pantalla(s) bajo 1024 px con cruces, botones fuera o poco contraste.`);
  process.exit(1);
}
console.log("\nPortada sin cruces bajo 1024 px. (1024×700 usa la composición de escritorio, que no se tocó.)");
