import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Archivo, Barlow_Condensed, Schibsted_Grotesk } from "next/font/google";
import { content } from "@/data/nexus";
import { localeInfo, locales, type Locale } from "@/data/idiomas";
import { MotionProvider } from "@/components/MotionProvider";
import { Analytics } from "@/components/Analytics";
import "@/app/globals.css";

// Documento raíz compartido por los dos layouts raíz: `app/(es)` sirve `/` y `app/[lang]` sirve `/en/` y `/pt/`.
// Son dos layouts raíz porque `<html lang>` cambia con el idioma y el español conserva su URL sin prefijo.

const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["800"],
});

const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Nombre: grotesca ancha y pesada, recta, para que el nombre resalte.
const name = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

/** Variables de las tres fuentes, para `<html>`. También las usa la página 404 (`app/global-not-found.tsx`). */
export const fontVariables = `${display.variable} ${sans.variable} ${name.variable}`;

/** Código de verificación de Google Search Console para nexuschile.net. */
const GOOGLE_SITE_VERIFICATION = "FG0Y4qe5p0boU-OOT8d6rNcE--kvCPnxqJzjoyxBOWw";

export const viewport: Viewport = {
  themeColor: "#120f0d",
};

/** Título, descripción, Open Graph y versiones en otros idiomas (hreflang), con x-default en el español. */
export function buildMetadata(locale: Locale): Metadata {
  const { site, og } = content[locale];
  const info = localeInfo[locale];
  // Imagen al compartir: una por idioma, generada con scripts/og.mjs.
  const image = { url: og.image, width: og.width, height: og.height, alt: og.alt };
  return {
    metadataBase: new URL(site.url),
    title: site.title,
    description: site.description,
    alternates: {
      canonical: info.path,
      languages: {
        ...Object.fromEntries(locales.map((l) => [localeInfo[l].htmlLang, localeInfo[l].path])),
        "x-default": localeInfo.es.path,
      },
    },
    openGraph: {
      title: site.title,
      description: site.description,
      url: info.path,
      locale: info.ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeInfo[l].ogLocale),
      type: "website",
      siteName: site.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
      images: [image],
    },
    // Verificación de Google Search Console (etiqueta de la propiedad, entregada el 26-11; es un valor público).
    // La variable de entorno permite cambiarla sin tocar el código. Bing solo se emite si se define su variable.
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? GOOGLE_SITE_VERIFICATION,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
    },
  };
}

export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={localeInfo[locale].htmlLang} className={fontVariables}>
      <body>
        <a
          href="#contenido"
          className="sr-only rounded-full bg-oro px-5 py-3 font-semibold text-ceniza focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
        >
          {content[locale].a11y.skipLink}
        </a>
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
