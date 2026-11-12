"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { contact } from "@/data/nexus";
import { useContent } from "./LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { Arrow } from "./Arrow";

const ease = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const { a11y, links, navLinks, navCta } = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`absolute inset-0 -z-10 transition-[opacity,backdrop-filter] duration-700 ${
          scrolled && !open ? "opacity-100 backdrop-blur-xl" : "opacity-0"
        }`}
        style={{ background: "linear-gradient(180deg, rgba(18,15,13,.92), rgba(18,15,13,.72))" }}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-oro/30 to-transparent transition-opacity duration-700 ${
          scrolled && !open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      <nav
        aria-label={a11y.mainNav}
        className={`in-nav relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 transition-[padding] duration-700 sm:px-8 lg:px-[8.5vw] xl:px-[min(8.5vw,140px)] ${
          scrolled ? "py-3" : "py-4 sm:py-6"
        }`}
      >
        <a href="#inicio" className="relative z-10 rounded-md text-[1.65rem] sm:text-[2.1rem]" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        {/* Entre 1024 y 1279 px los márgenes internos se acortan para que entren las banderas sin apretar el botón */}
        <div className="hidden items-center gap-3.5 lg:flex xl:gap-7">
          <ul className="flex items-center" onMouseLeave={() => setHovered(null)}>
            {navLinks.map((l) => (
              <li key={l.href} className="relative">
                <a
                  href={l.href}
                  onMouseEnter={() => setHovered(l.href)}
                  onFocus={() => setHovered(l.href)}
                  className="relative z-10 block rounded-full px-3 py-2.5 whitespace-nowrap xl:px-5 text-[0.97rem] font-medium text-hueso/90 transition-colors duration-300 hover:text-hueso"
                >
                  {l.label}
                </a>
                {hovered === l.href && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 rounded-full border border-hueso/10 bg-hueso/[0.07]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ul>
          <LanguageSwitcher variant="bar" />
          <a href={links.formulario} className="btn btn-oro h-12 px-5 text-[0.9rem] tracking-[0.02em] whitespace-nowrap normal-case xl:px-7">
            {navCta}
            <Arrow className="btn-arrow size-4" />
          </a>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 lg:hidden">
        {/* En el celular las banderas quedan en la barra; con el menú abierto se esconden, porque el menú trae las suyas */}
        <LanguageSwitcher
          variant="bar"
          className={`transition-opacity duration-300 max-[359px]:hidden ${open ? "invisible opacity-0" : ""}`}
        />
        <button
          type="button"
          className="relative flex size-12 items-center justify-center rounded-full border border-hueso/20 bg-ceniza/40 backdrop-blur-md"
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? a11y.closeMenu : a11y.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 h-[1.5px] w-5 bg-hueso transition-transform duration-500 [transition-timing-function:var(--ease-expo)] ${
                open ? "top-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 h-[1.5px] bg-hueso transition-all duration-500 [transition-timing-function:var(--ease-expo)] ${
                open ? "top-1/2 w-5 -rotate-45" : "top-full w-3"
              }`}
            />
          </span>
        </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            className="fixed inset-0 z-0 flex flex-col bg-ceniza px-6 pt-28 pb-10 lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            transition={{ duration: 0.75, ease }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
              style={{ background: "radial-gradient(80% 70% at 50% 110%, rgba(255,110,30,.22), transparent 70%)" }}
              aria-hidden="true"
            />
            <ul className="relative flex flex-col gap-1">
              {navLinks.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.7, ease }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display block py-1 text-[3.6rem] leading-[1.05] uppercase italic text-hueso"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="relative mt-auto flex flex-col gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.42, duration: 0.7, ease }}
            >
              <LanguageSwitcher variant="menu" />
              <a href={links.formulario} className="btn btn-oro h-14 w-full text-[0.95rem]" onClick={() => setOpen(false)}>
                {navCta}
                <Arrow className="btn-arrow size-4" />
              </a>
              <div className="flex flex-col gap-1 text-[0.95rem] text-gris">
                <a href={links.email} className="hover:text-hueso">
                  {contact.email}
                </a>
                <span>
                  {contact.phoneDisplay} · {contact.city}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
