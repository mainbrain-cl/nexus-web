"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import { method, photos } from "@/data/nexus";
import { Container, Reveal, Section, SectionTitle, useReduce } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { Rich } from "@/components/ui/Rich";
import { PhotoBand } from "@/components/ui/PhotoBand";

// Un ícono por eslabón: cámara (datos), gráfico (análisis), bifurcación (hipótesis) y documento aprobado (conclusión).
const CHAIN_ICONS: IconName[] = ["camara", "analisis", "hipotesis", "conclusion"];

// Texto que no está en nexus.ts: solo lo leen los lectores de pantalla.
const copy = {
  chainLabel: "Cadena de trazabilidad: de los datos a la conclusión",
  standardsLabel: "Normas de referencia",
};

// La cadena cambia de eje en lg: horizontal en escritorio, vertical en el celular.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

// El nodo se enciende como brasa: destello naranja breve y queda en dorado.
const nodeVariants: Variants = {
  idle: {
    backgroundColor: "#120f0d",
    borderColor: "rgba(201, 162, 107, 0.45)",
    scale: 1,
    transition: { duration: 0.5 },
  },
  lit: {
    backgroundColor: ["#ff7a2a", "#ff7a2a", "#c9a26b"],
    borderColor: ["#ff7a2a", "#ffb27a", "#e0c08f"],
    scale: [1, 1.4, 1],
    transition: { duration: 1.2, times: [0, 0.22, 1], ease: "easeOut" },
  },
  // Estado final sin animación, para reduced-motion.
  on: { backgroundColor: "#c9a26b", borderColor: "#e0c08f", scale: 1, transition: { duration: 0 } },
};

const glowVariants: Variants = {
  idle: { opacity: 0, scale: 0.5, transition: { duration: 0.3 } },
  lit: { opacity: [0, 0.9, 0], scale: [0.5, 1.6, 2.3], transition: { duration: 1.2, times: [0, 0.2, 1], ease: "easeOut" } },
  on: { opacity: 0, scale: 0.5, transition: { duration: 0 } },
};

type ChainItem = (typeof method.chain)[number];

function Eslabon({
  item,
  index,
  total,
  progress,
  desktop,
  reduce,
}: {
  item: ChainItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
  desktop: boolean;
  reduce: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const last = index === total - 1;

  // Celular: cada eslabón sigue su propio avance, así el hilo baja al ritmo real de la lectura
  // aunque los textos tengan alturas distintas. El frente del hilo va a 60 % de la pantalla.
  const { scrollYProgress: localRaw } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  // La cadena solo avanza: al subir con el scroll no se apaga ni retrocede. Antes cada pieza seguía el scroll
  // por su cuenta y, al subir y bajar rápido, punto, ícono y título quedaban en estados distintos (Aaron, 10-11).
  const local = useMotionValue(0);
  useMotionValueEvent(localRaw, "change", (v) => {
    if (v > local.get()) local.set(v);
  });

  // Escritorio: un solo avance para toda la fila; cada tramo ocupa su tercio.
  const step = 1 / (total - 1);
  const from = index * step;
  const segment = useTransform(progress, [from, from + step], [0, 1]);
  const reached = useTransform(progress, (v) => v > 0 && v >= from - 0.002);

  const [litLocal, setLitLocal] = useState(false);
  const [litGlobal, setLitGlobal] = useState(false);
  // Una vez encendido, queda encendido.
  useMotionValueEvent(local, "change", (v) => {
    if (v > 0) setLitLocal(true);
  });
  useMotionValueEvent(reached, "change", (v) => {
    if (v) setLitGlobal(true);
  });

  const lit = reduce || (desktop ? litGlobal : litLocal);
  const state = reduce ? "on" : lit ? "lit" : "idle";

  return (
    <li
      ref={ref}
      data-lit={lit}
      className="group relative grid grid-cols-[29px_1fr] gap-x-5 pb-10 last:pb-0 sm:gap-x-7 lg:block lg:pr-8 lg:pb-0"
    >
      {/* Hilo hacia el siguiente eslabón: base tenue y, encima, el dorado que se llena con el scroll.
          Va de centro de nodo a centro de nodo: arranca en 14 px y mide el alto (o ancho) del eslabón. */}
      {!last && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[14px] left-[14px] h-full w-px bg-hueso/[0.12] lg:h-px lg:w-full"
        >
          <motion.span
            className="absolute inset-0 origin-top bg-oro lg:hidden"
            style={{ scaleY: reduce ? 1 : local }}
          />
          <motion.span
            className="absolute inset-0 hidden origin-left bg-oro lg:block"
            style={{ scaleX: reduce ? 1 : segment }}
          />
        </span>
      )}
      {last && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[14px] left-[14px] hidden h-px w-full bg-gradient-to-r from-oro/60 to-transparent lg:block"
        />
      )}

      <span aria-hidden="true" className="relative z-10 flex size-[29px] items-center justify-center">
        <motion.span
          className="absolute size-10 rounded-full bg-[radial-gradient(circle,rgba(255,122,42,0.75),rgba(255,122,42,0)_68%)]"
          variants={glowVariants}
          initial={false}
          animate={state}
        />
        <motion.span
          className="relative size-[13px] rounded-full border"
          variants={nodeVariants}
          initial={false}
          animate={state}
        />
      </span>

      <div className="lg:mt-8">
        <div className="flex items-center gap-4 lg:block">
          {/* El ícono se dibuja cuando el hilo alcanza su eslabón */}
          <Icon
            name={CHAIN_ICONS[index]}
            mode={lit ? "shown" : "hidden"}
            delay={0.15}
            badge
            className="size-11 shrink-0 lg:mb-5 lg:size-14"
          />
          <p className="font-display text-[clamp(1.9rem,2.6vw,2.4rem)] leading-[0.95] text-hueso uppercase italic opacity-50 transition-opacity duration-700 ease-expo group-data-[lit=true]:opacity-100 motion-reduce:transition-none">
            {/* El orden es información: índice discreto, no decorativo. */}
            <span
              aria-hidden="true"
              className="mr-3 inline-block align-[0.55em] font-sans text-[0.75rem] font-semibold tracking-[0.14em] text-oro not-italic tabular-nums transition-colors duration-700 group-data-[lit=true]:text-oro-claro"
            >
              {index + 1}
            </span>
            {item.name}
          </p>
        </div>
        {/* Textos de una línea: medida corta para que en escritorio caigan en dos renglones parejos. */}
        <p className="mt-3 max-w-[24ch] text-[1.05rem] leading-relaxed text-gris opacity-[0.72] transition-opacity duration-700 ease-expo group-data-[lit=true]:opacity-100 motion-reduce:transition-none">
          <Rich text={item.text} />
        </p>
      </div>
    </li>
  );
}

