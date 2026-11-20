// Genera public/correo/nexus-logo.png: el logo NEXUS (hueso con la X dorada) sobre fondo ceniza, para el
// encabezado del correo de consultas. Gmail no muestra SVG, así que el correo lo carga como PNG desde
// https://nexuschile.net/correo/nexus-logo.png (`LOGO_URL` en src/app/api/contacto/correo.ts).
// Se dibuja con el componente y la fuente del propio sitio: se abre la página en Chrome y se fotografía el logo.
// El fondo es opaco a propósito: si un cliente de correo en modo oscuro invierte el encabezado, el logo se sigue leyendo.
//
// Uso: node scripts/correo-logo.mjs http://localhost:3000   (con `next dev` o `next start` abierto)
// Solo hace falta si cambia el logo. Si cambia el tamaño, ajustar `LOGO` en correo.ts.

import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3000";
// Tamaño en el correo (px CSS) y densidad del archivo: 3x se ve nítido en pantallas de celular.
const WIDTH = 124;
const HEIGHT = 40;
const FONT_SIZE = 30; // la X mide 1.18em de alto: con 30 px entra completa en los 40 px
const SCALE = 3;

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
const page = await browser.newPage({ viewport: { width: 800, height: 400 }, deviceScaleFactor: SCALE });
await page.goto(base, { waitUntil: "networkidle" });
const logoWidth = await page.evaluate(
  async ({ width, height, fontSize }) => {
    const logo = document.querySelector('[aria-label="NEXUS"]');
    if (!logo) throw new Error("No se encontró el logo en la página");
    const box = document.createElement("div");
    box.id = "correo-logo";
    box.style.cssText = `position:fixed;left:0;top:0;z-index:2147483647;width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:flex-start;background:#120f0d`;
    const copy = logo.cloneNode(true);
    copy.className = "inline-flex items-center font-semibold tracking-[0.06em] text-hueso";
    copy.style.fontSize = `${fontSize}px`;
    copy.style.lineHeight = "1";
    box.appendChild(copy);
    document.body.appendChild(box);
    await document.fonts.ready;
    return copy.getBoundingClientRect().width;
  },
  { width: WIDTH, height: HEIGHT, fontSize: FONT_SIZE },
);
if (logoWidth > WIDTH) throw new Error(`El logo mide ${logoWidth} px y no entra en ${WIDTH} px: ajustar WIDTH o FONT_SIZE`);
const shot = await page.locator("#correo-logo").screenshot({ type: "png" });
await browser.close();

await mkdir("public/correo", { recursive: true });
await sharp(shot)
  .resize(WIDTH * SCALE, HEIGHT * SCALE)
  .png({ palette: true, colours: 128, compressionLevel: 9 })
  .toFile("public/correo/nexus-logo.png");
console.log(`public/correo/nexus-logo.png listo (${WIDTH * SCALE}×${HEIGHT * SCALE} px, se muestra a ${WIDTH}×${HEIGHT}).`);
