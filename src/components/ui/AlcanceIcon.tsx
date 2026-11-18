"use client";

import { motion } from "motion/react";
import { ease, useReduce } from "./primitives";

/**
 * Ícono de Alcance en Contacto (18-11): un globo de líneas finas con un punto dorado en Chile y un arco que sale
 * hacia afuera, "desde Chile al mundo". Mismo círculo que los otros canales. El arco se dibuja una vez al entrar
 * en pantalla, sin pulso ni destello (como los demás íconos, Aaron 12-11).
 */
export function AlcanceIcon({ className = "size-10" }: { className?: string }) {
  const reduce = useReduce();
  const view = reduce ? {} : { initial: "hidden" as const, whileInView: "shown", viewport: { once: true, amount: 0.6 } };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-oro/[0.13] text-oro-claro ring-1 ring-oro/25 ring-inset ${className}`}
    >
      <motion.svg viewBox="0 0 24 24" aria-hidden="true" className="size-[66%] overflow-visible" fill="none" {...view}>
        {/* El globo: relleno suave (los otros canales usan íconos rellenos), contorno, ecuador y un meridiano */}
        <circle cx="10" cy="14" r="7.2" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
        <ellipse cx="10" cy="14" rx="7.2" ry="2.4" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
        <ellipse cx="10" cy="14" rx="3" ry="7.2" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
        {/* Chile, al sudoeste del globo */}
        <circle cx="7.4" cy="17.6" r="1.75" fill="#e6c690" />
        {/* El alcance: un arco que nace en el borde del globo y sale hacia afuera, sin cruzarlo */}
        <motion.path
          d="M15.1 8.9 Q 17.6 3.6 22 3.4"
          stroke="#e0c08f"
          strokeWidth="1.6"
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            shown: { pathLength: 1, transition: { duration: 1, ease, delay: 0.2 } },
          }}
        />
        <motion.circle
          cx="22"
          cy="3.4"
          r="1.6"
          fill="#e6c690"
          variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.2, delay: 1.1 } } }}
        />
      </motion.svg>
    </span>
  );
}
