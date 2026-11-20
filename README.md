# NEXUS · sitio web

Sitio de NEXUS, auditoría forense e investigación de incendios (Domingo Soto Gamé, Valdivia). Proyecto de Main Brain.

## Stack

Next.js 16, React 19, Tailwind CSS v4, Motion y Phosphor Icons. La página se prerenderiza como estática; lo único que corre en el servidor es `/api/contacto` (GET entrega el token del formulario; POST envía el formulario de contacto al correo de Domingo con Resend). WhatsApp, correo y teléfono quedan como alternativas.

## Dónde se edita

- **Textos, servicios, contacto y fotos:** `src/data/nexus.ts`, con los textos en `es`, `en` y `pt` (misma forma: TypeScript falla si a un idioma le falta algo). Lo que no es texto (teléfono, fotos, ids, años) se escribe una sola vez arriba. Las palabras entre `**dobles asteriscos**` salen en negrita. Los términos de la traducción que Domingo debe confirmar llevan `// REVISAR:`.
- **Idiomas:** español en `/`, inglés en `/en/` y portugués en `/pt/`, todos prerenderizados (`src/data/idiomas.ts`). Hay dos layouts raíz porque `<html lang>` cambia: `src/app/(es)` y `src/app/[lang]`; los dos usan `src/components/RootDocument.tsx` (fuentes, metadatos y hreflang). El idioma sale de la ruta y llega a los componentes con `useContent()` (`src/components/LocaleProvider.tsx`). El selector de banderas (`LanguageSwitcher.tsx`, banderas SVG en `Flag.tsx`) conserva la sección en pantalla al cambiar de idioma; nunca se redirige según el navegador.
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
npm run test:title  # tras el build: levanta next start y verifica que el título de la hero no se corte (/, /en/ y /pt/)
npm run test:portada  # tras el build: mide que nada se monte en la portada de celular y tablet, y el contraste del texto
```

## Íconos, imagen al compartir y 404

- **Favicon:** la X dorada del logo sobre ceniza, en `src/app/icon.svg`. `node scripts/iconos.mjs` genera desde ese SVG `src/app/favicon.ico` (16 y 32 px) y `src/app/apple-icon.png` (180 px).
- **Imagen al compartir (Open Graph y X/Twitter):** una por idioma en `public/og/<idioma>-3.jpg` (1200×630), con el logo, el título, el nombre y las dos frases del idioma, sin foto, igual que la portada. Se dibujan con las fuentes y la textura del sitio: `npm run build && node scripts/og.mjs` (o `node scripts/og.mjs http://localhost:3000` con `next dev` abierto). Hay que regenerarlas si cambian el título, el nombre o las frases de la hero; si cambia el diseño, se sube el número del archivo (en `og.image` de `src/data/nexus.ts`) para renovar la caché de WhatsApp y las redes, y se borran las anteriores.
- **404:** `src/app/global-not-found.tsx` (con `experimental.globalNotFound` en `next.config.ts`, porque hay dos layouts raíz). Toma el idioma de la ruta pedida (`/en/xyz` sale en inglés).

## Despliegue

Vercel detecta Next.js sin configuración extra. Si el dominio no es `nexuschile.net`, define la variable `NEXT_PUBLIC_SITE_URL`.

### Formulario de contacto (Resend)

Variables de entorno (en Vercel: Settings → Environment Variables):

| Variable | Obligatoria | Por defecto | Para qué |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Sí, en producción | — | Clave de la API de Resend. |
| `FORM_TO` | No | `domingosoto@nexuschile.net` | Correo que recibe las consultas. |
| `FORM_FROM` | No | `NEXUS Web <onboarding@resend.dev>` | Remitente. |
| `FORM_SECRET` | Recomendada | Se deriva de `RESEND_API_KEY` | Clave del token de tiempo firmado (al menos 32 caracteres aleatorios, por ejemplo `openssl rand -base64 48`). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | — | Clave pública de Cloudflare Turnstile (widget). |
| `TURNSTILE_SECRET_KEY` | No | — | Clave secreta de Turnstile (verificación en el servidor). |

Sin `RESEND_API_KEY`, en desarrollo el correo se muestra en la consola y el formulario responde bien; en producción la ruta responde 503 y el formulario ofrece WhatsApp y correo.

Para activarlo:

