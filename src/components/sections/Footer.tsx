import { contact, content } from "@/data/nexus";
import type { Locale } from "@/data/idiomas";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/ui/primitives";

const linkClass =
  "inline-flex min-h-11 items-center text-[1rem] text-gris transition-colors duration-300 hover:text-hueso focus-visible:text-hueso";

export function Footer({ locale }: { locale: Locale }) {
  const { a11y, footer, links, navLinks, site } = content[locale];
  // El sitio es un export estático: el año queda fijado al compilar, que es cuando se publica.
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-ceniza">
      {/* El hilo dorado tenue que cierra la página */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-oro/35 to-transparent" />

      <Container className="pt-[clamp(3.5rem,7vw,5.5rem)] pb-10">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] md:gap-10 lg:gap-16">
          <div>
            <a href="#inicio" className="inline-flex min-h-11 items-center" aria-label={`${site.name}, ${a11y.backHome}`}>
              <Logo className="text-[2rem]" />
            </a>
            <p className="mt-5 max-w-[34ch] text-[1.05rem] leading-relaxed text-hueso/90">{site.tagline}</p>
            <p className="mt-3 text-[0.8rem] font-semibold tracking-[0.18em] text-oro uppercase [text-wrap:balance] max-sm:tracking-[0.12em]">{footer.motto}</p>
          </div>

          <nav aria-label={a11y.footerNav}>
            <ul className="grid grid-cols-2 gap-x-6 md:flex md:flex-col">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <address aria-label={a11y.footerContact} className="flex flex-col not-italic">
            <a href={links.email} className={`${linkClass} break-all`}>
              {contact.email}
            </a>
            <a href={links.phone} className={linkClass}>
              {contact.phoneDisplay}
            </a>
            <span className="inline-flex min-h-11 items-center text-[1rem] text-gris">{contact.city}</span>
          </address>
        </div>

        <div className="mt-14 border-t border-hueso/[0.07] pt-7">
          <p className="text-[0.88rem] leading-relaxed text-gris/80">
            © {year} {site.name} · {footer.legal}
          </p>
        </div>
      </Container>
    </footer>
  );
}
