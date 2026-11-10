# NEXUS · sitio web

Sitio de NEXUS, auditoría forense e investigación de incendios (Domingo Soto Gamé, Valdivia). Proyecto de Main Brain.

## Stack

Next.js 16 con exportación estática (`out/`), React 19, Tailwind CSS v4, Motion y Phosphor Icons. No tiene backend: el contacto va por WhatsApp, correo y teléfono.

## Dónde se edita

- **Textos, servicios, contacto y fotos:** `src/data/nexus.ts`. Las palabras entre `**dobles asteriscos**` salen en negrita.
- **Secciones:** `src/components/sections/`.
- **Piezas compartidas:** `src/components/ui/` (títulos, apariciones, íconos y fotos).
- **Hero:** `src/components/hero/`.
- **Sistema visual:** `DESIGN.md`. Producto y público: `PRODUCT.md`.

## Comandos

```bash
npm install
npm run dev         # desarrollo en http://localhost:3000
npm run build       # genera el sitio estático en out/
npm run test:title  # tras el build: verifica que el título de la hero no se corte
```

## Despliegue

Vercel detecta Next.js y la exportación estática sin configuración extra. Si el dominio no es `nexuschile.net`, define la variable `NEXT_PUBLIC_SITE_URL`.

## CI

`.github/workflows/ci.yml` corre tipos, lint y build en cada PR y en `main`. Al crear el repositorio, Actions quedó apagado porque la cuota gratuita de la organización estaba casi agotada. Se enciende en Settings → Actions.

## Pendientes con el cliente

- Logo de NEXUS en SVG y foto original de Domingo en alta resolución.
- Permiso para usar los logos de IAAI.
- Cobertura: solo Valdivia o todo Chile.
- Aprobación de Domingo para las fotos generadas en que aparece él (`public/fotos/terreno.webp` y `reunion.webp`).
