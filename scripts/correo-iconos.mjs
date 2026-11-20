// Genera los íconos del correo de consultas en public/correo/iconos/<nombre>.png, desde Phosphor
// (@phosphor-icons/react, peso fill) y en el oro oscuro de la marca. Gmail no muestra SVG, así que el correo los
// carga como PNG desde https://nexuschile.net/correo/iconos/ (`ASSET_BASE` en src/app/api/contacto/correo.ts).
// Son decorativos: en el correo llevan `alt=""` y el texto se entiende igual si no cargan.
//
// Uso: node scripts/correo-iconos.mjs
// Solo hace falta si se agrega o cambia un ícono. Los nombres deben coincidir con `ICONS` en correo.ts.

import { mkdir } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Phosphor from "@phosphor-icons/react/dist/ssr";
import sharp from "sharp";

const COLOR = "#9c7a4a"; // oro-oscuro: se distingue sobre la tarjeta blanca y también sobre un fondo oscuro
const SIZE = 72; // el correo los muestra a 24 px o menos: 3x para pantallas de celular

const icons = {
  // Secciones
  persona: "User",
  mensaje: "ChatText",
  llama: "Fire",
  responder: "ArrowBendUpLeft",
  // Avisos
  aviso: "ShieldWarning",
  urgencia: "ClockCountdown",
  // Etiquetas
  cliente: "Briefcase",
  identificacion: "IdentificationCard",
  empresa: "Buildings",
  idioma: "Translate",
  situacion: "ListChecks",
  lugar: "MapPin",
  fecha: "CalendarBlank",
  plazo: "Clock",
  correo: "EnvelopeSimple",
  telefono: "Phone",
};

await mkdir("public/correo/iconos", { recursive: true });
for (const [name, component] of Object.entries(icons)) {
  if (!Phosphor[component]) throw new Error(`Phosphor no tiene el ícono ${component}`);
  const svg = renderToStaticMarkup(createElement(Phosphor[component], { size: SIZE, color: COLOR, weight: "fill" }));
  await sharp(Buffer.from(svg)).resize(SIZE, SIZE).png({ compressionLevel: 9 }).toFile(`public/correo/iconos/${name}.png`);
}
console.log(`${Object.keys(icons).length} íconos listos en public/correo/iconos/ (${SIZE}×${SIZE} px).`);
