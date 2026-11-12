// Verifica que ninguna letra del título de la hero quede cortada, en los tres idiomas (/, /en/ y /pt/).
//
// Renderiza el título dos veces en cada pantalla: con su textura de ceniza y con relleno blanco plano.
// Todo píxel que la letra blanca pinta debe estar pintado también en la versión con textura; si no,
// la textura se cortó (por ejemplo, la cursiva sobresaliendo de la caja de su letra).
//
// Uso: npm run build && npm run test:title

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright";

// Sirve el build de producción con `next start` en un puerto libre (el sitio ya no se exporta a out/,
// porque el formulario de contacto necesita la ruta /api/contacto).
const port = await new Promise((ok) => {
  const s = createServer().listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => ok(p));
  });
});
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  stdio: ["ignore", "ignore", "inherit"],
});
const stopNext = () => next.exitCode === null && next.kill();
process.on("exit", stopNext);
const base = `http://127.0.0.1:${port}`;
const url = `${base}/`;
for (let i = 0; ; i++) {
  if (next.exitCode !== null) throw new Error("next start terminó antes de responder. ¿Corriste npm run build?");
  try {
    if ((await fetch(url)).ok) break;
  } catch {}
  if (i > 120) throw new Error("next start no respondió a tiempo");
  await new Promise((r) => setTimeout(r, 500));
}

// Español, inglés y portugués: cada idioma tiene su propio título.
const PATHS = ["/", "/en/", "/pt/"];

const CASES = [
  { width: 390, height: 844, dpr: 3 },
  { width: 768, height: 1024, dpr: 2 },
  { width: 1280, height: 800, dpr: 1 },
  { width: 1440, height: 900, dpr: 1.5 },
  { width: 1920, height: 1080, dpr: 1 },
  { width: 2560, height: 1440, dpr: 1 },
];

// Deja solo el título, sobre negro, sin capa encendida.
const ISOLATE = `
  header, #inicio > :not(:has(#hero-title)) { visibility: hidden !important; }
  #inicio { background: #000 !important; }
  .title-hot { display: none !important; }`;
const FLAT = `.title-char { background: none !important; color: #fff !important; -webkit-text-fill-color: #fff !important; }`;

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}

let failed = 0;
for (const path of PATHS) for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: c.dpr });
  await page.emulateMedia({ reducedMotion: "reduce" }); // estado final, sin entrada ni parallax
  await page.goto(base + path, { waitUntil: "load" });
  await page.addStyleTag({ content: ISOLATE });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const b = await page.locator("#hero-title").boundingBox();
  const clip = { x: Math.max(0, b.x - 40), y: Math.max(0, b.y - 40), width: Math.min(c.width, b.width + 80), height: b.height + 80 };
  const textured = (await page.screenshot({ clip })).toString("base64");
  await page.addStyleTag({ content: FLAT });
  await page.waitForTimeout(100);
  const flat = (await page.screenshot({ clip })).toString("base64");

  const r = await page.evaluate(async ([a, f]) => {
    const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${src}`; });
    const [ia, ifl] = await Promise.all([load(a), load(f)]);
    const px = (img) => { const cv = new OffscreenCanvas(img.width, img.height); const x = cv.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const da = px(ia), df = px(ifl);
    let glyph = 0, missing = 0;
    for (let i = 0; i < df.length; i += 4) {
      const lf = (df[i] + df[i + 1] + df[i + 2]) / 3;
      if (lf < 200) continue; // solo el interior pleno de la letra, no el antialias del borde
      glyph++;
      const la = (da[i] + da[i + 1] + da[i + 2]) / 3;
      if (la < 25) missing++;
    }
    return { glyph, missing };
  }, [textured, flat]);

  const ratio = r.missing / Math.max(1, r.glyph);
  const ok = r.glyph > 1000 && ratio < 0.0005;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FALLA"} ${path.padEnd(5)} ${c.width}x${c.height} @${c.dpr}x  píxeles de letra: ${r.glyph}  sin textura: ${r.missing} (${(ratio * 100).toFixed(3)} %)`);
  await page.close();
}

await browser.close();
stopNext();
if (failed) {
  console.error(`\n${failed} pantalla(s) con letras cortadas en el título.`);
  process.exit(1);
}
console.log("\nTítulo completo en todas las pantallas.");
