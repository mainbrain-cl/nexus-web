import { Fragment } from "react";

/**
 * Texto con palabras destacadas. En `nexus.ts` se marcan con **dobles asteriscos**; aquí se convierten en
 * negrita en el color principal, para que el ojo encuentre las ideas clave al escanear el párrafo.
 */
export function Rich({ text, strongClass = "font-semibold text-hueso" }: { text: string; strongClass?: string }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className={strongClass}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** El mismo texto sin las marcas, para atributos y lectores que no deben ver asteriscos. */
export const plain = (text: string) => text.replace(/\*\*/g, "");
