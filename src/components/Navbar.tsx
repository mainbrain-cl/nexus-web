"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { contact, type Content } from "@/data/nexus";
import { useContent } from "./LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { Arrow } from "./Arrow";
import { useReduce } from "./ui/primitives";

const ease = [0.16, 1, 0.3, 1] as const;

const SUBMENU_ID = "menu-servicios";

/** Elementos que reciben el foco con Tab dentro de `root` y que se ven. */
function focusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
    (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("[inert]"),
  );
}

/** Flecha chica del botón con submenú: gira al abrirse. */
function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`size-3 text-hueso/60 transition-transform duration-300 ease-expo ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * "Servicios" en la barra de escritorio: botón de divulgación con las tres líneas de servicio.
 * Se abre al pasar el mouse (y se cierra al salir) o con clic y teclado (y entonces queda abierto hasta cerrarlo).
 * Escape o un clic fuera lo cierran; las flechas recorren las líneas; Tab sale y lo cierra.
 */
function ServicesMenu({
  label,
  groups,
  menuLabel,
  hovered,
  onHover,
}: {
  label: string;
  groups: Content["serviceGroups"];
  menuLabel: string;
  /** El puntero está sobre el botón: lleva la píldora de hover de la barra. */
  hovered: boolean;
  onHover: () => void;
}) {
  const reduce = useReduce();
  // `pinned`: abierto con clic o teclado. `hover`: abierto por el mouse encima.
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const open = pinned || hover;
  const wrapRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const leaveTimer = useRef<number | undefined>(undefined);

  const close = () => {
    window.clearTimeout(leaveTimer.current);
    setPinned(false);
    setHover(false);
  };

  // Clic fuera: cierra.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const focusItem = (i: number) => {
    const n = groups.length;
    items.current[((i % n) + n) % n]?.focus();
  };

  const onButtonKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    setPinned(true);
    const first = e.key === "ArrowDown" ? 0 : groups.length - 1;
    // El panel se monta en este mismo render: el foco va en el cuadro siguiente.
    requestAnimationFrame(() => focusItem(first));
  };

  const onMenuKey = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const i = items.current.findIndex((el) => el === document.activeElement);
    let next: number | null = null;
    if (e.key === "ArrowDown") next = i + 1;
    else if (e.key === "ArrowUp") next = i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = groups.length - 1;
    if (next === null) return;
    e.preventDefault();
    focusItem(next);
  };

  return (
    <li
      ref={wrapRef}
      className="relative"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        window.clearTimeout(leaveTimer.current);
        setHover(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        // Un respiro corto: cruzar en diagonal hacia el panel no lo cierra.
        leaveTimer.current = window.setTimeout(() => setHover(false), 160);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
          buttonRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // El foco salió del botón y del panel (Tab hacia afuera): se cierra. Un clic en el relleno del panel
        // también quita el foco, pero el puntero sigue encima: ese caso no cuenta.
        const wrap = wrapRef.current;
        if (!wrap || wrap.contains(e.relatedTarget as Node | null)) return;
        if (e.relatedTarget === null && wrap.matches(":hover")) return;
        close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={SUBMENU_ID}
        onMouseEnter={onHover}
        onFocus={onHover}
        onClick={() => {
          if (pinned) close();
          else setPinned(true);
        }}
        onKeyDown={onButtonKey}
        className="relative z-10 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2.5 text-[0.97rem] font-medium whitespace-nowrap text-hueso/90 transition-colors duration-300 hover:text-hueso xl:px-5"
      >
        {label}
        <Caret open={open} />
      </button>
      {hovered && <HoverPill />}

      <AnimatePresence>
        {open && (
          <motion.div
            id={SUBMENU_ID}
            className="absolute top-full left-0 z-20 pt-2.5"
            initial={reduce ? false : { opacity: 0, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease }}
          >
            <ul
              aria-label={menuLabel}
              onKeyDown={onMenuKey}
              className="w-[min(23rem,80vw)] rounded-[1.6rem] border border-hueso/[0.13] bg-ceniza/85 p-1.5 shadow-[inset_0_1px_0_rgba(244,238,230,.06),0_24px_48px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl"
            >
              {groups.map((g, i) => (
                <li key={g.id}>
                  <a
                    ref={(el) => {
                      items.current[i] = el;
                    }}
                    href={g.href}
                    onClick={close}
                    className="group block rounded-[1.2rem] px-4 py-3 transition-colors duration-300 hover:bg-hueso/[0.07] focus-visible:rounded-[1.2rem] focus-visible:bg-hueso/[0.07]"
                  >
                    <span className="flex items-center gap-2 text-[0.97rem] font-medium text-hueso">
                      {g.label}
                      <Arrow className="size-3.5 text-oro-claro opacity-0 transition-[opacity,transform] duration-300 ease-expo group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </span>
                    <span className="mt-1 block text-[0.84rem] leading-snug text-gris">{g.services.join(" · ")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function Navbar() {
  const { a11y, links, navLinks, navCta, serviceGroups } = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menú móvil abierto: la página no se desplaza, queda fuera del alcance del teclado y del lector de pantalla
  // (inert), y el foco da la vuelta dentro de la barra y el menú.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const behind = [...document.querySelectorAll<HTMLElement>("main, footer")];
    behind.forEach((el) => (el.inert = true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      const header = headerRef.current;
      if (e.key !== "Tab" || !header) return;
      const list = focusables(header);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !header.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !header.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      behind.forEach((el) => (el.inert = false));
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
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
            {navLinks.map((l) =>
              l.key === "servicios" ? (
                <ServicesMenu
                  key={l.href}
                  label={l.label}
                  groups={serviceGroups}
                  menuLabel={a11y.servicesMenu}
                  hovered={hovered === l.href}
                  onHover={() => setHovered(l.href)}
                />
              ) : (
                <li key={l.href} className="relative">
                  <a
                    href={l.href}
                    onMouseEnter={() => setHovered(l.href)}
                    onFocus={() => setHovered(l.href)}
                    className="relative z-10 block rounded-full px-3 py-2.5 whitespace-nowrap xl:px-5 text-[0.97rem] font-medium text-hueso/90 transition-colors duration-300 hover:text-hueso"
                  >
                    {l.label}
                  </a>
                  {hovered === l.href && <HoverPill />}
                </li>
              ),
            )}
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
            ref={toggleRef}
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
            className="fixed inset-0 z-0 flex flex-col overflow-y-auto overscroll-contain bg-ceniza px-6 pt-28 pb-10 lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            transition={{ duration: 0.75, ease }}
          >
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 h-1/2"
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
                    className="font-display block py-1 text-[clamp(2.6rem,7.6svh,3.6rem)] leading-[1.05] uppercase italic text-hueso"
                  >
                    {l.label}
                  </a>
                  {l.key === "servicios" && (
                    // Las tres líneas de servicio, bajo "Servicios": cada una abre su primer servicio.
                    <ul aria-label={a11y.servicesMenu} className="mt-1 mb-3 ml-1 flex flex-col border-l border-oro/30 pl-4">
                      {serviceGroups.map((g) => (
                        <li key={g.id}>
                          <a
                            href={g.href}
                            onClick={() => setOpen(false)}
                            className="flex min-h-11 items-center text-[1.05rem] font-medium text-hueso/80 transition-colors duration-300 hover:text-hueso"
                          >
                            {g.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="relative mt-auto flex flex-col gap-5 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.42, duration: 0.7, ease }}
            >
              <LanguageSwitcher variant="menu" />
              <a href={links.formulario} className="btn btn-oro h-14 w-full shrink-0 text-[0.95rem]" onClick={() => setOpen(false)}>
                {navCta}
                <Arrow className="btn-arrow size-4" />
              </a>
              <div className="flex flex-col text-[0.95rem] text-gris">
                <a href={links.email} className="inline-flex min-h-11 items-center self-start hover:text-hueso">
                  {contact.email}
                </a>
                <span className="flex items-center">
                  <a href={links.phone} className="inline-flex min-h-11 items-center hover:text-hueso">
                    {contact.phoneDisplay}
                  </a>
                  <span aria-hidden="true">&nbsp;·&nbsp;</span>
                  {contact.city}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Píldora translúcida que se desliza entre los enlaces de la barra al pasar el puntero. */
function HoverPill() {
  return (
    <motion.span
      layoutId="nav-hover"
      className="absolute inset-0 rounded-full border border-hueso/10 bg-hueso/[0.07]"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      aria-hidden="true"
    />
  );
}
