// Genera las imágenes para compartir (Open Graph, 1200×630) de cada idioma en public/og/<idioma>.jpg.
// Se dibujan con las fuentes, colores y fotos del propio sitio: se abre la página en Chrome (Playwright) y se
// compone la imagen encima, con los textos de src/data/nexus.ts.
//
// Uso: npm run build && node scripts/og.mjs
//      node scripts/og.mjs http://localhost:3000   (contra un `next dev` ya abierto)
// Hay que volver a generarlas si cambian el título, el rol o la foto de la hero.

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

      // Humo fotográfico y brasas al ras del suelo, como en la hero.
      card.append(
        el("div", {
          position: "absolute",
          inset: "-4%",
          backgroundImage: "url(/hero/humo.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "0.75",
        }),
        el("div", {
          position: "absolute",
          inset: "0",
          background:
            "radial-gradient(60% 45% at 8% 108%, rgba(255,104,30,.30), transparent 70%), radial-gradient(50% 40% at 82% 110%, rgba(255,104,30,.26), transparent 70%), linear-gradient(90deg, rgba(18,15,13,.85) 0%, rgba(18,15,13,.35) 55%, rgba(18,15,13,0) 75%)",
        }),
      );

      // Domingo a la derecha: silueta con resplandor de fuego detrás y la foto encima.
      const photo = (extra) =>
        // Zona segura: WhatsApp y otros recortan los costados (~130 px por lado), así que nada importante va en los bordes.
        el("img", { position: "absolute", right: "150px", top: "60px", height: "600px", width: "auto", ...extra });
      const rim = photo({ filter: "brightness(0) drop-shadow(0 6px 14px rgba(255,118,40,.55))", opacity: "0.45" });
      const img = photo({ filter: "brightness(.9) saturate(.92)" });
      rim.src = img.src = "/hero/domingo.webp";
      card.append(rim, img);
      card.append(
        el("div", {
          position: "absolute",
          inset: "0",
          background: "linear-gradient(0deg, rgba(18,15,13,.9) 0%, rgba(18,15,13,0) 30%)",
        }),
      );

      const col = el("div", {
        position: "absolute",
        left: "150px",
        top: "56px",
        bottom: "60px",
        width: "560px",
        display: "flex",
        flexDirection: "column",
      });

      // Logo NEXUS con la X dorada (la misma composición de Logo.tsx).
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 100 112");
      svg.style.cssText = "height:1.18em;width:1.05em;margin:0 .02em;transform:translateY(-.02em)";
      svg.innerHTML =
        '<defs><linearGradient id="oga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c690"/><stop offset="1" stop-color="#b98d55"/></linearGradient><linearGradient id="ogb" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98252"/><stop offset="1" stop-color="#7c5c34"/></linearGradient></defs><polygon points="80,0 98,0 22,112 2,112" fill="url(#ogb)"/><polygon points="4,0 34,0 98,112 68,112" fill="url(#oga)"/>';
      col.append(
        el(
          "div",
          { display: "flex", alignItems: "center", fontSize: "42px", fontWeight: "600", letterSpacing: "0.06em", lineHeight: "1" },
          ["NE", svg, "US"],
        ),
      );

      // Título carbonizado: la misma textura de ceniza del sitio (clase title-char), una línea por bloque.
      const title = el("div", {
        marginTop: "auto",
        fontFamily: "var(--font-barlow), sans-serif",
        fontStyle: "italic",
        fontWeight: "800",
        textTransform: "uppercase",
        lineHeight: "0.86",
        fontSize: "118px",
        fontKerning: "none",
        opacity: "0.95",
      });
      for (const line of titleLines) {
        const s = el("span", { display: "block", width: "fit-content", margin: "-0.16em -0.2em", padding: "0.16em 0.2em" }, line);
        s.className = "title-char";
        title.append(s);
      }
      col.append(title);

      col.append(
        el("div", {
          marginTop: "30px",
          height: "1px",
          width: "120px",
          background: "linear-gradient(90deg, #e0c08f, rgba(201,162,107,.6), transparent)",
        }),
        el(
          "div",
          {
            marginTop: "22px",
            fontFamily: "var(--font-archivo), sans-serif",
            fontWeight: "800",
            fontStretch: "115%",
            textTransform: "uppercase",
            fontSize: "34px",
            letterSpacing: "0.01em",
            lineHeight: "1",
          },
          [firstName + " ", el("span", { color: "#e0c08f" }, lastName)],
        ),
        // El rol en sus dos partes, una por línea, como en la hero del celular.
        el(
          "div",
          { marginTop: "14px", fontSize: "23px", lineHeight: "1.35", color: "rgba(244,238,230,.85)" },
          roleLines.map((l) => el("span", { display: "block" }, l)),
        ),
      );
      card.append(col);
      card.dataset.og = "";
      document.body.append(card);

      // El título se achica si una línea no cabe a la izquierda de la foto.
      const lines = [...title.children];
      let size = 118;
      while (size > 70 && Math.max(...lines.map((l) => l.getBoundingClientRect().width)) > 540) {
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
  // Solo las fotos de la tarjeta: las del resto de la página tienen carga diferida y nunca terminarían.
  await page.evaluate(() =>
    Promise.all([...document.querySelectorAll("[data-og] img")].map((i) => i.decode().catch(() => {}))),
  );
  await page.waitForTimeout(300);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(`public${c.og.image}`);
  console.log(`public${c.og.image}`);
  await page.close();
}

await browser.close();
next?.kill();
