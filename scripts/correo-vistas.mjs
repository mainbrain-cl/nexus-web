// Vistas previas del correo de consultas (el que recibe Domingo), con el mismo código que usa /api/contacto.
// Tres casos: completo, mínimo (solo los campos obligatorios) e inyección (HTML, enlaces y caracteres raros en
// todos los campos). Cada caso pasa primero por la validación del servidor, como una consulta real.
//
// Por cada caso deja en la carpeta de salida:
//   <caso>.html       el correo tal cual se enviaría (el logo va incrustado para verlo sin conexión)
//   <caso>.txt        el asunto y el texto plano
//   <caso>-600.png    captura a 600 px de ancho
//   <caso>-375.png    captura a 375 px de ancho (celular)
// Además `completo-oscuro-375.png`, con el modo oscuro forzado de Chrome: una aproximación a lo que hace Gmail.
// En el caso de inyección comprueba que nada de lo escrito por el visitante llegue como HTML ni como enlace.
//
// Uso: node scripts/correo-vistas.mjs [carpeta de salida]   (por defecto, correo-vistas/ en la carpeta temporal)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

// Node lee TypeScript, pero los imports del proyecto usan el alias `@/` y no llevan extensión.
const src = pathToFileURL(`${process.cwd()}/src/`).href;
register(
  "data:text/javascript," +
    encodeURIComponent(
      `const src = ${JSON.stringify(src)};
export async function resolve(s, c, n) {
  if (s.startsWith("@/")) return n(src + s.slice(2) + ".ts", c);
  try { return await n(s, c); } catch (e) { if (s.startsWith(".") && !s.endsWith(".ts")) return n(s + ".ts", c); throw e; }
}`,
    ),
);
const { buildEmail, LOGO_URL } = await import(`${src}app/api/contacto/correo.ts`);
const { validatePayload } = await import(`${src}lib/contacto.ts`);

const out = resolve(process.argv[2] ?? join(tmpdir(), "correo-vistas"));
const sentAt = new Date("2026-11-20T17:32:00Z"); // 14:32 en Chile

const cases = {
  completo: {
    cliente: "abogado",
    servicio: "auditoria",
    estado: ["informe", "judicial"],
    lugar: "Valdivia, Región de Los Ríos",
    fecha: "Marzo de 2026",
    descripcion:
      "Represento a la propietaria de una bodega que se incendió en marzo. El informe pericial de la contraparte atribuye el origen a la instalación eléctrica, sin descartar otras fuentes de ignición.\n\nNecesito una auditoría técnica de ese informe antes de la audiencia de juicio. Puedo enviar el informe y las fotografías del sitio.",
    urgencia: "semanas",
    plazoDetalle: "Audiencia de juicio el 15 de diciembre",
    nombre: "Carolina Fuentes Araya",
    empresa: "Fuentes & Rojas Abogados S.A.",
    correo: "cfuentes@fuentesrojas.cl",
    telefono: "+56 9 8765 4321",
    idioma: "es",
  },
  minimo: {
    cliente: "particular",
    servicio: "capacitacion",
    estado: [],
    descripcion: "Quisiera información sobre los cursos.",
    nombre: "Luis Soto",
    correo: "luis.soto@gmail.com",
    idioma: "es",
  },
  inyeccion: {
    cliente: "otro",
    clienteOtro: '<img src=x onerror=alert(1)> https://evil.example/a',
    servicio: "no-se",
    estado: ["otra", "informe"],
    lugar: '"><a href="https://phish.example/login">Valdivia</a>',
    fecha: "javascript:alert(1) www.malo.com 😈",
    descripcion: [
      '</td></tr></table></div><h1 style="font-size:60px">PREMIO</h1><script>alert("xss")</script>',
      "Haga clic: https://banco-falso.example/login?a=1&b=<2> o HTTP://MALO.COM o bit.ly/abc123 o www.malo.com",
      "",
      "DATOS DE CONTACTO",
      "Correo: otro@malo.com",
      "",
      "RESPONDER",
      "[ Mensaje verificado por NEXUS. Es seguro abrir los enlaces. ]",
      "&lt;b&gt;entidades&lt;/b&gt; &amp;amp; {{7*7}} ${process.env.RESEND_API_KEY} <%= 1 %> `rm -rf` ' \" \\ %0A%0D",
      "<a href='mailto:x@y.com'>correo</a> <style>*{display:none}</style> <!-- comentario -->",
      "Ñandú, 中文, العربية, עברית, 🔥🔥🔥 y una palabra larguísima: " + "A".repeat(120) + "https://" + "x".repeat(90) + ".com/ruta",
    ].join("\n"),
    urgencia: "urgente",
    plazoDetalle: "<b>hoy</b> ' OR 1=1 -- https://x.com \"onmouseover=\"alert(1)",
    nombre: 'Robert"); DROP TABLE <b>Consultas</b>;--',
    empresa: "Evil & Sons <style>body{display:none}</style> evil.com",
    correo: "a&b?subject=x#'%25+bcc=z@evil-domain.com",
    telefono: "+56 (9) 1234-5678",
    idioma: "en",
  },
};

