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
  /** El mensaje sale una sola vez por carga: después de cerrarlo o de haberlo mostrado no se vuelve a programar. */
  const scheduled = useRef(false);

  // Visible fuera de la portada, de Contacto y del pie.
  useEffect(() => {
    const hero = document.getElementById("inicio");
    const contact = document.getElementById("contacto");
    const footer = document.querySelector("footer");
    if (!hero) return;
    const state = { hero: true, contact: false, footer: false };
    const update = () => setVisible(!state.hero && !state.contact && !state.footer);
    const heroIo = new IntersectionObserver(
      ([e]) => {
        state.hero = e.intersectionRatio > HERO_RATIO;
        update();
      },
      { threshold: [0, HERO_RATIO, 1] },
    );
    // Contacto y el pie cuentan desde que asoman por el cuarto inferior de la pantalla, donde va el asesor.
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
      setMessage(true);
    }, MESSAGE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [visible]);

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
    <div className="nx-asesor" data-on={visible}>
      {message && (
        <div className="nx-asesor-mensaje relative mb-1.5 w-[min(15rem,calc(100vw-6.25rem))] rounded-[1.25rem] rounded-br-[0.35rem] border border-oro/25 bg-humo/90 shadow-[0_18px_44px_-14px_rgba(0,0,0,.9),0_4px_14px_-6px_rgba(0,0,0,.6)] backdrop-blur-md sm:w-[19rem]">
          <a href={links.formulario} onClick={go} className="group block rounded-[inherit] py-3 pr-10 pl-4 sm:py-3.5 sm:pl-[1.125rem]">
            <span className="block text-[0.68rem] leading-[1.3] font-semibold tracking-[0.14em] text-oro-claro uppercase">{hero.name}</span>
            <span className="mt-1.5 block text-[0.86rem] leading-[1.45] text-hueso/90 sm:text-[0.92rem]">{advisor.message}</span>
            <span className="mt-2 inline-flex items-center gap-1.5 text-[0.8rem] leading-[1.3] font-semibold text-oro-claro">
              {advisor.cta}
              <Arrow className="size-[1em] transition-transform duration-500 group-hover:translate-x-0.5" />
            </span>
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label={advisor.close}
            className="absolute top-1 right-1 grid size-9 cursor-pointer place-items-center rounded-full text-hueso/60 transition-colors duration-300 hover:text-hueso"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-3.5">
              <path d="m4 4 12 12M16 4 4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      <a
        href={links.formulario}
        onClick={go}
        aria-label={advisor.label}
        className="nx-asesor-foto block shrink-0 rounded-full border-2 border-oro/70 bg-carbon shadow-[0_14px_34px_-10px_rgba(0,0,0,.95),0_4px_12px_-4px_rgba(0,0,0,.7)] transition-[translate,border-color,box-shadow] duration-500 hover:-translate-y-0.5 hover:border-oro-claro hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,.95),0_0_0_4px_rgba(201,162,107,.16)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
        <img
          src="/hero/domingo-avatar.webp"
          alt=""
          width={176}
          height={176}
          loading="lazy"
          decoding="async"
          className="size-12 rounded-full object-cover sm:size-14"
        />
      </a>
    </div>
  );
}
