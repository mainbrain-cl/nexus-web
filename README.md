# NEXUS · sitio web

Sitio de NEXUS, auditoría forense e investigación de incendios (Domingo Soto Gamé, Valdivia). Proyecto de Main Brain.

## Stack

Next.js 16, React 19, Tailwind CSS v4, Motion y Phosphor Icons. La página se prerenderiza como estática; lo único que corre en el servidor es `POST /api/contacto`, que envía el formulario de contacto al correo de Domingo con Resend. WhatsApp, correo y teléfono quedan como alternativas.

## Dónde se edita

- **Textos, servicios, contacto y fotos:** `src/data/nexus.ts`. Las palabras entre `**dobles asteriscos**` salen en negrita.
- **Secciones:** `src/components/sections/`.
- **Piezas compartidas:** `src/components/ui/` (títulos, apariciones, íconos y fotos).
- **Hero:** `src/components/hero/`.
- **Formulario de contacto:** preguntas, opciones y textos en `src/data/formulario.ts` (con ids estables para traducir); el componente en `src/components/formulario/`; las reglas de validación en `src/lib/contacto.ts`; el envío en `src/app/api/contacto/`.
- **Sistema visual:** `DESIGN.md`. Producto y público: `PRODUCT.md`.

## Comandos

```bash
npm install
npm run dev         # desarrollo en http://localhost:3000
npm run build       # build de producción (la página queda prerenderizada)
npm run test:title  # tras el build: levanta next start y verifica que el título de la hero no se corte
```

## Despliegue

Vercel detecta Next.js sin configuración extra. Si el dominio no es `nexuschile.net`, define la variable `NEXT_PUBLIC_SITE_URL`.

### Formulario de contacto (Resend)

Variables de entorno (en Vercel: Settings → Environment Variables):

| Variable | Obligatoria | Por defecto | Para qué |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Sí, en producción | — | Clave de la API de Resend. |
| `FORM_TO` | No | `domingosoto@nexuschile.net` | Correo que recibe las consultas. |
| `FORM_FROM` | No | `NEXUS Web <onboarding@resend.dev>` | Remitente. |

Sin `RESEND_API_KEY`, en desarrollo el correo se muestra en la consola y el formulario responde bien; en producción la ruta responde 503 y el formulario ofrece WhatsApp y correo.

Para activarlo:

1. Crear una cuenta en [resend.com](https://resend.com) y una API key con permiso de envío.
2. Cargar `RESEND_API_KEY` en Vercel y volver a desplegar.
3. Con el remitente de prueba `onboarding@resend.dev`, Resend solo entrega al correo dueño de la cuenta. Para enviar a `FORM_TO` desde el dominio propio: verificar `nexuschile.net` en Resend (Domains, registros DNS SPF y DKIM) y definir `FORM_FROM`, por ejemplo `NEXUS Web <web@nexuschile.net>`.

El correo llega en español, con el asunto `Consulta web: <quién solicita> · <servicio>`, en HTML y texto plano, y con `reply_to` apuntando al visitante: Domingo responde directo desde su correo. La consulta no se guarda en ningún lado.

### Abrir el formulario con un servicio ya elegido

- Enlace: `#contacto?servicio=<id>` (helper `contactFormHref(id)` en `src/data/formulario.ts`). También sirve `?servicio=<id>#contacto`.
- Desde código: `openContactForm(id)` de `src/components/formulario/abrir.ts` (dispara el evento `nexus:contacto`).
- Ids: `auditoria`, `revision-propia`, `litigacion`, `controvertidas`, `investigacion`, `evaluacion`, `capacitacion`, `no-se`. Se aceptan además `prejudicial` (→ `evaluacion`) y `formacion` (→ `capacitacion`), los ids de las tarjetas de Servicios.

## CI

`.github/workflows/ci.yml` corre tipos, lint y build en cada PR y en `main`. Al crear el repositorio, Actions quedó apagado porque la cuota gratuita de la organización estaba casi agotada. Se enciende en Settings → Actions.

## Pendientes con el cliente

- Logo de NEXUS en SVG y foto original de Domingo en alta resolución.
- Permiso para usar los logos de IAAI.
- Cobertura: solo Valdivia o todo Chile.
- Aprobación de Domingo para las fotos generadas en que aparece él (`public/fotos/terreno.webp` y `reunion.webp`).
