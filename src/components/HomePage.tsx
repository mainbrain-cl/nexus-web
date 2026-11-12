import type { Locale } from "@/data/idiomas";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Interseccion } from "@/components/sections/Interseccion";
import { Servicios } from "@/components/sections/Servicios";
import { Metodo } from "@/components/sections/Metodo";
import { Resultado } from "@/components/sections/Resultado";
import { Perfil } from "@/components/sections/Perfil";
import { Contacto } from "@/components/sections/Contacto";
import { Footer } from "@/components/sections/Footer";

/** La página completa en un idioma. La usan `/` (español), `/en/` y `/pt/`. */
export function HomePage({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <Navbar />
      <main id="contenido">
        <Hero />
        <Interseccion />
        <Servicios />
        <Metodo />
        <Resultado />
        <Perfil />
        <Contacto />
      </main>
      <Footer locale={locale} />
    </LocaleProvider>
  );
}
