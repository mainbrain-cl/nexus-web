"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { ease, useReduce } from "./primitives";

/**
 * Foto de sección: se abre desde una ranura horizontal y se asienta con un leve acercamiento, como un
 * expediente que se despliega. Tono cálido y apagado fijo (nunca animado) para vivir en el humo.
 * Esquinas redondeadas, del mismo lenguaje que los botones (pedido de Aaron, 10-11).
 */
export function PhotoBand({
  src,
  alt,
  width,
  height,
  caption,
  position = "50% 50%",
  desktopPosition,
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Texto opcional en la esquina inferior; por defecto no lleva. */
  caption?: string;
  position?: string;
  /** Encuadre desde 1024 px, si cambia respecto del de celular. */
  desktopPosition?: string;
  className?: string;
}) {
  const reduce = useReduce();
  return (
    // El aviso de entrada lo recibe el contenedor, que tiene su tamaño real desde el inicio.
    <motion.figure
      className={`relative isolate overflow-hidden rounded-[1.25rem] bg-humo sm:rounded-[1.75rem] lg:rounded-[2.25rem] ${className}`}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div
        className="absolute inset-0"
        variants={{
          hidden: { clipPath: "inset(18% 0% 18% 0%)" },
          shown: { clipPath: "inset(0% 0% 0% 0%)", transition: reduce ? { duration: 0 } : { duration: 1.4, ease } },
        }}
      >
        <motion.img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="nx-photo size-full object-cover"
          style={
            {
              "--nx-pos": position,
              "--nx-pos-lg": desktopPosition ?? position,
              filter: "brightness(.86) saturate(.85) contrast(1.04)",
            } as CSSProperties
          }
          variants={{ hidden: { scale: 1.08 }, shown: { scale: 1, transition: reduce ? { duration: 0 } : { duration: 2, ease } } }}
        />
        {/* Viñeta hacia el fondo de la página: la foto no flota como un recuadro */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgba(18,15,13,.7), transparent 38%), radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(18,15,13,.55) 100%)",
          }}
        />
      </motion.div>
      {caption && (
        <figcaption className="absolute right-4 bottom-3 text-[0.72rem] font-medium tracking-[0.14em] text-hueso/55 uppercase sm:right-6 sm:bottom-4">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
