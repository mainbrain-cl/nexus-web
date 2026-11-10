"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useInView } from "motion/react";
import { closing, contact, links } from "@/data/nexus";
import { Arrow } from "@/components/Arrow";
import { Embers } from "@/components/hero/Embers";
import { Container, Reveal, Section, useReduce } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { Rich } from "@/components/ui/Rich";

type Vars = CSSProperties & Record<`--${string}`, string>;

const CHAR_STEP = 0.05; // s entre letra y letra, como en la hero
const LINE_START = [0.1, 0.42];

/**
 * Una línea del título de cierre. Antes de entrar en pantalla (y sin JS) cada letra ya está carbonizada y se lee.
 * Al entrar, `lit` agrega la capa encendida y la clase de entrada de la carbonizada: como las animaciones CSS
 * arrancan al aplicarse la clase, la ignición ocurre justo cuando el visitante llega, no al cargar la página.
 * La textura se alinea a la línea completa midiendo cada letra, igual que en la hero.
 */
function ClosingLine({ text, start, lit }: { text: string; start: number; lit: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const chars = Array.from(text);

  useLayoutEffect(() => {
    const line = ref.current;
    if (!line) return;
    const align = () => {
      // Primero todas las lecturas y después todas las escrituras: intercalarlas recalculaba estilos por letra.
      const box = line.getBoundingClientRect();
      const els = [...line.querySelectorAll<HTMLElement>("[data-char]")];
      const lefts = els.map((el) => el.getBoundingClientRect().left);
      els.forEach((el, i) => {
        el.style.setProperty("--lw", `${box.width}px`);
        el.style.setProperty("--lx", `${box.left - lefts[i]}px`);
      });
    };
    align();
    const ro = new ResizeObserver(align);
    ro.observe(line);
    document.fonts?.ready.then(align);
    return () => ro.disconnect();
  }, []);

  return (
    <span ref={ref} className="relative block whitespace-pre">
      {chars.map((c, i) =>
        c === " " ? (
          " "
        ) : (
          <span key={i} className="relative inline-block">
            <span
              data-char
              className={`title-char -mx-[0.2em] -my-[0.16em] block px-[0.2em] py-[0.16em]`}
              style={{ "--d": `${start + i * CHAR_STEP + 0.2}s` } as Vars}
            >
              {c}
            </span>
            {lit && (
              <span className="title-hot absolute inset-0 block" style={{ "--d": `${start + i * CHAR_STEP}s` } as Vars}>
                {c}
              </span>
            )}
          </span>
        ),
      )}
    </span>
  );
}

/** Celda de canal: rótulo pequeño arriba y el dato abajo. Si hay enlace, toda la celda es el toque. */
function Channel({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <>
      {icon}
      <span className="flex min-w-0 flex-col gap-1 text-left">
        <span className="text-[0.74rem] font-semibold tracking-[0.18em] text-gris uppercase">{label}</span>
        <span
          className={`text-[1.05rem] leading-snug break-words text-hueso transition-colors duration-300 ${
            href ? "underline decoration-oro/0 decoration-1 underline-offset-[0.28em] group-hover:text-oro-claro group-hover:decoration-oro/60" : ""
          }`}
        >
          {value}
        </span>
      </span>
    </>
  );
  const cell = "group flex min-h-[4.5rem] items-center gap-4 px-1 py-5 sm:justify-center sm:px-6";
  return href ? (
    // El foco global es una píldora; en esta celda ancha se ajusta a un rectángulo suave.
    <a href={href} className={`${cell} focus-visible:rounded-md`}>
      {body}
    </a>
  ) : (
    <div className={cell}>{body}</div>
  );
}

export function Contacto() {
  const reduce = useReduce();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inView = useInView(titleRef, { once: true, amount: 0.6 });
  const lit = inView && !reduce;

  return (
    <Section id="contacto" tone="ceniza" labelledBy="contacto-title" className="pb-[clamp(4.5rem,9vw,7.5rem)]">
      {/* Resplandor de brasas al ras del suelo: gradientes fijos, sin animación */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(55% 34% at 14% 104%, rgba(255,104,30,.20), transparent 70%), radial-gradient(50% 30% at 88% 106%, rgba(255,104,30,.17), transparent 70%), radial-gradient(70% 26% at 50% 110%, rgba(255,120,40,.12), transparent 70%), radial-gradient(60% 40% at 50% 18%, rgba(201,162,107,.05), transparent 70%), radial-gradient(45% 32% at 50% 30%, rgba(18,15,13,.55), transparent 70%)",
        }}
      />
      {/* Brasas lejanas: se pausan solas fuera de pantalla y con la pestaña oculta */}
      {/* Solo la mitad inferior: las brasas nacen abajo y un canvas de sección completa se limpiaba entero en cada cuadro */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 bottom-0 -z-10 opacity-70">
        <Embers layer="back" className="size-full" />
      </div>

      <Container className="flex flex-col items-center text-center">
        <h2
          ref={titleRef}
          id="contacto-title"
          className="font-display text-[clamp(3.4rem,10vw,9rem)] leading-[0.86] uppercase italic [font-kerning:none]"
          style={{ opacity: 0.92 }}
        >
          <span className="sr-only">{closing.title.join(" ")}</span>
          <span aria-hidden="true" className="block">
            {closing.title.map((line, i) => (
              <ClosingLine key={line} text={line} start={LINE_START[i] ?? 0} lit={lit} />
            ))}
          </span>
        </h2>

        <Reveal delay={0.15} className="mt-[clamp(1.8rem,3.5vw,2.6rem)] max-w-[52ch]">
          <p className="text-[1.1rem] leading-relaxed [text-wrap:balance] text-hueso/85 sm:text-[1.15rem]">
            <Rich text={closing.text} />
          </p>
        </Reveal>

        <Reveal delay={0.25} className="mt-9 w-full sm:w-auto">
          <a
            href={links.asesoria}
            target="_blank"
            rel="noopener"
            className="btn btn-oro h-[3.6rem] w-full px-10 text-[0.95rem] sm:h-16 sm:w-auto sm:min-w-[21rem] sm:text-[1.02rem]"
          >
            {closing.whatsappLabel}
            <Arrow className="btn-arrow size-[1.1em]" />
          </a>
        </Reveal>

        {/* Alternativas: correo, teléfono y la base, separadas por hilos */}
        <Reveal delay={0.35} className="mt-12 w-full max-w-[1060px]">
          <div className="grid border-y border-hueso/10 sm:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)] sm:divide-x sm:divide-hueso/10 max-sm:divide-y max-sm:divide-hueso/10">
            <Channel icon={<Icon name="correo" mode="static" badge className="size-10" />} label={closing.emailLabel} value={contact.email} href={links.email} />
            <Channel icon={<Icon name="telefono" mode="static" badge className="size-10" />} label={closing.phoneLabel} value={contact.phoneDisplay} href={links.phone} />
            <Channel icon={<Icon name="base" mode="static" badge className="size-10" />} label={closing.cityLabel} value={contact.city} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
