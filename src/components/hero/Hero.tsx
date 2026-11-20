"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useReduce } from "@/components/ui/primitives";
import { useContent } from "@/components/LocaleProvider";
import { Arrow } from "../Arrow";
import { Embers } from "./Embers";
import { RotatingTag } from "./RotatingTag";
import { SmokeGL } from "./SmokeGL";

// Entrada comprimida (revisión general, 12-11): título, nombre, frases y botones quedan en pantalla antes de ~1,5 s.
// Los demás tiempos están en globals.css.
// El paso entre letras bajó de 0,04 a 0,032 s con el título nuevo (20-11): la línea más larga tiene 17 letras
// y así termina de encenderse a la misma hora que la anterior.
const CHAR_STEP = 0.032; // s entre letra y letra al encenderse
const LINE_START = [0.15, 0.38];

type Vars = CSSProperties & Record<`--${string}`, string>;

/**
 * Lleva un desplazamiento al píxel físico de la pantalla más cercano.
 * Mover una capa en fracciones de píxel obliga al navegador a volver a dibujarla entera en cada cuadro;
 * medido en una pantalla 2x a 120 Hz, el parallax pasaba de ~190 % a ~105 % de CPU (quieto: ~82 %).
 * El salto es de medio píxel en pantallas 2x, imposible de ver en un movimiento con resorte.
 */
function snap(v: number) {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.round(v * dpr) / dpr;
}

/**
 * Velocidad de scroll que comparten el título y el texto: van uno sobre el otro en la misma columna y con
 * velocidades distintas se cruzarían al bajar.
 */
const SCROLL_COLUMNA = 0.14;

/** Desplazamiento de una capa: profundidad ante el mouse + velocidad propia ante el scroll. */
function useLayer(
  px: MotionValue<number>,
  py: MotionValue<number>,
  scrollY: MotionValue<number>,
  depth: number,
  scrollK: number,
) {
  const x = useTransform(px, (v) => snap(v * -depth));
  const y = useTransform([py, scrollY], ([a, b]: number[]) => snap(a * -depth * 0.6 + b * scrollK));
  return { x, y };
}

/**
 * Una línea del título. Cada letra tiene dos capas: la encendida (naranja, se apaga) y la carbonizada
 * (textura de ceniza), que aparece recién cuando su letra se enciende. La textura se alinea a la línea
 * completa midiendo la posición de cada letra, para que se vea continua y no reinicie letra por letra.
 * Cada letra carbonizada lleva relleno con margen negativo: la cursiva sobresale de su caja y el fondo
 * recortado al texto solo se pinta dentro de la caja; sin ese margen, las astas quedaban cortadas.
 */