1. Crear una cuenta en [resend.com](https://resend.com) y una API key con permiso de envío.
2. Cargar `RESEND_API_KEY` en Vercel y volver a desplegar.
3. Con el remitente de prueba `onboarding@resend.dev`, Resend solo entrega al correo dueño de la cuenta. Para enviar a `FORM_TO` desde el dominio propio: verificar `nexuschile.net` en Resend (Domains, registros DNS SPF y DKIM) y definir `FORM_FROM`, por ejemplo `NEXUS Web <web@nexuschile.net>`.

El correo llega en español, en HTML y texto plano, y con `reply_to` apuntando al visitante: Domingo responde directo desde su correo. La consulta no se guarda en ningún lado.

#### Defensas contra abuso

- **Token de tiempo firmado.** En la primera interacción el formulario pide `GET /api/contacto/` y recibe un token con la hora de emisión, firmado con HMAC (`FORM_SECRET`; si falta, una clave derivada de `RESEND_API_KEY`; si faltan las dos, el token se desactiva y queda un aviso en los logs). El servidor exige al menos 4 s desde la emisión, rechaza tokens de más de 6 h (el formulario pide uno nuevo antes) y no acepta reutilizar uno ya enviado. Un token malo recibe un error real, nunca un éxito falso: solo la trampa invisible (honeypot) responde `ok` sin enviar.
- **Límite por IP:** 5 consultas cada 15 min por IP (las IPv6 se agrupan por su /64) y 60 por hora en total, en memoria de cada instancia. **Depende de Vercel:** la IP sale de `x-real-ip`, que Vercel escribe con la IP real. Fuera de Vercel esa cabecera no es confiable y todas las visitas sin ella comparten un mismo cupo.
- **Origen:** si el navegador manda `Origin`, debe ser `NEXT_PUBLIC_SITE_URL` (o su variante con o sin `www`), `https://nexus-web-beryl-five.vercel.app`, `VERCEL_URL` o `VERCEL_BRANCH_URL`. En desarrollo se acepta `localhost`.
- **Cuerpo:** solo `application/json` (con `charset=utf-8` opcional), hasta 32 KB y UTF-8 válido. Los textos no admiten caracteres de control ni invisibles (ancho cero, marcas de dirección, uso privado, surrogates sueltos, braille en blanco U+2800); la tabulación se convierte en espacio. El correo del visitante admite en la parte local solo letras, números y `. _ % + -` (sin punto al inicio, al final ni dos seguidos): así no puede parecer una dirección web ni una palabra codificada. El formulario valida con la misma regla.
- **Correo a Domingo:** todo lo escrito por el visitante va escapado en el HTML. Arriba del aviso fijo va solo lo que arma el sistema con listas cerradas (el servicio en el título, la urgencia) y la fecha. Todo lo del visitante va después del aviso, cada dato bajo su etiqueta y en peso normal: así no puede escribir algo que parezca un título o un aviso de NEXUS. Los enlaces van desactivados (`https://x.com` → `hxxps://x[.]com`), también los disfrazados con caracteres que no se ven, acentos combinantes o puntos parecidos (el texto se pasa a NFKC y se le quitan los invisibles antes de buscar) y las IP sin esquema. En texto plano, la descripción va con sangría para que no pueda imitar una sección. El asunto solo lleva textos de listas fijas y la hora. Los botones para responder (`mailto:`, `wa.me` y `tel:`) se arman con el correo ya validado y con los dígitos del teléfono; si no pasan esa revisión, el botón no aparece.
- **Cabeceras de seguridad** en `next.config.ts`: `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.

#### Cloudflare Turnstile (opcional)

Con las dos variables `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`, el último paso carga el widget (invisible salvo que Cloudflare pida marcar una casilla) y el servidor verifica el token con `siteverify` antes de enviar. Sin ellas, el formulario funciona igual que antes. Para activarlo:

1. Crear una cuenta gratuita en [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) (no hace falta mover el dominio a Cloudflare).
2. En el panel: **Turnstile → Add widget**. Nombre: `NEXUS web`. Hostnames: `nexuschile.net`, `www.nexuschile.net` y `nexus-web-beryl-five.vercel.app` (más `localhost` si se quiere probar en local). Widget mode: **Managed** (o **Invisible**).
3. Copiar la **Site Key** a `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y la **Secret Key** a `TURNSTILE_SECRET_KEY` en Vercel (Production y Preview).
4. Volver a desplegar: la clave pública se incrusta en el build.

Si Cloudflare no responde, el envío falla con un mensaje de error y el formulario ofrece WhatsApp y correo.

#### El correo que recibe Domingo

- **Asunto:** `Consulta web: <servicio> · <quién solicita> · <día-mes hora de Chile>`, con nombres cortos, y `URGENTE · ` adelante si el visitante marcó "Es urgente". La hora hace único cada asunto: así Gmail no junta en una misma conversación las consultas de personas distintas.
- **Diseño** (`src/app/api/contacto/correo.ts`; textos en `emailTexts` de `src/data/formulario.ts`): de lectura fácil y visual. Franja ceniza con el logo; título "Nueva consulta: <servicio>", la fecha y hora de Chile y, si hay plazo, una banda destacada con la urgencia; el aviso fijo; y cuatro tarjetas blancas, cada una con su ícono: "Quién escribe", "Qué necesita" (la descripción), "Detalles del caso" (solo los datos que vienen con algo) y "Cómo responder", con el correo y el teléfono escritos y botones grandes. Los datos cortos van en dos columnas que en el celular pasan a una (celdas `inline-block` de ancho máximo; una regla en `<style>` las ensancha en el celular y, si el cliente de correo la descarta, se lee igual). Jerarquía de letra constante: título 25 px en negrita fuerte, títulos de tarjeta 20 px en negrita, datos y párrafos 18 px en peso normal, etiquetas 15 px en semi-negrita y un tono más suave, aviso 15 px y pie 13 px. La negrita es solo de los textos fijos: lo que escribió el visitante va siempre en peso normal. Los botones llevan letra clara sobre fondo oscuro para que se lean igual si el cliente de correo fuerza el modo oscuro.
- **Compatibilidad:** tablas y estilos en línea, 600 px de ancho máximo, fuentes del sistema, sin fuentes web y con una sola regla en `<style>` como mejora. Pensado para Gmail en computador y celular.
- **Logo:** `public/correo/nexus-logo.png`, que el correo carga desde `https://nexuschile.net/correo/nexus-logo.png` (Gmail no muestra SVG). Tiene fondo ceniza opaco para que se lea aunque el modo oscuro del cliente de correo cambie los colores del encabezado. Se regenera con `node scripts/correo-logo.mjs http://localhost:3000` (con el sitio abierto); solo hace falta si cambia el logo. **El archivo tiene que estar en producción antes o junto con el código del correo**: si no, el encabezado muestra el texto "NEXUS" en lugar de la imagen.
- **Íconos:** `public/correo/iconos/*.png`, que el correo carga desde `https://nexuschile.net/correo/iconos/`. Salen de Phosphor (peso fill, oro oscuro de la marca, 72 px para mostrarse a 24 o 18) con `node scripts/correo-iconos.mjs`; solo hace falta correrlo si se agrega o cambia un ícono, y los nombres deben coincidir con `ICONS` en `correo.ts`. Son fijos y decorativos: nunca dependen de lo que escribió el visitante, llevan `alt=""` y el correo se entiende igual si Gmail no muestra las imágenes. Igual que el logo, **tienen que estar en producción antes o junto con el código del correo**.
- **WhatsApp:** el botón aparece si el teléfono viene con `+` y código de país, o si es un celular chileno (9 dígitos que empiezan con 9). Con otro formato queda solo "Llamar".
- **Vistas previas:** `node scripts/correo-vistas.mjs [carpeta] [--base=<url>]` (necesita Node 22.18 o superior, porque lee los archivos TypeScript del proyecto directamente) genera cuatro casos (completo, mínimo, intento de inyección y suplantación de NEXUS) en HTML, texto plano y capturas a 600 y 375 px, más una captura con modo oscuro forzado. Comprueba que nada de lo escrito por el visitante llegue como HTML ni como enlace, que los enlaces disfrazados queden desactivados, que nada del visitante quede antes del aviso ni en negrita y qué correos se aceptan o rechazan; termina con error si algo falla. Conviene correrlo después de tocar `correo.ts` o `src/lib/contacto.ts`. Las vistas cargan el logo y los íconos desde `public/correo/` de este proyecto, para verlos antes de publicarlos; con `--base=https://nexuschile.net/correo` se ven como en el correo real, que siempre apunta a nexuschile.net.

### Abrir Servicios con una línea ya elegida

- Enlace: `#servicios?grupo=<línea>` (helper `serviceGroupHref(id)` en `src/data/nexus.ts`), con `evaluar`, `fortalecer` o `investigar`. Servicios selecciona el primer servicio de esa línea (pestaña en escritorio, acordeón en celular) y limpia el hash. Lo usa el submenú de la barra.

### Abrir el formulario con un servicio ya elegido

- Enlace: `#contacto?servicio=<id>` (helper `contactFormHref(id)` en `src/data/formulario.ts`). También sirve `?servicio=<id>#contacto`.
- Desde código: `openContactForm(id)` de `src/components/formulario/abrir.ts` (dispara el evento `nexus:contacto`).
- Ids: `auditoria`, `revision-propia`, `litigacion`, `controvertidas`, `investigacion`, `evaluacion`, `capacitacion`, `no-se`. Se aceptan además `prejudicial` (→ `evaluacion`) y `formacion` (→ `capacitacion`), los ids de las tarjetas de Servicios.

## CI

`.github/workflows/ci.yml` corre tipos, lint y build en cada PR y en `main`. Al crear el repositorio, Actions quedó apagado porque la cuota gratuita de la organización estaba casi agotada. Se enciende en Settings → Actions.

## Pendientes con el cliente

- Logo de NEXUS en SVG. La foto original de Domingo en alta resolución llegó el 17-11 (IMG_6028.JPG); falta decidir si reemplaza la de la portada.
- Que Domingo confirme las tres fotos de incendio del cierre de Perfil (`public/fotos/incendio-1..3.webp`): son fotos reales suyas, el lugar se reconoce y en una salen bomberos.
- Permiso para usar los logos de IAAI.
