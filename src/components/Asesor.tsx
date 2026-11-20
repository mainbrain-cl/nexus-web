"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useContent } from "@/components/LocaleProvider";
import { openContactForm } from "@/components/formulario/abrir";
import { Arrow } from "./Arrow";

// Asesor flotante (Aaron, 20-11): la foto de Domingo fija abajo a la derecha, como una burbuja de mensajería, con
// un mensaje que invita a contar el caso en el formulario. Es una ayuda, no otro botón principal: aparece recién
// cuando el visitante deja la portada y se retira cuando Contacto o el pie están en pantalla, porque ahí el
// formulario ya está a la vista y no debe tapar nada.

/** Marca de sesión: el mensaje ya se cerró (o se usó) en esta visita y no vuelve a salir. */
const DISMISSED_KEY = "nexus:asesor-mensaje";
/** Espera entre que aparece la foto y que sale el mensaje. */
const MESSAGE_DELAY_MS = 1500;
/** La portada cuenta como "en pantalla" mientras se vea más de esta fracción de ella. */
const HERO_RATIO = 0.4;
/** En celular el mensaje tapa parte del texto: se cierra solo pasado este tiempo o al bajar esta distancia. */
const NARROW_QUERY = "(max-width: 639.98px)";
const AUTO_CLOSE_MS = 10000;
const AUTO_CLOSE_SCROLL = 600;

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false; // sin almacenamiento (modo privado estricto): el mensaje sale en cada carga
  }
}

function rememberDismissed() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {}
}

export function Asesor() {
  const { advisor, hero, links } = useContent();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(false);
  /** El mensaje sale una sola vez por visita: después de cerrarlo o de haberlo mostrado no se vuelve a programar. */
  const scheduled = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Visible fuera de la portada, de Contacto y del pie.
  useEffect(() => {
    const hero = document.getElementById("inicio");
    const contact = document.getElementById("contacto");
    const footer = document.querySelector("footer");
    if (!hero) return;
    const state = { hero: true, contact: false, footer: false };
    const update = () => {
      const next = !state.hero && !state.contact && !state.footer;
      // Si se oculta con el foco dentro (teclado), el foco no debe quedar en un elemento invisible.
      const active = document.activeElement;
      if (!next && active instanceof HTMLElement && rootRef.current?.contains(active)) active.blur();
      setVisible(next);
    };
    const heroIo = new IntersectionObserver(
      ([e]) => {
        state.hero = e.intersectionRatio > HERO_RATIO;
        update();
      },
      { threshold: [0, HERO_RATIO, 1] },
    );
    // Contacto y el pie cuentan desde que superan el 12 % inferior de la pantalla, la franja donde va el asesor.
    const restIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === contact) state.contact = e.isIntersecting;
          else state.footer = e.isIntersecting;
        }
        update();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    heroIo.observe(hero);
    if (contact) restIo.observe(contact);
    if (footer) restIo.observe(footer);
    return () => {
      heroIo.disconnect();
      restIo.disconnect();
    };
  }, []);

  // El mensaje sale un momento después de la foto, la primera vez que esta se muestra.
  useEffect(() => {
    if (!visible || scheduled.current || wasDismissed()) return;
    const t = window.setTimeout(() => {
      scheduled.current = true;
      // Se marca al mostrarlo, no solo al cerrarlo: una vez por visita, aunque se recargue o se cambie de idioma.
      rememberDismissed();
      setMessage(true);
    }, MESSAGE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [visible]);

  // En celular el mensaje se retira solo: a los 10 s o cuando el visitante sigue leyendo (600 px de scroll).
  useEffect(() => {
    if (!message || !window.matchMedia(NARROW_QUERY).matches) return;
    const close = () => setMessage(false);
    const y0 = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - y0) > AUTO_CLOSE_SCROLL) close();
    };
    const t = window.setTimeout(close, AUTO_CLOSE_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [message]);

  const dismiss = () => {
    scheduled.current = true;
    setMessage(false);
    rememberDismissed();
  };

  // Lleva al formulario y deja el foco en su pregunta. Sin JS, el enlace igual llega a #contacto.
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    dismiss();
    openContactForm();
    document.querySelector<HTMLElement>("#contacto h3[tabindex='-1']")?.focus({ preventScroll: true });
  };

  return (
    <div ref={rootRef} className="nx-asesor" data-on={visible}>
      {message && (
        // Globo: en celular va sobre la foto, casi a todo el ancho, para que el mensaje quepa en dos líneas a
        // 16 px; desde 640 px va a su izquierda. El ancho está medido para esas dos líneas en es, en y pt.
        <div className="nx-asesor-mensaje relative w-[min(19rem,calc(100vw-2rem))] rounded-[1.4rem] rounded-br-[0.4rem] border border-oro/30 bg-humo/92 shadow-[0_22px_50px_-14px_rgba(0,0,0,.92),0_6px_16px_-6px_rgba(0,0,0,.6)] backdrop-blur-md sm:mb-2 sm:w-[20.5rem]">
          <a href={links.formulario} onClick={go} className="group block rounded-[inherit] px-4 pt-3.5 pb-4 sm:px-5 sm:pt-4 sm:pb-[1.125rem]">
            <span className="block pr-9 text-[0.7rem] leading-[1.3] font-semibold tracking-[0.14em] text-oro-claro uppercase">{hero.name}</span>
            <span className="mt-2 block text-[1rem] leading-[1.45] text-balance text-hueso/92 sm:text-[0.97rem]">{advisor.message}</span>
            {/* La acción, como botón chico: se lee como algo que se toca sin competir con el botón dorado de la barra. */}
            <span className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-oro/50 bg-oro/[0.14] px-4 text-[0.86rem] leading-none font-bold tracking-[0.01em] text-oro-claro transition-colors duration-300 group-hover:border-oro-claro group-hover:bg-oro/25">
              {advisor.cta}
              <Arrow className="size-[1em] transition-transform duration-500 group-hover:translate-x-0.5" />
            </span>
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label={advisor.close}
            className="absolute top-0 right-0 grid size-11 cursor-pointer place-items-center rounded-full text-hueso/60 transition-colors duration-300 hover:text-hueso sm:top-1 sm:right-1 sm:size-9"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-3.5">
              <path d="m4 4 12 12M16 4 4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      {/* Foto: 64 px en celular y 72 px desde 640 px, con borde dorado y un anillo dorado tenue por fuera. Todo
          estático: sin pulso ni punto de "en línea", porque detrás hay un formulario, no un chat en vivo. */}
      <a
        href={links.formulario}
        onClick={go}
        aria-label={advisor.label}
        className="nx-asesor-foto block shrink-0 rounded-full border-[2.5px] border-oro/80 bg-carbon shadow-[0_0_0_5px_rgba(201,162,107,.14),0_18px_40px_-10px_rgba(0,0,0,.95),0_6px_16px_-4px_rgba(0,0,0,.7)] transition-[translate,border-color,box-shadow] duration-500 hover:-translate-y-0.5 hover:border-oro-claro hover:shadow-[0_0_0_6px_rgba(201,162,107,.22),0_22px_46px_-10px_rgba(0,0,0,.95),0_6px_16px_-4px_rgba(0,0,0,.7)] sm:border-[3px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
        <img
          src="/hero/domingo-avatar.webp"
          alt=""
          width={176}
          height={176}
          loading="lazy"
          decoding="async"
          className="size-[3.6875rem] rounded-full object-cover sm:size-[4.125rem]"
        />
      </a>
    </div>
  );
}
