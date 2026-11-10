"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

// Con "reducir movimiento" activo en el sistema, Motion hace instantáneos los desplazamientos y escalas
// de toda la página; las apariciones quedan como fundidos simples.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
