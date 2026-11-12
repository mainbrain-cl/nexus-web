"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, type Variants } from "motion/react";
import { method, photos, type MethodStep } from "@/data/nexus";
import { Container, Reveal, Section, SectionTitle, ease, useReduce } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { Rich } from "@/components/ui/Rich";
import { PhotoBand } from "@/components/ui/PhotoBand";

// Método: los siete pasos del método científico de NFPA 921 en una sola columna vertical, en escritorio y en
// celular. Siete pasos no caben en una fila sin achicar los nombres, y en vertical el orden se lee de corrido.
// En escritorio la foto y las normas quedan fijas a la izquierda mientras la cadena avanza a la derecha.
// Un hilo de retorno une el paso 6 con el 3: el ciclo de la norma, en que una hipótesis que no resiste la
// prueba devuelve el trabajo a los datos.

const TITLE_ID = "metodo-titulo";

// Un ícono por paso, en el orden de method.steps.
const STEP_ICONS: IconName[] = ["necesidad", "problema", "camara", "analisis", "hipotesis", "prueba", "conclusion"];

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

function Paso({
  step,
  index,
  total,
  reduce,
  onLit,
  nodeRef,
}: {
  step: MethodStep;
  index: number;
  total: number;
  reduce: boolean;
  onLit: (index: number) => void;
  nodeRef: (el: HTMLSpanElement | null) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const last = index === total - 1;
  const isLoopStart = index + 1 === method.loop.from;

  // Cada paso sigue su propio avance, así el hilo baja al ritmo real de la lectura aunque los textos tengan
  // alturas distintas. El frente del hilo va a 60 % de la pantalla.
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  // La cadena solo avanza: al subir con el scroll no se apaga ni retrocede (Aaron, 10-11).
  const progress = useMotionValue(0);
  const [litScroll, setLitScroll] = useState(false);
  useMotionValueEvent(raw, "change", (v) => {
    if (v > progress.get()) progress.set(v);
    if (v > 0) setLitScroll(true);
  });

  const lit = reduce || litScroll;
  const state = reduce ? "on" : lit ? "lit" : "idle";

  useEffect(() => {
    if (lit) onLit(index);
  }, [lit, index, onLit]);

  return (
    <li ref={ref} data-lit={lit} className="group relative grid grid-cols-[29px_minmax(0,1fr)] gap-x-4 pb-11 last:pb-0 sm:gap-x-7 lg:pb-14">
      {/* Hilo hacia el siguiente paso: base tenue y, encima, el dorado que se llena con el scroll.
          Va de centro de nodo a centro de nodo: arranca a media altura del ícono y mide el alto del paso. */}
      {!last && (
        <span aria-hidden="true" className="pointer-events-none absolute top-[22px] left-[14px] h-full w-px bg-hueso/[0.12]">
          <motion.span className="absolute inset-0 origin-top bg-oro" style={{ scaleY: reduce ? 1 : progress }} />
        </span>
      )}

      <span aria-hidden="true" className="relative z-10 flex h-11 w-[29px] items-center justify-center">
        <motion.span
          className="absolute size-10 rounded-full bg-[radial-gradient(circle,rgba(255,122,42,0.75),rgba(255,122,42,0)_68%)]"
          variants={glowVariants}
          initial={false}
          animate={state}
        />
        <motion.span
          ref={nodeRef}
          className="relative size-[13px] rounded-full border"
          variants={nodeVariants}
          initial={false}
          animate={state}
        />
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-4">
          {/* El ícono se dibuja cuando el hilo alcanza su paso */}
          <Icon name={STEP_ICONS[index]} mode={lit ? "shown" : "hidden"} delay={0.15} badge className="size-11 shrink-0" />
          <h3 className="min-w-0 font-display text-[clamp(1.55rem,2.3vw,2.15rem)] leading-[0.98] text-hueso uppercase italic opacity-50 [text-wrap:balance] transition-opacity duration-700 ease-expo group-data-[lit=true]:opacity-100 motion-reduce:transition-none">
            {/* El orden es información: índice discreto, no decorativo. */}
            <span
              aria-hidden="true"
              className="mr-2.5 inline-block align-[0.5em] font-sans text-[0.72rem] font-semibold tracking-[0.12em] text-oro not-italic tabular-nums transition-colors duration-700 group-data-[lit=true]:text-oro-claro"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {step.name}
            {step.note && (
              <>
                {/* La condición completa el nombre en su propia línea, más pequeña: el nombre sigue mandando */}
                ,{" "}
                <span className="mt-1.5 block text-[0.62em] leading-[1.05] text-hueso/70">{step.note}</span>
              </>
            )}
          </h3>
        </div>
        <p className="mt-3 max-w-[46ch] text-[1.02rem] leading-relaxed text-gris opacity-[0.72] [text-wrap:pretty] transition-opacity duration-700 ease-expo group-data-[lit=true]:opacity-100 motion-reduce:transition-none sm:pl-[3.75rem] lg:text-[1.06rem]">
          <Rich text={step.text} />
        </p>
        {isLoopStart && (
          // Nota del ciclo: explica el hilo de retorno que sale de este nodo hacia el paso de los datos.
          <p className="mt-4 flex max-w-[46ch] items-start gap-2.5 text-[0.95rem] leading-snug text-oro-claro opacity-60 transition-opacity duration-700 ease-expo group-data-[lit=true]:opacity-100 motion-reduce:transition-none sm:pl-[3.75rem]">
            <Icon name="ciclo" mode="static" className="mt-[0.15em] size-4 shrink-0" />
            <span>{method.loop.text}</span>
          </p>
        )}
      </div>
    </li>
  );
}

type LoopGeometry = { top: number; height: number; x: number };

/** Hilo de retorno: sale por la izquierda del nodo del paso 6, sube y entra al nodo del paso 3. */
function HiloDeRetorno({ geometry, drawn, reduce }: { geometry: LoopGeometry; drawn: boolean; reduce: boolean }) {
  const { top, height: h, x } = geometry;
  const r = Math.min(12, h / 2);
  const x0 = 0.5;
  const d = `M ${x} ${h} H ${x0 + r} Q ${x0} ${h} ${x0} ${h - r} V ${r} Q ${x0} 0 ${x0 + r} 0 H ${x}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 overflow-visible"
      style={{ top, height: h, width: x }}
      viewBox={`0 0 ${x} ${h}`}
      fill="none"
    >
      <path d={d} stroke="#f4eee6" strokeOpacity={0.1} strokeWidth={1} />
      <motion.path
        d={d}
        stroke="#c9a26b"
        strokeWidth={1}
        initial={false}
        animate={{ pathLength: reduce || drawn ? 1 : 0, opacity: reduce || drawn ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { pathLength: { duration: 1.6, ease }, opacity: { duration: 0.2 } }}
      />
    </svg>
  );
}

function Pasos() {
  const reduce = useReduce();
  const listRef = useRef<HTMLOListElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const [litUpTo, setLitUpTo] = useState(-1);
  const [geometry, setGeometry] = useState<LoopGeometry | null>(null);

  const onLit = useCallback((i: number) => setLitUpTo((v) => Math.max(v, i)), []);

  // El hilo de retorno depende de dónde caen los nodos, que cambia con el ancho y con las fuentes.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      // Se mide la caja que contiene al nodo, no el nodo: este puede estar a escala 1.4 en su destello.
      const a = nodes.current[method.loop.to - 1]?.parentElement;
      const b = nodes.current[method.loop.from - 1]?.parentElement;
      if (!a || !b) return;
      const box = list.getBoundingClientRect();
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const top = Math.round(ra.top + ra.height / 2 - box.top);
      const bottom = Math.round(rb.top + rb.height / 2 - box.top);
      // El hilo termina en el borde izquierdo del nodo: (29 - 13) / 2 = 8 px dentro de su caja.
      const x = Math.round(ra.left - box.left + 8);
      setGeometry({ top, height: bottom - top, x });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  return (
    <ol ref={listRef} aria-label={method.stepsLabel} className="relative pl-6 sm:pl-8">
      {geometry && <HiloDeRetorno geometry={geometry} drawn={litUpTo >= method.loop.from - 1} reduce={reduce} />}
      {method.steps.map((step, i) => (
        <Paso
          key={step.name}
          step={step}
          index={i}
          total={method.steps.length}
          reduce={reduce}
          onLit={onLit}
          nodeRef={(el) => {
            nodes.current[i] = el;
          }}
        />
      ))}
    </ol>
  );
}

export function Metodo() {
  return (
    <Section id="metodo" tone="ceniza" labelledBy={TITLE_ID}>
      <Container>
        <SectionTitle id={TITLE_ID} lines={method.title} accent={1} />

        <div className="mt-8 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-x-[clamp(3rem,6vw,6.5rem)]">
          {/* Escritorio: la línea, las normas y la foto quedan fijas mientras la cadena avanza a la derecha. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal delay={0.15}>
              <p className="max-w-[46ch] text-[1.1rem] leading-relaxed text-gris lg:text-[1.15rem]">
                <Rich text={method.text} />
              </p>
              {/* Las normas como etiquetas: código en negrita y su nombre corto. No son enlaces ni botones.
                  Radio de 1.25rem: en una línea se ve píldora; si en 320 px el nombre baja, no se deforma. */}
              <ul aria-label={method.standardsLabel} className="mt-5 flex flex-wrap gap-2.5">
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

            {/* La evidencia es el punto de partida del método: la imagen acompaña toda la cadena. */}
            <PhotoBand
              {...photos.evidencia}
              position="60% 55%"
              className="mt-[clamp(2rem,4vw,3rem)] aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[5/6]"
            />
          </div>

          <div className="lg:pt-2">
            <Pasos />
          </div>
        </div>
      </Container>
    </Section>
  );
}
