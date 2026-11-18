"use client";

import { motion, type Variants } from "motion/react";
import { useContent } from "@/components/LocaleProvider";
import { Container, Reveal, Section, SectionTitle, ease, useReduce } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { Rich } from "@/components/ui/Rich";
import { PhotoBand } from "@/components/ui/PhotoBand";

// Intersección: qué hace única a NEXUS. El momento propio es "el nudo": tres hilos entran en la X del logo,
// la X se enciende como brasa y se enfría a dorado, y de ella sale un solo hilo hacia la conclusión.

const TITLE_ID = "interseccion-titulo";
const AUDIENCES_ID = "interseccion-publicos";

/* ---------- Geometría del nudo (viewBox 520 × 560) ----------
   La X es la del Logo, escalada ×1.4 y centrada en C. Cada hilo llega alineado con el eje de un brazo,
   así parece que el hilo se convierte en ese brazo; la salida emerge por el cuarto brazo y se endereza. */

const VB = { w: 520, h: 560 };
const C = { x: 286, y: 262 };
const X_TRANSFORM = "translate(216 183.6) scale(1.4)";

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`;

// En el mismo orden que intersection.threads. El rótulo más largo (la competencia jurídica) va abajo a la
// izquierda, donde tiene espacio para crecer hacia abajo sin salirse del diagrama.
const threads = [
  // Investigación de incendios: desde arriba a la izquierda, entra por el brazo superior izquierdo.
  { d: "M30 104 C120 100 208 121 286 262", from: { x: 30, y: 104 }, label: "above-left" },
  // Análisis técnico-científico: desde arriba a la derecha, entra por el brazo superior derecho.
  { d: "M490 80 C440 84 384 121 286 262", from: { x: 490, y: 80 }, label: "above-right" },
  // Comprensión jurídica de la prueba pericial: desde abajo a la izquierda, entra por el brazo inferior izquierdo.
  { d: "M30 404 C110 406 190 403 286 262", from: { x: 30, y: 404 }, label: "below-left" },
] as const;

// Cada competencia con su ícono: llama (investigación de incendios), lupa (análisis técnico-científico) y
// balanza (comprensión jurídica de la prueba pericial).
const THREAD_ICONS: IconName[] = ["llama", "lupa", "balanza"];

const OUT = { d: "M286 262 C326 330 352 390 352 476", end: { x: 352, y: 476 } };

/** Tiempos de la secuencia, en segundos. */
const T = {
  thread: (i: number) => 0.15 + i * 0.26,
  threadDur: 1.6,
  ignite: 1.3,
  out: 1.95,
  outDur: 1.3,
  knot: 2.6,
};

/** Variantes del diagrama. Con movimiento reducido todo queda en su estado final, sin duración. */
function buildVariants(still: boolean) {
  const at = (delay: number, duration: number) => (still ? { duration: 0 } : { delay, duration, ease });

  const thread: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    shown: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      // La opacidad entra casi de golpe: evita el punto suelto que deja un trazo de largo cero.
      transition: { pathLength: at(T.thread(i), T.threadDur), opacity: at(T.thread(i), 0.15) },
    }),
  };

  const node: Variants = {
    hidden: { opacity: 0, scale: 0 },
    shown: (i: number) => ({ opacity: 1, scale: 1, transition: at(T.thread(i) - 0.1, 0.7) }),
  };

  const label: Variants = {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    shown: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: at(T.thread(i), 1) }),
  };

  // Antes de encenderse la X es apenas ceniza; al encenderse queda en su dorado.
  const xGold: Variants = {
    hidden: { opacity: 0.14 },
    shown: { opacity: 1, transition: at(T.ignite + 0.1, 1.4) },
  };

  const out: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    shown: { pathLength: 1, opacity: 1, transition: { pathLength: at(T.out, T.outDur), opacity: at(T.out, 0.15) } },
  };

  const knot: Variants = {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: at(T.knot, 1.1) },
  };

  const endNode: Variants = {
    hidden: { opacity: 0, scale: 0 },
    shown: { opacity: 1, scale: 1, transition: at(T.knot - 0.2, 0.8) },
  };

  return { thread, node, label, xGold, out, knot, endNode };
}

// Brasa: la X pasa por blanco anaranjado y se enfría, el mismo gesto de las letras de la hero.
const xHot: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: [0, 1, 0], transition: { delay: T.ignite, duration: 1.8, times: [0, 0.1, 1], ease: "easeOut" } },
};

const glow: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  shown: {
    opacity: [0, 0.85, 0],
    scale: [0.6, 1, 1.18],
    transition: { delay: T.ignite, duration: 2.1, times: [0, 0.14, 1], ease: "easeOut" },
  },
};

function XShape({ fillA, fillB }: { fillA: string; fillB: string }) {
  return (
    <>
      <polygon points="80,0 98,0 22,112 2,112" fill={fillB} />
      <polygon points="4,0 34,0 98,112 68,112" fill={fillA} />
    </>
  );
}

const labelPos: Record<(typeof threads)[number]["label"], string> = {
  "above-left": "-translate-x-[3px] -translate-y-[calc(100%+12px)] text-left",
  "below-left": "-translate-x-[3px] translate-y-[12px] text-left",
  "above-right": "translate-x-[3px] -translate-y-[calc(100%+12px)] text-right",
};

function Nudo() {
  const { intersection } = useContent();
  const reduce = useReduce();
  const v = buildVariants(!!reduce);
  // Con movimiento reducido el diagrama se pinta completo y quieto desde el primer cuadro.
  const trigger = reduce
    ? { initial: false as const, animate: "shown" }
    : { initial: "hidden", whileInView: "shown", viewport: { once: true, amount: 0.45 } };

  return (
    <motion.figure
      role="img"
      aria-label={intersection.diagramLabel}
      className="relative mx-auto aspect-[520/560] w-full max-w-[440px] sm:max-w-[520px]"
      {...trigger}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
      >
        <defs>
          {/* Ids propios: los del Logo (nexus-x-a/b) viven en la barra de navegación de la misma página. */}
          <linearGradient id="nx-nudo-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6c690" />
            <stop offset="1" stopColor="#b98d55" />
          </linearGradient>
          <linearGradient id="nx-nudo-b" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a98252" />
            <stop offset="1" stopColor="#7c5c34" />
          </linearGradient>
          <linearGradient id="nx-nudo-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3d6" />
            <stop offset="0.55" stopColor="#ffc27a" />
            <stop offset="1" stopColor="#ff7a2a" />
          </linearGradient>
          <radialGradient id="nx-nudo-glow">
            <stop offset="0" stopColor="#ff7a2a" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#ff7a2a" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ff7a2a" stopOpacity="0" />
          </radialGradient>
          {/* Cada hilo nace tenue y se aviva al llegar al cruce. */}
          {threads.map((t, i) => (
            <linearGradient
              key={t.d}
              id={`nx-nudo-hilo-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={t.from.x}
              y1={t.from.y}
              x2={C.x}
              y2={C.y}
            >
              <stop offset="0" stopColor="#9c7a4a" stopOpacity="0.45" />
              <stop offset="1" stopColor="#e0c08f" />
            </linearGradient>
          ))}
          <linearGradient id="nx-nudo-salida" gradientUnits="userSpaceOnUse" x1={C.x} y1={C.y} x2={OUT.end.x} y2={OUT.end.y}>
            <stop offset="0" stopColor="#e0c08f" />
            <stop offset="1" stopColor="#c9a26b" />
          </linearGradient>
        </defs>

        {/* Hilos de entrada: van debajo de la X para que desaparezcan dentro de sus brazos.
            El grosor se fija en CSS para que en pantalla mida ~1 px a cualquier escala. */}
        <g className="[stroke-width:1.5] sm:[stroke-width:1.2]">
          {threads.map((t, i) => (
            <motion.path key={t.d} d={t.d} stroke={`url(#nx-nudo-hilo-${i})`} variants={v.thread} custom={i} />
          ))}
          <motion.path d={OUT.d} stroke="url(#nx-nudo-salida)" variants={v.out} />
        </g>

        {threads.map((t, i) => (
          <motion.circle key={t.d} cx={t.from.x} cy={t.from.y} r={3} fill="#c9a26b" variants={v.node} custom={i} />
        ))}
        <motion.circle cx={OUT.end.x} cy={OUT.end.y} r={4} fill="#e0c08f" variants={v.endNode} />

        {/* Resplandor de brasa: breve, pequeño y detrás de la X. No se dibuja con movimiento reducido. */}
        {!reduce && <motion.circle cx={C.x} cy={C.y} r={112} fill="url(#nx-nudo-glow)" variants={glow} />}

        {/* La posición va en un <g> fijo: así Motion solo toca la opacidad y no pisa el atributo transform. */}
        <g transform={X_TRANSFORM}>
          <motion.g variants={v.xGold}>
            <XShape fillA="url(#nx-nudo-a)" fillB="url(#nx-nudo-b)" />
          </motion.g>
          {!reduce && (
            <motion.g variants={xHot}>
              <XShape fillA="url(#nx-nudo-hot)" fillB="url(#nx-nudo-hot)" />
            </motion.g>
          )}
        </g>
      </svg>

      {/* Rótulos en HTML: mantienen un tamaño legible aunque el diagrama se escale en el celular. */}
      {threads.map((t, i) => (
        <motion.span
          key={t.d}
          aria-hidden="true"
          variants={v.label}
          custom={i}
          className={`absolute flex items-center gap-2.5 text-[0.9rem] leading-[1.25] font-medium text-hueso/85 [text-wrap:balance] sm:text-[0.98rem] ${
            t.label === "above-right" ? "flex-row-reverse" : ""
          } ${t.label === "below-left" ? "max-w-[15.5rem] sm:max-w-[17rem]" : "max-w-[11.5rem] sm:max-w-[13.5rem]"} ${labelPos[t.label]}`}
          style={{
            top: pct(t.from.y, VB.h),
            ...(t.label === "above-right" ? { right: pct(VB.w - t.from.x, VB.w) } : { left: pct(t.from.x, VB.w) }),
          }}
        >
          {/* El ícono se dibuja junto con su hilo */}
          <Icon name={THREAD_ICONS[i]} mode="inherit" badge delay={T.thread(i) + 0.25} className="size-9 sm:size-10" />
          {/* Guion que no se corta: "técnico-científico" no debe partirse entre dos líneas */}
          <span>{intersection.threads[i].replace(/-/g, "‑")}</span>
        </motion.span>
      ))}

      <motion.span
        aria-hidden="true"
        variants={v.knot}
        className="absolute flex -translate-x-1/2 translate-y-[14px] items-center gap-2.5 text-[1rem] font-semibold tracking-[-0.005em] whitespace-nowrap text-hueso sm:text-[1.1rem]"
        style={{ top: pct(OUT.end.y, VB.h), left: pct(OUT.end.x, VB.w) }}
      >
        <Icon name="sello" mode="inherit" badge delay={T.knot + 0.1} className="size-9 sm:size-10" />
        {intersection.knot}
      </motion.span>
    </motion.figure>
  );
}

