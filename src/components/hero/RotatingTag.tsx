"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReduce } from "@/components/ui/primitives";

const ease = [0.16, 1, 0.3, 1] as const;

/** Etiqueta sobre el nombre: una brasa que late y frases que suben una tras otra. */
export function RotatingTag({ items, startDelay = 4600, every = 2600, className = "" }: {
  items: readonly string[];
  startDelay?: number;
  every?: number;
  className?: string;
}) {
  const reduce = useReduce();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce || items.length < 2) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      setI(1);
      id = setInterval(() => setI((v) => (v + 1) % items.length), every);
    }, startDelay);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [reduce, items.length, startDelay, every]);

  return (
    <span className={`in-tag inline-flex ${className}`}>
      <span className="sr-only">{items.join(". ")}</span>
      <motion.span
        layout
        transition={{ layout: { duration: 0.6, ease } }}
        aria-hidden="true"
        className="relative inline-flex h-9 items-center gap-2.5 overflow-hidden rounded-full border border-oro/35 bg-ceniza/55 pr-4 pl-3 text-[0.78rem] font-semibold tracking-[0.08em] whitespace-nowrap text-oro-claro uppercase shadow-[0_8px_24px_-10px_rgba(0,0,0,.8)] sm:h-10 sm:text-[0.82rem]"
      >
        <motion.span layout="position" className="relative flex size-2 shrink-0">
          <span className="ember-ping absolute inset-0 rounded-full bg-brasa" />
          <span className="relative size-2 rounded-full bg-brasa shadow-[0_0_8px_2px_rgba(255,122,42,.55)]" />
        </motion.span>
        <span className="relative flex h-[1.3em] items-center overflow-hidden">
          {/* La frase sube dentro de su máscara al entrar la etiqueta */}
          <span className="in-tag-text block">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={items[i]}
              className="block"
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-110%", opacity: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              {items[i]}
            </motion.span>
          </AnimatePresence>
          </span>
        </span>
      </motion.span>
    </span>
  );
}
