// Idiomas del sitio. El español vive en `/` (sin cambiar las URLs de siempre); el inglés en `/en/` y el
// portugués en `/pt/`. El idioma sale siempre de la ruta, nunca del navegador: así el HTML prerenderizado
// y la hidratación coinciden, y nadie es redirigido sin pedirlo.

export const locales = ["es", "en", "pt"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/** Idiomas con prefijo en la ruta (`/en/`, `/pt/`). */
export const prefixedLocales = ["en", "pt"] as const satisfies readonly Locale[];

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const isPrefixedLocale = (v: string): v is (typeof prefixedLocales)[number] =>
  (prefixedLocales as readonly string[]).includes(v);

export type LocaleInfo = {
  /** `<html lang>` y `hreflang`. */
  htmlLang: string;
  /** `og:locale` de Open Graph. */
  ogLocale: string;
  /** Ruta de la página (con barra final: `trailingSlash` está activo). */
  path: string;
  /** Nombre del idioma en su propio idioma: así lo reconoce quien lo habla. */
  name: string;
};

export const localeInfo: Record<Locale, LocaleInfo> = {
  es: { htmlLang: "es-CL", ogLocale: "es_CL", path: "/", name: "Español" },
  en: { htmlLang: "en", ogLocale: "en_US", path: "/en/", name: "English" },
  pt: { htmlLang: "pt-BR", ogLocale: "pt_BR", path: "/pt/", name: "Português" },
};