// Ícono de cada público, en el mismo orden que intersection.audiences.
const AUDIENCE_ICONS: IconName[] = ["aseguradora", "abogado", "perito", "empresa"];

export function Interseccion() {
  const { intersection, photos } = useContent();
  const { title, body, audiencesTitle, audiences } = intersection;

  return (
    <Section id="nexus" tone="ceniza" labelledBy={TITLE_ID} className="pb-[clamp(3.5rem,6vw,5rem)]">
      <Container>
        {/* Un solo bloque. Escritorio: título, línea y públicos a la izquierda, centrados contra el nudo de la derecha
            (las filas 1fr de los extremos hacen el centrado). Celular: título, línea, nudo y públicos, el orden del DOM. */}
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-[clamp(3rem,6vw,6.5rem)]">
          <div className="lg:col-start-1 lg:row-start-2">
            <SectionTitle id={TITLE_ID} lines={title} accent={1} size="md" />
          </div>

          <Reveal
            as="p"
            delay={0.12}
            className="mt-6 max-w-[58ch] text-[1.08rem] leading-relaxed text-gris sm:text-[1.15rem] lg:col-start-1 lg:row-start-3 lg:mt-7"
          >
            <Rich text={body} />
          </Reveal>

          <div className="mt-12 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:mt-0 lg:self-center">
            <Nudo />
          </div>

          {/* A quiénes atiende: lista de texto con su ícono, sin píldora (la píldora queda para lo que se toca). */}
          <div className="mt-12 lg:col-start-1 lg:row-start-4 lg:mt-10">
            <Reveal as="p" delay={0.1} id={AUDIENCES_ID} className="text-[0.95rem] font-medium text-hueso/80">
              {audiencesTitle}
            </Reveal>
            <ul aria-labelledby={AUDIENCES_ID} className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {audiences.map((a, i) => (
                <Reveal
                  as="li"
                  key={a}
                  delay={0.18 + 0.07 * i}
                  className="flex items-start gap-2.5 text-[0.98rem] leading-snug text-hueso/90 sm:text-[1.02rem]"
                >
                  <Icon name={AUDIENCE_ICONS[i]} mode="static" className="mt-[0.1em] size-[1.1rem] shrink-0 text-oro-claro" />
                  <span>{a}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        {/* La foto de terreno cierra el bloque: el cruce de disciplinas ocurre en el sitio del incendio.
            Versión del 18-11 con el logo de NEXUS en el casco, como pidió Domingo. */}
        <PhotoBand
          {...photos.terreno}
          position="62% 45%"
          className="mt-[clamp(3rem,6vw,4.5rem)] aspect-[4/3] w-full sm:aspect-[16/9]"
        />
      </Container>
    </Section>
  );
}
