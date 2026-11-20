// Genera las imágenes para compartir (Open Graph, 1200×630) de cada idioma en public/og/<idioma>-<n>.jpg
// (la ruta sale de `og.image` en src/data/nexus.ts; el número se sube al cambiar el diseño, para renovar la caché
// de WhatsApp y las redes).
// Se dibujan con las fuentes, colores y texturas del propio sitio: se abre la página en Chrome (Playwright) y se
// compone la imagen encima, con los textos de src/data/nexus.ts. Igual que la portada, no llevan la foto de
// Domingo (20-11): logo, título carbonizado con su resplandor, nombre y las dos frases, centrados.
//
// Uso: npm run build && node scripts/og.mjs
//      node scripts/og.mjs http://localhost:3000   (contra un `next dev` ya abierto)
// Hay que volver a generarlas si cambian el título, el nombre o las frases de la hero.

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

// Los textos salen de nexus.ts. Node lee TypeScript, pero los imports de ese archivo no llevan extensión.
register(
  "data:text/javascript," +
    encodeURIComponent(
      `export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".") && !s.endsWith(".ts")) return n(s + ".ts", c); throw e; } }`,
    ),
);
const { content } = await import(pathToFileURL(`${process.cwd()}/src/data/nexus.ts`).href);
const { locales, localeInfo } = await import(pathToFileURL(`${process.cwd()}/src/data/idiomas.ts`).href);

// Servidor: el que se pase como argumento o un `next start` sobre el build.
let base = process.argv[2];
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
      if ((await fetch(`${base}/`)).ok) break;
    } catch {}
    if (i > 120) throw new Error("next start no respondió a tiempo");
    await new Promise((r) => setTimeout(r, 500));
  }
}

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}

await mkdir("public/og", { recursive: true });

for (const locale of locales) {
  const c = content[locale];
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + localeInfo[locale].path, { waitUntil: "load" });

  await page.evaluate(
    ({ titleLines, roleLines, firstName, lastName }) => {
      const el = (tag, style = {}, children = []) => {
        const n = document.createElement(tag);
        Object.assign(n.style, style);
        for (const ch of [].concat(children)) n.append(ch);
        return n;
      };
      document.documentElement.style.overflow = "hidden";
      window.scrollTo(0, 0);

      const card = el("div", {
        position: "fixed",
        inset: "0",
        zIndex: "2147483647",
        width: "1200px",
        height: "630px",
        overflow: "hidden",
        background: "#120f0d",
        fontFamily: "var(--font-schibsted), sans-serif",
        color: "#f4eee6",
      });

      // Humo fotográfico y brasas al ras del suelo, como en la hero. Los bordes se oscurecen para centrar la mirada.
      card.append(
        el("div", {
          position: "absolute",
          inset: "-4%",
          backgroundImage: "url(/hero/humo.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "0.8",
        }),
        el("div", {
          position: "absolute",
          inset: "0",
          background:
            "radial-gradient(55% 42% at 10% 108%, rgba(255,104,30,.30), transparent 70%), radial-gradient(50% 40% at 90% 110%, rgba(255,104,30,.26), transparent 70%), radial-gradient(70% 30% at 50% 114%, rgba(255,120,40,.18), transparent 70%), radial-gradient(75% 85% at 50% 48%, rgba(18,15,13,0) 55%, rgba(18,15,13,.6) 100%)",
        }),
      );

      // Logo NEXUS con la X dorada (la misma composición de Logo.tsx), arriba al centro.
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 100 112");
      svg.style.cssText = "height:1.18em;width:1.05em;margin:0 .02em;transform:translateY(-.02em)";
      svg.innerHTML =
        '<defs><linearGradient id="oga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c690"/><stop offset="1" stop-color="#b98d55"/></linearGradient><linearGradient id="ogb" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98252"/><stop offset="1" stop-color="#7c5c34"/></linearGradient></defs><polygon points="80,0 98,0 22,112 2,112" fill="url(#ogb)"/><polygon points="4,0 34,0 98,112 68,112" fill="url(#oga)"/>';
      card.append(
        el(
          "div",
          {
            position: "absolute",
            insetInline: "0",
            top: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "38px",
            fontWeight: "600",
            letterSpacing: "0.06em",
            lineHeight: "1",
          },
          ["NE", svg, "US"],
        ),
      );

      // Columna centrada, como la hero: título, hilo, nombre y las dos frases.
      // Zona segura: WhatsApp y otros recortan los costados (~130 px por lado), así que nada importante va en los bordes.
      const col = el("div", {
        position: "absolute",
        left: "130px",
        right: "130px",
        top: "118px",
        bottom: "44px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      });

      // Título carbonizado: la misma textura de ceniza del sitio (clase title-char), una línea por bloque,
      // con la luz del fuego detrás (el mismo resplandor nx-hero-halo de la hero, fijo).
      const title = el("div", {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "var(--font-barlow), sans-serif",
        fontStyle: "italic",
        fontWeight: "800",
        textTransform: "uppercase",
        lineHeight: "0.86",
        fontSize: "150px",
        fontKerning: "none",
        opacity: "0.95",
      });
      const halo = el("div", { animation: "none", opacity: "0.5" });
      halo.className = "nx-hero-halo";
      title.append(halo);
      const lines = titleLines.map((line) => {
        const s = el("span", { display: "block", width: "fit-content", margin: "-0.16em -0.2em", padding: "0.16em 0.2em" }, line);
        s.className = "title-char";
        return s;
      });
      title.append(...lines);
      col.append(title);

      col.append(
        el("div", {
          marginTop: "34px",
          height: "1px",
          width: "120px",
          background: "linear-gradient(90deg, transparent, #e0c08f, transparent)",
        }),
        el(
          "div",
          {
            marginTop: "24px",
            fontFamily: "var(--font-archivo), sans-serif",
            fontWeight: "800",
            fontStretch: "115%",
            textTransform: "uppercase",
            fontSize: "36px",
            letterSpacing: "0.01em",
            lineHeight: "1",
          },
          [firstName + " ", el("span", { color: "#e0c08f" }, lastName)],
        ),
        // Las dos frases, una por línea, como en la hero del celular.
        el(
          "div",
          { marginTop: "16px", fontSize: "23px", lineHeight: "1.4", color: "rgba(244,238,230,.85)" },
          roleLines.map((l) => el("span", { display: "block" }, l)),
        ),
      );
      card.append(col);
      card.dataset.og = "";
      document.body.append(card);

      // El título se achica si una línea no cabe en la zona segura.
      let size = 150;
      while (size > 70 && Math.max(...lines.map((l) => l.getBoundingClientRect().width)) > 900) {
        size -= 2;
        title.style.fontSize = `${size}px`;
      }
    },
    {
      titleLines: c.hero.titleLines,
      roleLines: c.hero.roleLines,
      firstName: c.hero.firstName,
      lastName: c.hero.lastName,
    },
  );

  await page.evaluate(() => document.fonts.ready);
  // Margen para que carguen el humo y la textura de ceniza, que son fondos CSS.
  await page.waitForTimeout(600);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(`public${c.og.image}`);
  console.log(`public${c.og.image}`);
  await page.close();
}

await browser.close();
next?.kill();
