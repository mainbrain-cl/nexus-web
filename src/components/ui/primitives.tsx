"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

// Piezas compartidas por todas las secciones bajo la hero. Una sola gramática de movimiento:
// el contenido aparece subiendo desde una máscara o desde un leve desenfoque, con salida exponencial.

export const ease = [0.16, 1, 0.3, 1] as const;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Preferencia de movimiento reducido, segura para la hidratación: en el servidor y en el primer render
 * del cliente vale `false`, así el HTML coincide; después toma el valor real y re-renderiza.
 * `useReducedMotion` de Motion lee el valor real desde el primer render y descuadraba la hidratación.
 */
export function useReduce() {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(REDUCE_QUERY);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

/** Ancho y márgenes laterales comunes, alineados con la barra de navegación. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

/** Sección con el ritmo vertical común. `tone` cambia el fondo para pausar la lectura entre bloques. */
export function Section({
  id,
  tone = "ceniza",
  children,
  className = "",
  labelledBy,
}: {
  id: string;
  tone?: "ceniza" | "humo";
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative isolate overflow-clip py-[clamp(4.5rem,8vw,7rem)] ${tone === "humo" ? "bg-humo" : "bg-ceniza"} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * Título de sección: cursiva condensada en mayúsculas, la misma voz del título de la hero pero sin la textura
 * de ceniza. Cada línea sube desde su propia máscara al entrar en pantalla. `accent` pinta una línea en dorado.
 */
export function SectionTitle({
  id,
  lines,
  accent,
  className = "",
  size = "lg",
}: {
  id?: string;
  lines: readonly string[];
  accent?: number;
  className?: string;
  size?: "lg" | "md";
}) {
  const reduce = useReduce();
  const sizeClass = size === "lg" ? "text-[clamp(2.1rem,6.4vw,5.75rem)]" : "text-[clamp(2.3rem,4.6vw,4rem)]";
  // El aviso de entrada lo recibe el título completo: cada línea empieza escondida bajo su máscara,
  // y un elemento recortado por completo nunca "entra en pantalla" para el IntersectionObserver.
  return (
    <motion.h2
      id={id}
      className={`font-display leading-[0.9] uppercase italic text-hueso [text-wrap:balance] ${sizeClass} ${className}`}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
    >
      {lines.map((line, i) => (
        // El relleno vertical deja ver tildes y la cursiva sin que la máscara las corte.
        // Cada línea del dato es una línea en pantalla: los títulos son de dos líneas, sin cortes extra.
        <span key={line} className="-my-[0.12em] block overflow-hidden px-[0.06em] py-[0.12em] whitespace-nowrap">
          <motion.span
            className={`block ${i === accent ? "text-oro-claro" : ""}`}
            variants={{ hidden: { y: "105%" }, shown: { y: "0%", transition: { duration: 1.1, ease, delay: i * 0.09 } } }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

/** Aparición suave: sube unos píxeles y se enfoca. Úsala para párrafos y bloques, no para títulos. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
  ...rest
}: { children: ReactNode; delay?: number; className?: string; as?: "div" | "p" | "li" | "ul" } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  const reduce = useReduce();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 1, ease, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Hilo dorado: la línea fina que conecta todo en la página. Se dibuja de izquierda a derecha al entrar. */
export function GoldRule({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  const reduce = useReduce();
  // Se observa el contenedor, que tiene su ancho real; la línea en escala 0 mide cero.
  return (
    <motion.span
      aria-hidden="true"
      className={`block h-px ${className}`}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.8 }}
    >
      <motion.span
        className="block h-full origin-left bg-gradient-to-r from-oro-claro via-oro/60 to-transparent"
        variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 1.4, ease, delay } } }}
      />
    </motion.span>
  );
}
