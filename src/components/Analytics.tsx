import Script from "next/script";

// Etiqueta de Google (Google Analytics 4), tal como la entrega Google para este sitio (26-11): el contenedor
// GTM-WVZK9LCV ya trae configurada la propiedad de Analytics y la medición mejorada (páginas vistas, scroll,
// clics de salida, formularios y descargas), así que aquí no va ningún `gtag('config', …)`.
// `NEXT_PUBLIC_GOOGLE_TAG_ID` permite cambiar el contenedor sin tocar el código.
const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? "GTM-WVZK9LCV";

/** Carga la etiqueta de Google después de que la página ya es interactiva. En desarrollo no se carga: no se miden las pruebas. */
export function Analytics() {
  if (process.env.NODE_ENV !== "production" || !GOOGLE_TAG_ID) return null;
  return (
    <>
      <Script id="google-tag-init">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`} />
    </>
  );
}