function Cadena() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReduce();
  const desktop = useIsDesktop();
  // La fila entra a 75 % de la pantalla y termina de llenarse cuando su base llega a la mitad.
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start 0.75", "end 0.5"] });
  const scrollYProgress = useMotionValue(0);
  useMotionValueEvent(raw, "change", (v) => {
    if (v > scrollYProgress.get()) scrollYProgress.set(v);
  });

  return (
    <ol ref={ref} aria-label={copy.chainLabel} className="lg:grid lg:grid-cols-4">
      {method.chain.map((item, i) => (
        <Eslabon
          key={item.name}
          item={item}
          index={i}
          total={method.chain.length}
          progress={scrollYProgress}
          desktop={desktop}
          reduce={reduce}
        />
      ))}
    </ol>
  );
}

export function Metodo() {
  return (
    <Section id="metodo" tone="ceniza" labelledBy="metodo-titulo">
      <Container>
        {/* Encabezado: el título manda; la línea y las normas quedan a la derecha, como nota del expediente. */}
        <SectionTitle id="metodo-titulo" lines={method.title} accent={1} />
        <Reveal delay={0.15} className="mt-7 lg:mt-9 lg:ml-[41.666%]">
          <p className="max-w-[52ch] text-[1.1rem] leading-relaxed text-gris lg:text-[1.15rem]">
            <Rich text={method.text} />
          </p>
          {/* Las normas como etiquetas: código en negrita y su nombre corto. No son enlaces ni botones.
              Radio de 1.25rem: en una línea se ve píldora; si en 320 px el nombre baja, no se deforma. */}
          <ul aria-label={copy.standardsLabel} className="mt-5 flex flex-wrap gap-2.5">
            {method.standards.map((s) => (
              <li
                key={s.code}
                className="inline-flex flex-wrap items-baseline gap-x-2 rounded-[1.25rem] border border-oro/25 bg-oro/[0.07] px-4 py-2 text-[0.92rem] leading-snug text-hueso/90"
              >
                <strong className="font-semibold whitespace-nowrap text-oro-claro">{s.code}</strong>
                <span aria-hidden="true" className="text-oro/50">
                  ·
                </span>
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* La evidencia es el punto de partida del método: la imagen abre la cadena. */}
        <PhotoBand
          {...photos.evidencia}
          position="60% 55%"
          className="mt-[clamp(2.5rem,5vw,4rem)] aspect-[4/3] w-full sm:aspect-[16/9]"
        />

        {/* La cadena: enmarcada por hilos como una hoja de expediente. */}
        <div className="mt-[clamp(2.5rem,5vw,3.5rem)] border-y border-hueso/[0.08] py-[clamp(2.5rem,5vw,4rem)]">
          <Cadena />
        </div>
      </Container>
    </Section>
  );
}
