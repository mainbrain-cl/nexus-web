import type { MetadataRoute } from "next";
import { content } from "@/data/nexus";
import { localeInfo, locales } from "@/data/idiomas";

// /sitemap.xml. Una entrada por idioma, cada una con sus versiones en los otros idiomas (los mismos hreflang
// que lleva la página, con x-default en el español). Al agregar una página nueva, se suma a `pages`.
// No lleva fecha de modificación: una fecha que cambia en cada despliegue sin que cambie el contenido
// hace que los buscadores dejen de confiar en ella.

/** Rutas del sitio en español, sin prefijo de idioma. Hoy solo existe la portada. */
const pages = ["/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = content.es.site.url;
  // `/` en español; `/en/` y `/pt/` en los otros idiomas. Las rutas llevan barra final (`trailingSlash`).
  const url = (locale: (typeof locales)[number], page: string) => `${base}${localeInfo[locale].path}${page.slice(1)}`;

  return pages.flatMap((page) => {
    const languages = {
      ...Object.fromEntries(locales.map((l) => [localeInfo[l].htmlLang, url(l, page)])),
      "x-default": url("es", page),
    };
    return locales.map((locale) => ({ url: url(locale, page), alternates: { languages } }));
  });
}