function TitleLine({ text, start }: { text: string; start: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const chars = Array.from(text);

  useLayoutEffect(() => {
    const line = ref.current;
    if (!line) return;
    const align = () => {
      const box = line.getBoundingClientRect();
      line.querySelectorAll<HTMLElement>("[data-char]").forEach((el) => {
        // Se mide la caja ampliada de cada letra (con su relleno) contra la línea completa.
        const r = el.getBoundingClientRect();
        el.style.setProperty("--lw", `${box.width}px`);
        el.style.setProperty("--lx", `${box.left - r.left}px`);
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
            <span data-char className="title-char char-in -mx-[0.2em] -my-[0.16em] block px-[0.2em] py-[0.16em]" style={{ "--d": `${start + i * CHAR_STEP + 0.2}s` } as Vars}>
              {c}
            </span>
            <span className="title-hot absolute inset-0 block" style={{ "--d": `${start + i * CHAR_STEP}s` } as Vars}>
              {c}
            </span>
          </span>
        ),
      )}
    </span>
  );
}

export function Hero() {
  const { hero, links, profile } = useContent();
  const reduce = useReduce();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 50, damping: 18, mass: 0.7 });
  const py = useSpring(my, { stiffness: 50, damping: 18, mass: 0.7 });

  const k = reduce ? 0 : 1;
  const bg = useLayer(px, py, scrollY, 8 * k, 0.5 * k);
  const smoke = useLayer(px, py, scrollY, 14 * k, 0.42 * k);
  const back = useLayer(px, py, scrollY, 20 * k, 0.36 * k);
  const title = useLayer(px, py, scrollY, 16 * k, SCROLL_COLUMNA * k);
  const front = useLayer(px, py, scrollY, 54 * k, -0.18 * k);
  const content = useLayer(px, py, scrollY, 6 * k, SCROLL_COLUMNA * k);
  // La tarjeta de Domingo flota en su propio plano: más cerca que el texto ante el mouse y un poco más rápida
  // que la página al bajar. La profundidad es corta a propósito, para que nunca alcance los botones.
  const card = useLayer(px, py, scrollY, 22 * k, -0.06 * k);

  // Largo de la línea más larga del título: con él, el CSS calcula el tamaño para que quepa en cada idioma.
  const titleChars = Math.max(...hero.titleLines.map((line) => Array.from(line).length));

  const titleOpacity = useTransform(scrollY, [0, 520], [1, reduce ? 1 : 0.15]);
  const contentOpacity = useTransform(scrollY, [0, 360], [1, reduce ? 1 : 0]);
  // La tarjeta de Domingo deja de recibir clics cuando ya se desvaneció con el scroll.
  const cardPointer = useTransform(contentOpacity, (v) => (v < 0.05 ? "none" : "auto"));

  useEffect(() => {
    if (reduce) return;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const onMove = (e: PointerEvent) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }
    // Sin mouse (celular): las capas respiran solas con un vaivén lento para no perder la profundidad.
    // Empieza recién cuando termina la entrada y crece de a poco, centrado en cero, para que el título
    // aparezca centrado y no parezca que se va acomodando.
    // Se detiene cuando la hero sale de pantalla o la pestaña queda oculta: antes corría para siempre.
    let raf = 0;
    let running = false;
    let visible = true;
    // El reloj del vaivén se detiene durante la pausa, para que al volver siga donde quedó y no salte.
    let t0 = performance.now();
    let pausedAt = 0;
    const START = 2.6;
    const RAMP = 3;
    const drift = (now: number) => {
      const t = (now - t0) / 1000 - START;
      if (t > 0) {
        const k = Math.min(1, t / RAMP);
        const amp = k * k * (3 - 2 * k);
        mx.set(Math.sin(t * 0.35) * 0.22 * amp);
        my.set(Math.sin(t * 0.27) * 0.16 * amp);
      }
      raf = requestAnimationFrame(drift);
    };
    const play = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      if (pausedAt) t0 += performance.now() - pausedAt;
      pausedAt = 0;
      raf = requestAnimationFrame(drift);
    };
    const pause = () => {
      if (running) pausedAt = performance.now();
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else pause();
    });
    if (sectionRef.current) io.observe(sectionRef.current);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    play();
    return () => {
      pause();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce, mx, my]);

  return (
    // Portada sin retrato (pedido de Domingo, 20-11): el título es el protagonista y la foto queda para Perfil.
    // Una sola columna centrada en todos los anchos: título, etiqueta, nombre, hilo, frases y botones, sobre el
    // humo, las brasas y el resplandor. Los sellos van en la misma columna, justo sobre el título, en celular y
    // tablet, y abajo a la izquierda desde 1024 px. En pantallas de poco alto la columna se compacta (globals.css).
    // Domingo sí está, pero sin protagonismo (Aaron, 20-11): una tarjeta chica abajo a la derecha, solo desde 1024 px.
    // El relleno superior es el alto de la barra fija (80 px en celular, 96 px desde sm).
    <section
      ref={sectionRef}
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ceniza pt-20 sm:pt-24 lg:h-[100svh] lg:min-h-[660px]"
    >
      {/* 1 · Fondo fotográfico de humo */}
      <motion.div className="absolute -inset-[4%] -z-50" style={bg}>
        <div
          className="in-bg absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero/humo.webp)", transform: "scale(1.04)" }}
        />
      </motion.div>

      {/* Resplandor de brasas al ras del suelo */}
      <div
        className="in-glow pointer-events-none absolute inset-0 -z-40"
        style={{
          background:
            "radial-gradient(60% 38% at 12% 104%, rgba(255,104,30,.30), transparent 70%), radial-gradient(55% 34% at 90% 106%, rgba(255,104,30,.26), transparent 70%), radial-gradient(70% 30% at 50% 110%, rgba(255,120,40,.16), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* 2 · Humo vivo */}
      <motion.div className="pointer-events-none absolute -inset-[3%] -z-30 will-change-transform" style={smoke}>
        <SmokeGL className="in-bg size-full" />
      </motion.div>

      {/* 3 · Brasas lejanas */}
      <motion.div className="pointer-events-none absolute inset-0 -z-20 will-change-transform" style={back}>
        <Embers layer="back" burstDelay={reduce ? undefined : 300} className="size-full" />
      </motion.div>

      {/* Columna central: ocupa el alto que queda bajo la barra y centra el conjunto. No lleva posición ni z-index
          propios, para que el título (detrás de las brasas) y el texto (delante) sigan en el apilado de la sección. */}
      <div className="nx-hero-columna flex flex-1 flex-col items-center justify-center px-3 pt-[clamp(0.5rem,2svh,1.5rem)] pb-[clamp(1.5rem,6svh,4.5rem)] sm:px-5 lg:pb-[clamp(3.5rem,11svh,7rem)]">
        {/* Sellos IAAI (Aaron, 10-11). Hasta 1023 px abren la columna, pegados al título, para que todo se lea
            como un solo grupo. Desde 1024 px salen del flujo: abajo a la izquierda, alineados con el logo. */}
        <div className="nx-hero-sellos-caja pointer-events-none relative z-20 mb-[clamp(0.9rem,2.6svh,1.75rem)] lg:absolute lg:inset-x-0 lg:bottom-[max(2.4rem,5.5svh)] lg:mb-0">
          <ul
            aria-label={hero.sealsLabel}
            className="nx-hero-sellos in-cta mx-auto flex max-w-[1440px] items-center justify-center px-5 sm:px-8 lg:justify-start lg:px-[8.5vw] xl:px-[min(8.5vw,140px)]"
            style={{ "--d": "1.3s" } as Vars}
          >
            {profile.seals.map((seal, i) => (
              <li key={seal.name} className={i > 0 ? "-ml-1.5 lg:-ml-2" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
                <img
                  src={seal.logo}
                  alt={seal.name}
                  width={320}
                  height={320}
                  decoding="async"
                  className="size-9 rounded-full shadow-[0_6px_18px_-6px_rgba(0,0,0,.85)] ring-2 ring-ceniza sm:size-10 lg:size-11 xl:size-14"
                />
              </li>
            ))}
          </ul>
        </div>

        {/* 4 · Título que se enciende y queda carbonizado, con la luz del fuego detrás */}
        <motion.div
          className="pointer-events-none relative -z-10 flex justify-center will-change-transform"
          style={{ ...title, opacity: titleOpacity }}
        >
          <div className="nx-hero-halo in-halo" aria-hidden="true" />
          <h1
            id="hero-title"
            className="nx-hero-titulo font-display text-center leading-[0.86] uppercase italic [font-kerning:none]"
            style={{ opacity: 0.9, "--nx-letras": String(titleChars) } as Vars}
          >
            <span className="sr-only">{hero.titleLines.join(" ")}</span>
            <span aria-hidden="true" className="block">
              {hero.titleLines.map((line, i) => (
                <TitleLine key={line} text={line} start={LINE_START[i]} />
              ))}
            </span>
          </h1>
        </motion.div>

        {/* 5 · Etiqueta, nombre, frase y acciones */}
        <motion.div
          className="nx-hero-cuerpo relative z-20 mt-[clamp(1.6rem,4.6svh,3.4rem)] flex w-full flex-col items-center text-center"
          style={{ ...content, opacity: contentOpacity }}
        >
          <RotatingTag items={hero.tags} className="nx-hero-tag mb-4 sm:mb-5" />
          <p className="nx-hero-nombre font-name text-[min(1.9rem,6.4vw)] leading-[1] font-extrabold tracking-[0.01em] text-hueso uppercase [font-stretch:115%] [text-shadow:0_2px_28px_rgba(0,0,0,.6)] sm:text-[clamp(1.9rem,3.6vw,3.7rem)] lg:text-[clamp(1.9rem,min(3.2vw,5.6svh),3.4rem)]">
            <span className="sr-only">{hero.name}</span>
            <span aria-hidden="true">
              {/* El relleno superior deja ver la tilde de GAMÉ al final, y la máscara la oculta al inicio */}
              <span className="-mt-[0.22em] inline-block overflow-hidden px-[0.04em] pt-[0.22em] pb-[0.1em] align-bottom">
                <span className="in-word inline-block" style={{ "--d": "0.85s" } as Vars}>
                  {hero.firstName}
                </span>
              </span>{" "}
              <span className="-mt-[0.22em] inline-block overflow-hidden px-[0.04em] pt-[0.22em] pb-[0.1em] align-bottom">
                <span className="in-word inline-block text-oro-claro" style={{ "--d": "0.95s" } as Vars}>
                  {hero.lastName}
                </span>
              </span>
            </span>
          </p>
          <span className="nx-hero-hilo in-rule mt-[clamp(0.8rem,1.8svh,1.3rem)] block h-px w-[clamp(72px,7vw,120px)] origin-center bg-gradient-to-r from-transparent via-oro-claro to-transparent" aria-hidden="true" />
          {/* Las dos frases: una por línea hasta 1023 px; desde 1024 px (y en celular horizontal, por falta de
              alto), en una sola línea con un punto medio. */}
          <p className="nx-hero-frase in-role mt-[clamp(0.8rem,1.8svh,1.3rem)] text-[clamp(0.78rem,4vw,1.06rem)] leading-[1.45] font-normal tracking-[0.005em] text-balance text-hueso/85 [text-shadow:0_1px_14px_rgba(0,0,0,.6)] lg:text-[clamp(1.02rem,1.3vw,1.28rem)]">
            <span className="block lg:inline">{hero.roleLines[0]}</span>
            <span className="hidden text-oro-claro/80 lg:inline" aria-hidden="true">
              {" · "}
            </span>
            <span className="block lg:inline">{hero.roleLines[1]}</span>
          </p>
          {/* Bajo 360 px los botones llevan letra y relleno algo menores: en inglés y portugués se partían en dos líneas. */}
          <div className="nx-hero-botones mt-[clamp(1.3rem,3.4svh,2.6rem)] flex w-full max-w-[340px] flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-[clamp(1rem,3vw,3.2rem)] lg:mt-[clamp(1.5rem,4.4svh,2.8rem)]">
            <a
              href={links.formulario}
              className="in-cta btn btn-oro h-[3.3rem] px-9 text-[0.92rem] max-[360px]:px-5 max-[360px]:text-[0.85rem] sm:h-[clamp(3.4rem,6.4svh,3.9rem)] sm:min-w-[19rem] sm:text-[clamp(0.9rem,1vw,1.05rem)]"
              style={{ "--d": "1.1s" } as Vars}
            >
              {hero.primaryCta}
              <Arrow className="btn-arrow size-[1.1em]" />
            </a>
            <a
              href="#servicios"
              className="in-cta btn btn-linea h-[3.3rem] px-9 text-[0.92rem] max-[360px]:px-5 max-[360px]:text-[0.85rem] sm:h-[clamp(3.4rem,6.4svh,3.9rem)] sm:min-w-[15rem] sm:text-[clamp(0.9rem,1vw,1.05rem)]"
              style={{ "--d": "1.18s" } as Vars}
            >
              {hero.secondaryCta}
            </a>
          </div>
        </motion.div>
      </div>

      {/* 6 · Brasas cercanas, desenfocadas, por delante de todo */}
      <motion.div className="pointer-events-none absolute inset-0 z-10 will-change-transform" style={front}>
        <Embers layer="front" burstDelay={reduce ? undefined : 1100} className="size-full" />
      </motion.div>

      {/* Sombra superior para leer la barra y fundido inferior hacia la sección que sigue */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(0deg, rgba(18,15,13,.9) 0%, rgba(18,15,13,.4) 14%, rgba(18,15,13,0) 34%), linear-gradient(180deg, rgba(18,15,13,.7), transparent 16%)",
        }}
        aria-hidden="true"
      />

      {/* 7 · Tarjeta de Domingo (solo desde 1024 px): contrapeso de los sellos, a su misma altura y con sus mismos
          márgenes. Toda la tarjeta es un enlace a Perfil. Entra al final, después de los botones, y se desvanece
          con el scroll como el resto del texto. La capa de fuera lleva la opacidad del scroll y su parallax propio,
          y la de dentro la animación de entrada, porque una animación CSS con relleno pisa la opacidad en línea.
          Flota: sombra honda en dos capas, un filo de luz arriba y, al pasar el mouse, sube 3 px (con `translate`,
          que no choca con el `transform` de la entrada). Sin pulsos ni parpadeos.
          Con menos de 860 px de alto no cabe bajo los botones: pasa a su forma compacta (foto y enlace), que
          cabe a su derecha como los sellos a su izquierda; si tampoco hay ancho para eso, se oculta (globals.css). */}
      <motion.div
        className="nx-hero-tarjeta pointer-events-none absolute inset-x-0 bottom-[max(2.4rem,5.5svh)] z-20 hidden will-change-transform lg:block"
        style={{ ...card, opacity: contentOpacity }}
      >
        <div className="nx-hero-tarjeta-fila mx-auto flex max-w-[1440px] translate-y-[10px] justify-end px-[8.5vw] xl:translate-y-[4px] xl:px-[min(8.5vw,140px)]">
          <motion.a
            href="#perfil"
            className="group in-cta flex items-center gap-3 rounded-full border border-oro/35 bg-carbon/75 py-1.5 pr-6 pl-1.5 text-left shadow-[0_22px_48px_-14px_rgba(0,0,0,.95),0_6px_16px_-6px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,240,210,.1)] backdrop-blur-md transition-[translate,border-color,background-color,box-shadow] duration-500 hover:-translate-y-[3px] hover:border-oro/65 hover:bg-carbon/90 hover:shadow-[0_30px_60px_-16px_rgba(0,0,0,.95),0_10px_22px_-8px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,240,210,.14)]"
            style={{ "--d": "1.4s", pointerEvents: cardPointer } as unknown as Vars}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
            <img
              src="/hero/domingo-avatar.webp"
              alt=""
              width={176}
              height={176}
              decoding="async"
              className="size-[3.25rem] shrink-0 rounded-full object-cover ring-1 ring-oro/40"
              style={{ filter: "grayscale(.3) contrast(1.05) brightness(.95)" }}
            />
            <span className="flex flex-col">
              <span className="nx-hero-tarjeta-dato font-name text-[0.8rem] leading-[1.2] font-extrabold tracking-[0.02em] text-hueso uppercase [font-stretch:115%]">
                {hero.name}
              </span>
              <span className="nx-hero-tarjeta-dato mt-0.5 text-[0.74rem] leading-[1.3] text-gris">{hero.card.role}</span>
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-[0.76rem] leading-[1.3] font-semibold whitespace-nowrap text-oro-claro">
                {/* En la forma compacta el nombre visible se oculta: el enlace lo conserva para lectores de pantalla. */}
                {hero.card.cta}
                <Arrow className="size-[1em] transition-transform duration-500 group-hover:translate-x-0.5" />
              </span>
            </span>
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
