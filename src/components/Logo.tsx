import { useId } from "react";

// Logo provisional, compuesto en código hasta recibir el SVG oficial de NEXUS.
// Ids de degradado propios por instancia: con ids repetidos (barra y pie), si una copia se oculta,
// la otra pierde el color de la X.
export function Logo({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const a = `nexus-x-a-${uid}`;
  const b = `nexus-x-b-${uid}`;
  return (
    <span className={`inline-flex items-center font-semibold tracking-[0.06em] text-hueso ${className}`} aria-label="NEXUS">
      <span aria-hidden="true">NE</span>
      <svg aria-hidden="true" viewBox="0 0 100 112" className="mx-[0.02em] h-[1.18em] w-[1.05em] -translate-y-[0.02em]">
        <defs>
          <linearGradient id={a} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6c690" />
            <stop offset="1" stopColor="#b98d55" />
          </linearGradient>
          <linearGradient id={b} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a98252" />
            <stop offset="1" stopColor="#7c5c34" />
          </linearGradient>
        </defs>
        <polygon points="80,0 98,0 22,112 2,112" fill={`url(#${b})`} />
        <polygon points="4,0 34,0 98,112 68,112" fill={`url(#${a})`} />
      </svg>
      <span aria-hidden="true">US</span>
    </span>
  );
}
