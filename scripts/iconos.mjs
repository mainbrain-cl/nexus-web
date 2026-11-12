// Genera el favicon (.ico de 16 y 32 px) y el ícono de Apple (180 px) desde src/app/icon.svg, la X dorada del logo.
// Uso: node scripts/iconos.mjs (solo hace falta si cambia el ícono).

import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile("src/app/icon.svg");

// favicon.ico: contenedor ICO con imágenes PNG adentro (lo leen todos los navegadores actuales).
const sizes = [16, 32];
const pngs = await Promise.all(sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reservado
header.writeUInt16LE(1, 2); // tipo: ícono
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0); // ancho
  e.writeUInt8(s, 1); // alto
  e.writeUInt8(0, 2); // sin paleta
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por píxel
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));

// apple-icon.png: 180 px, fondo ceniza a sangre (iOS redondea las esquinas por su cuenta).
const x = await sharp(svg, { density: 512 }).resize(180, 180).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: "#120f0d" } })
  .composite([{ input: x }])
  .png()
  .toFile("src/app/apple-icon.png");

console.log("favicon.ico (16 y 32 px) y apple-icon.png (180 px) listos.");
