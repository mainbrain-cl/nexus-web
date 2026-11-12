"use client";

import { locales, localeInfo } from "@/data/idiomas";
import { useContent, useLocale } from "./LocaleProvider";
import { Flag } from "./Flag";

// Selector de idioma con banderas. Son enlaces comunes a `/`, `/en/` y `/pt/` (funcionan sin JS y los buscadores
// los siguen); al hacer clic se les agrega la sección que el visitante tiene en pantalla, para que llegue al mismo
// lugar en el otro idioma. Nunca se cambia de idioma solo, según el navegador.

/** Sección en pantalla, como hash. Conserva el hash completo (con `?servicio=`) si apunta a esa misma sección. */
function currentHash() {
  const sections = [...document.querySelectorAll<HTMLElement>("main section[id]")];
  const line = window.innerHeight * 0.35;
  let current = "";
  for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
  const hash = window.location.hash;
  const hashId = decodeURIComponent(hash.slice(1).split("?")[0]);
  if (current && hashId === current) return hash;
  // Arriba de todo (la hero) no hace falta hash.
  if (!current || current === sections[0]?.id) return "";
  return `#${current}`;
}

/**
 * `bar`: píldora de vidrio con las tres banderas, para la barra superior.
 * `menu`: tarjeta con bandera y nombre, para el menú móvil.
 */
export function LanguageSwitcher({ variant, className = "" }: { variant: "bar" | "menu"; className?: string }) {
  const locale = useLocale();
  const { languageLabel } = useContent();
  const bar = variant === "bar";

  return (
    <ul
      aria-label={languageLabel}
      className={`${
        bar
          ? "flex items-center gap-0.5 rounded-full border border-hueso/[0.13] bg-ceniza/45 p-[3px] shadow-[inset_0_1px_0_rgba(244,238,230,.06),0_8px_24px_-12px_rgba(0,0,0,.8)] backdrop-blur-md"
          : "grid grid-cols-3 gap-1.5 rounded-[1.5rem] border border-hueso/10 bg-hueso/[0.035] p-1.5 shadow-[inset_0_1px_0_rgba(244,238,230,.05)]"
      } ${className}`}
    >
      {locales.map((l) => {
        const info = localeInfo[l];
        const active = l === locale;
        return (
          <li key={l}>
            <a
              href={info.path}
              hrefLang={info.htmlLang}
              lang={info.htmlLang}
              title={bar ? info.name : undefined}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                if (active) {
                  e.preventDefault();
                  return;
                }
                e.currentTarget.href = info.path + currentHash();
              }}
              className={`group relative transition-colors duration-300 ${
                bar
                  ? // 44 px de toque; la bandera sigue del mismo tamaño.
                    "grid size-11 place-items-center rounded-full"
                  : "flex flex-col items-center gap-2 rounded-[1.1rem] px-2 py-3.5 text-[0.95rem] font-medium"
              } ${
                active
                  ? "bg-oro/[0.13] text-hueso ring-1 ring-oro/45 ring-inset"
                  : `${bar ? "" : "text-gris"} hover:bg-hueso/[0.07] hover:text-hueso`
              }`}
            >
              <span
                className={`relative block overflow-hidden rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,.5)] ring-1 ring-black/30 transition-[opacity,filter] duration-300 ${
                  bar ? "h-[14px] w-[21px]" : "h-[18px] w-[27px]"
                } ${active ? "" : "opacity-60 saturate-[.45] group-hover:opacity-100 group-hover:saturate-100"}`}
              >
                <Flag locale={l} className="block size-full" />
                {/* Brillo de vidrio sobre la tela */}
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/15" />
              </span>
              <span className={bar ? "sr-only" : ""}>{info.name}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
