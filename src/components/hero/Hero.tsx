"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { hero, links, profile } from "@/data/nexus";
import { Arrow } from "../Arrow";
import { Embers } from "./Embers";
import { RotatingTag } from "./RotatingTag";
import { SmokeGL } from "./SmokeGL";

const CHAR_STEP = 0.052; // s entre letra y letra al encenderse
const LINE_START = [0.25, 0.52];

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

/** Desplazamiento de una capa: profundidad ante el mouse + velocidad propia ante el scroll. */
function useLayer(px: MotionValue<number>, py: MotionValue<number>, scrollY: MotionValue<number>, depth: number, scrollK: number) {
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
  const reduce = useReducedMotion();
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
  const title = useLayer(px, py, scrollY, 16 * k, 0.3 * k);
  const person = useLayer(px, py, scrollY, 28 * k, 0.1 * k);
  const front = useLayer(px, py, scrollY, 54 * k, -0.18 * k);
  const content = useLayer(px, py, scrollY, 6 * k, -0.08 * k);

  const titleOpacity = useTransform(scrollY, [0, 520], [1, reduce ? 1 : 0.15]);
  const contentOpacity = useTransform(scrollY, [0, 360], [1, reduce ? 1 : 0]);
  // Oscurecer con opacidad sobre fondo oscuro: se compone en GPU, sin repintar la foto en cada scroll.
  const personOpacity = useTransform(scrollY, [0, 600], [1, reduce ? 1 : 0.45]);

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
    // Empieza recién cuando termina la entrada y crece de a poco, centrado en cero, para que Domingo
    // aparezca centrado y no parezca que se va acomodando.
    // Se detiene cuando la hero sale de pantalla o la pestaña queda oculta: antes corría para siempre.
    let raf = 0;
    let running = false;
    let visible = true;
    // El reloj del vaivén se detiene durante la pausa, para que al volver siga donde quedó y no salte.
    let t0 = performance.now();
    let pausedAt = 0;
    const START = 4.2;
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
    <section ref={sectionRef} id="inicio" aria-labelledby="hero-title" className="relative isolate h-[100svh] min-h-[640px] overflow-hidden bg-ceniza">
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
        <Embers layer="back" burstDelay={reduce ? undefined : 420} className="size-full" />
      </motion.div>

      {/* 4 · Título que se enciende y queda carbonizado */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[15svh] -z-10 flex justify-center px-3 will-change-transform sm:top-[15svh]"
        style={{ ...title, opacity: titleOpacity }}
      >
        <h1
          id="hero-title"
          className="font-display text-center text-[17vw] leading-[0.86] uppercase italic [font-kerning:none] sm:text-[min(12.6vw,23svh)]"
          style={{ opacity: 0.88 }}
        >
          <span className="sr-only">{hero.titleLines.join(" ")}</span>
          <span aria-hidden="true" className="block">
            {hero.titleLines.map((line, i) => (
              <TitleLine key={line} text={line} start={LINE_START[i]} />
            ))}
          </span>
        </h1>
      </motion.div>

      {/* 5 · Domingo, delante del título. El desvanecido inferior viene horneado en la imagen. */}
      <div className="pointer-events-none absolute inset-0 flex justify-center pt-[23svh] sm:pt-[28.5svh]">
        <motion.div
          className="relative h-[68svh] min-h-[420px] will-change-transform sm:h-[72svh] sm:min-h-[460px]"
          style={{ ...person, opacity: personOpacity }}
        >
          <div className="in-person relative h-full">
            {/* Luz de fuego que asoma por el borde: silueta negra con resplandor, oculta detrás de la foto */}
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
            <img
              src="/hero/domingo.webp"
              alt=""
              aria-hidden="true"
              className="in-rim absolute inset-0 h-full w-auto max-w-none opacity-40"
              style={{ filter: "brightness(0) drop-shadow(0 6px 14px rgba(255,118,40,.55))" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
            <img
              src="/hero/domingo.webp"
              alt="Domingo Soto Gamé con uniforme de la International Association of Arson Investigators"
              width={950}
              height={1503}
              fetchPriority="high"
              className="relative h-full w-auto max-w-none"
              // Se baja apenas para que la foto viva dentro del humo, sin perder el contraste original.
              style={{ filter: "brightness(.9) saturate(.92)" }}
            />
            {/* Reflejo cálido del fuego en los costados, recortado a su silueta */}
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: "url(/hero/domingo.webp)",
                maskImage: "url(/hero/domingo.webp)",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                background:
                  "linear-gradient(90deg, rgba(255,120,40,.16), transparent 22%, transparent 78%, rgba(255,120,40,.14)), radial-gradient(70% 35% at 50% 100%, rgba(255,110,30,.14), transparent 70%)",
              }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      </div>

      {/* 6 · Brasas cercanas, desenfocadas, por delante de todo */}
      <motion.div className="pointer-events-none absolute inset-0 z-10 will-change-transform" style={front}>
        <Embers layer="front" burstDelay={reduce ? undefined : 2100} className="size-full" />
      </motion.div>

      {/* Sombra inferior para leer el texto sobre la foto */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(0deg, rgba(18,15,13,.94) 0%, rgba(18,15,13,.62) 20%, rgba(18,15,13,0) 46%), radial-gradient(60% 38% at 50% 92%, rgba(12,10,9,.55), transparent 75%), linear-gradient(180deg, rgba(18,15,13,.7), transparent 16%)",
        }}
        aria-hidden="true"
      />

      {/* 7 · Nombre, rol y acciones */}
      <motion.div
        className="absolute inset-x-0 bottom-[max(2.2rem,5svh)] z-20 flex flex-col items-center px-5 text-center"
        style={{ ...content, opacity: contentOpacity }}
      >
        <div className="relative flex flex-col items-center">
          <RotatingTag items={hero.tags} className="mb-4 sm:mb-5" />
          <p className="font-name text-[clamp(1.9rem,3.6vw,3.7rem)] leading-[1] font-extrabold tracking-[0.01em] text-hueso uppercase [font-stretch:115%] [text-shadow:0_2px_28px_rgba(0,0,0,.6)]">
            <span className="sr-only">{hero.name}</span>
            <span aria-hidden="true">
              {/* El relleno superior deja ver la tilde de GAMÉ al final, y la máscara la oculta al inicio */}
              <span className="-mt-[0.22em] inline-block overflow-hidden px-[0.04em] pt-[0.22em] pb-[0.1em] align-bottom">
                <span className="in-word inline-block" style={{ "--d": "2.75s" } as Vars}>
                  {hero.firstName}
                </span>
              </span>{" "}
              <span className="-mt-[0.22em] inline-block overflow-hidden px-[0.04em] pt-[0.22em] pb-[0.1em] align-bottom">
                <span className="in-word inline-block text-oro-claro" style={{ "--d": "2.88s" } as Vars}>
                  {hero.lastName}
                </span>
              </span>
            </span>
          </p>

        </div>
        <span className="in-rule mt-[clamp(0.7rem,1.6svh,1.2rem)] block h-px w-[clamp(72px,7vw,120px)] origin-center bg-gradient-to-r from-transparent via-oro-claro to-transparent" aria-hidden="true" />
        <p className="in-role mt-[clamp(0.8rem,1.8svh,1.2rem)] text-[clamp(1.02rem,1.35vw,1.32rem)] leading-[1.4] font-normal tracking-[0.005em] text-hueso/85 [text-shadow:0_1px_14px_rgba(0,0,0,.6)]">
          {hero.roleLines[0]}
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>
          {hero.roleLines[1]}
        </p>
        <div className="mt-[clamp(1.4rem,4.4svh,2.6rem)] flex w-full max-w-[340px] flex-col items-stretch gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:items-center sm:gap-[clamp(1rem,3vw,3.2rem)]">
          <a
            href={links.asesoria}
            target="_blank"
            rel="noopener"
            className="in-cta btn btn-oro h-[3.3rem] px-9 text-[0.92rem] sm:h-[clamp(3.4rem,6.4svh,3.9rem)] sm:min-w-[19rem] sm:text-[clamp(0.9rem,1vw,1.05rem)]"
            style={{ "--d": "3.25s" } as Vars}
          >
            {hero.primaryCta}
            <Arrow className="btn-arrow size-[1.1em]" />
          </a>
          <a
            href="#servicios"
            className="in-cta btn btn-linea h-[3.3rem] px-9 text-[0.92rem] sm:h-[clamp(3.4rem,6.4svh,3.9rem)] sm:min-w-[15rem] sm:text-[clamp(0.9rem,1vw,1.05rem)]"
            style={{ "--d": "3.37s" } as Vars}
          >
            {hero.secondaryCta}
          </a>
        </div>
      </motion.div>

      {/* 8 · Sellos IAAI en la esquina (Aaron, 10-11). Desde 1024 px, abajo a la izquierda,
          alineados con el logo. En celular y tablet esa esquina choca con los botones: van arriba, bajo el logo. */}
      <div className="pointer-events-none absolute inset-x-0 top-[4.9rem] z-20 sm:top-[6.2rem] lg:top-auto lg:bottom-[max(2.4rem,5.5svh)]">
        <ul
          aria-label="Afiliaciones y credencial IAAI"
          className="in-cta mx-auto flex max-w-[1440px] items-center px-5 sm:px-8 lg:px-[8.5vw] xl:px-[min(8.5vw,140px)]"
          style={{ "--d": "3.6s" } as Vars}
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
    </section>
  );
}