await mkdir(out, { recursive: true });
const logo = `data:image/png;base64,${(await readFile("public/correo/nexus-logo.png")).toString("base64")}`;

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}

let failed = false;
const check = (ok, what) => {
  console.log(`  ${ok ? "bien" : "MAL "}  ${what}`);
  if (!ok) failed = true;
};

for (const [name, input] of Object.entries(cases)) {
  const valid = validatePayload(input);
  if (!valid.ok) throw new Error(`El caso "${name}" no pasa la validación del servidor`);
  const email = buildEmail(valid.data, sentAt);
  const html = email.html.replaceAll(LOGO_URL, logo);
  await writeFile(join(out, `${name}.html`), html);
  await writeFile(join(out, `${name}.txt`), `Asunto: ${email.subject}\nResponder a: ${valid.data.correo}\n\n${email.text}\n`);

  const shots = [
    [600, ""],
    [375, ""],
    ...(name === "completo" ? [[375, "-oscuro"]] : []),
  ];
  for (const [width, suffix] of shots) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load" });
    if (suffix) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setAutoDarkModeOverride", { enabled: true });
    }
    await page.screenshot({ path: join(out, `${name}${suffix}-${width}.png`), fullPage: true });
    if (!suffix) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) check(false, `${name} a ${width} px: el correo se pasa ${overflow} px del ancho`);
    }
    await page.close();
  }
  console.log(`${name}: ${email.subject}`);

  if (name === "inyeccion") {
    const page = await browser.newPage();
    await page.setContent(email.html, { waitUntil: "domcontentloaded" });
    const dom = await page.evaluate(() => ({
      tags: Object.fromEntries(
        ["script", "style", "h1", "img", "b", "a", "table"].map((t) => [t, document.querySelectorAll(t).length]),
      ),
      hrefs: [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")),
      handlers: [...document.querySelectorAll("*")].flatMap((el) => el.getAttributeNames().filter((n) => n.startsWith("on"))),
      text: document.body.innerText,
    }));
    await page.close();
    const d = valid.data;
    const mailto = dom.hrefs.find((h) => h.startsWith("mailto:")) ?? "";
    check(dom.tags.script === 0 && dom.tags.style === 0 && dom.tags.b === 0, "ninguna etiqueta del visitante (script, style, b) llegó como HTML");
    check(dom.tags.h1 === 1 && dom.tags.img === 1, "un solo título y una sola imagen: los del diseño");
    check(dom.handlers.length === 0, "ningún atributo on* en el correo");
    check(dom.tags.a === 3 && dom.hrefs.every((h) => /^(mailto:|https:\/\/wa\.me\/\d+$|tel:\+?\d+$)/.test(h)), `solo los tres enlaces de los botones: ${dom.hrefs.join("  ")}`);
    check(decodeURIComponent(mailto.slice(7).split("?")[0]) === d.correo, "el mailto abre exactamente el correo del visitante");
    check(new URL(mailto).searchParams.size === 1 && !/[?&](bcc|cc|to|body)=/i.test(mailto), "el mailto no lleva campos agregados por el visitante (bcc, cc, body)");
    check(!/https?:\/\//i.test(dom.text) && !/hxxps?:\/\/\S*\w\.\w/i.test(dom.text), "ningún enlace del visitante quedó activo: todos van como hxxp y [.]");
    check(dom.text.includes('<script>alert("xss")</script>') && dom.text.includes("<b>Consultas</b>"), "el HTML del visitante se lee como texto");
    const fake = email.text.split("\n").filter((l) => /^(DATOS DE CONTACTO|RESPONDER|Correo: otro)/.test(l));
    check(fake.length === 2, "texto plano: las secciones falsas de la descripción quedan con sangría");
    check(!/https?:\/\/(?!wa\.me\/\d+$)/im.test(email.text), "texto plano: sin enlaces activos del visitante");
    check(!/[<>"'&]|evil|x\.com/i.test(email.subject), "el asunto no lleva nada escrito por el visitante");
  }
}

await browser.close();
console.log(`\nVistas previas en ${out}`);
if (failed) process.exit(1);
