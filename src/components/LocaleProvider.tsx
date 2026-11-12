"use client";

import { createContext, useContext, type ReactNode } from "react";
import { content } from "@/data/nexus";
import type { Locale } from "@/data/idiomas";

// El idioma de la página llega desde la ruta (`/`, `/en/`, `/pt/`) y baja a los componentes por contexto.
// Nunca se lee del navegador: el HTML prerenderizado y el primer render del cliente deben coincidir.

const LocaleContext = createContext<Locale>("es");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export const useLocale = () => useContext(LocaleContext);

/** Textos y datos del sitio en el idioma de la página. */
export const useContent = () => content[useLocale()];
