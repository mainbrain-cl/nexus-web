"use client";

import { useEffect, useSyncExternalStore } from "react";
import { content } from "@/data/nexus";
import { localeInfo, prefixedLocales, type Locale } from "@/data/idiomas";
import { Logo } from "./Logo";
import { Arrow } from "./Arrow";

/** Idioma de la ruta pedida: `/en/…` en inglés, `/pt/…` en portugués y el resto en español. */
function localeFromPath(): Locale {
  const first = window.location.pathname.split("/")[1];
  return (prefixedLocales as readonly string[]).includes(first) ? (first as Locale) : "es";
}

const noop = () => () => {};

/** Página 404: fondo de humo, título en la voz display y un solo botón de vuelta al inicio. */
export function NotFoundPage() {
  // En el servidor (HTML estático) va en español; al cargar toma el idioma de la ruta.
  const locale = useSyncExternalStore(noop, localeFromPath, () => "es" as Locale);
  const { notFound } = content[locale];
  const home = localeInfo[locale].path;

  useEffect(() => {
    document.documentElement.lang = localeInfo[locale].htmlLang;
  }, [locale]);

  return (
    <>
      {/* React lo sube al <head>: así el título cambia con el idioma. */}
      <title>{notFound.metaTitle}</title>
      <main className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ceniza">
        <div
          aria-hidden="true"
          className="absolute -inset-[4%] -z-20 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url(/hero/humo.webp)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 38% at 12% 104%, rgba(255,104,30,.26), transparent 70%), radial-gradient(55% 34% at 90% 106%, rgba(255,104,30,.22), transparent 70%), linear-gradient(180deg, rgba(18,15,13,.6), transparent 30%)",
          }}
        />

        <div className="mx-auto w-full max-w-[1440px] px-5 py-4 sm:px-8 sm:py-6 lg:px-[8.5vw] xl:px-[min(8.5vw,140px)]">
          <a href={home} className="inline-flex min-h-11 items-center rounded-md text-[1.65rem] sm:text-[2.1rem]" aria-label={`NEXUS, ${notFound.back}`}>
            <Logo />
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col items-start justify-center px-5 pb-24 sm:px-8 lg:px-12">
          <p className="font-name text-[1rem] font-extrabold tracking-[0.2em] text-oro [font-stretch:115%]">404</p>
          <h1 className="title-char mt-4 block max-w-[14ch] font-display text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.88] uppercase italic [font-kerning:none]">
            {notFound.title}
          </h1>
          <span aria-hidden="true" className="mt-8 block h-px w-[clamp(72px,8vw,120px)] bg-gradient-to-r from-oro-claro via-oro/60 to-transparent" />
          <p className="mt-6 max-w-[44ch] text-[1.1rem] leading-relaxed text-gris">{notFound.text}</p>
          <a href={home} className="btn btn-oro mt-10 h-14 px-9 text-[0.92rem]">
            {notFound.back}
            <Arrow className="btn-arrow size-4" />
          </a>
        </div>
      </main>
    </>
  );
}
