"use client";

import { motion, type Variants } from "motion/react";
import {
  ArrowsCounterClockwise,
  Buildings,
  Camera,
  ChalkboardTeacher,
  ChartLineUp,
  Compass,
  Envelope,
  Flask,
  FileMagnifyingGlass,
  Flame,
  Gavel,
  GitFork,
  HardHat,
  MagnifyingGlass,
  MapPin,
  PenNib,
  Phone,
  Scales,
  SealCheck,
  SealQuestion,
  SealWarning,
  ShieldCheck,
  Stamp,
  Target,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useReduce } from "./primitives";

// Íconos rellenos (Phosphor, peso "fill"): Aaron los pidió rellenos, no lineales (10-11), para acompañar
// los botones redondeados. Al aparecer se "encienden": nacen pequeños en color brasa y se asientan en dorado.

const ICONS = {
  // Disciplinas (Intersección)
  balanza: Scales,
  lupa: MagnifyingGlass,
  llama: Flame,
  sello: SealCheck,
  // Los siete pasos del método (NFPA 921)
  necesidad: Flame,
  problema: Target,
  camara: Camera,
  analisis: ChartLineUp,
  hipotesis: GitFork,
  prueba: Flask,
  conclusion: Stamp,
  ciclo: ArrowsCounterClockwise,
  // Servicios
  auditoria: FileMagnifyingGlass,
  revision: PenNib,
  litigacion: Gavel,
  controvertidas: SealQuestion,
  investigacion: Flame,
  prejudicial: Compass,
  formacion: ChalkboardTeacher,
  // Resultado de una revisión
  insuficiente: SealWarning,
  // A quiénes aportamos valor
  perito: HardHat,
  abogado: Gavel,
  aseguradora: ShieldCheck,
  empresa: Buildings,
  // Contacto
  correo: Envelope,
  telefono: Phone,
  base: MapPin,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  /** Tamaño y color. Con `badge`, es el tamaño del círculo. */
  className?: string;
  /** Segundos antes de encenderse. */
  delay?: number;
  /** Dentro de un círculo dorado suave, del mismo lenguaje redondeado de los botones. */
  badge?: boolean;
  /**
   * Cómo se dispara la aparición:
   * - "view" (por defecto): al entrar en pantalla.
   * - "inherit": sigue las variantes hidden/shown de un padre de Motion (para sincronizarlo con otra animación).
   * - "hidden" o "shown": lo controla el componente que lo usa.
   * - "static": sin animación.
   */
  mode?: "view" | "inherit" | "hidden" | "shown" | "static";
};

export function Icon({ name, className = "size-6", delay = 0, badge = false, mode = "view" }: Props) {
  const reduce = useReduce();
  // Respaldo: si se agrega un servicio o un público sin ícono propio, se muestra el sello y nada se rompe.
  const Glyph = ICONS[name] ?? SealCheck;

  const glyph = <Glyph weight="fill" aria-hidden="true" className={badge ? "size-[52%]" : "size-full"} />;
  const shell = badge
    ? `inline-grid shrink-0 place-items-center rounded-full bg-oro/[0.13] text-oro-claro ring-1 ring-oro/25 ring-inset ${className}`
    : `inline-block shrink-0 ${className}`;

  if (mode === "static") return <span className={shell}>{glyph}</span>;

  // Prende de una (Aaron, 12-11): el salto de tamaño y el destello de brasa se leían como un parpadeo.
  const variants: Variants = {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: reduce ? { duration: 0 } : { duration: 0.15, ease: "easeOut", delay } },
  };

  const trigger =
    mode === "view"
      ? { initial: reduce ? false : ("hidden" as const), whileInView: "shown", viewport: { once: true, amount: 0.6 } }
      : mode === "inherit"
        ? {}
        : { initial: false as const, animate: mode };

  return (
    <motion.span className={shell} variants={variants} {...trigger}>
      {glyph}
    </motion.span>
  );
}
