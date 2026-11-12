import { useId, type JSX } from "react";
import type { Locale } from "@/data/idiomas";

// Banderas en SVG propio, 3:2: Windows no dibuja las banderas emoji (muestra "CL", "US", "BR").
// A tamaño de ícono el detalle fino se pierde, así que cada una conserva solo lo que la hace reconocible.
// Chile, español; Estados Unidos, inglés; Brasil, portugués.

const CL = () => (
  <>
    <rect width="30" height="10" fill="#fff" />
    <rect y="10" width="30" height="10" fill="#d52b1e" />
    <rect width="10" height="10" fill="#0039a6" />
    <polygon
      fill="#fff"
      points="5,2.1 5.68,4.07 7.76,4.1 6.09,5.36 6.7,7.35 5,6.15 3.3,7.35 3.91,5.36 2.24,4.1 4.32,4.07"
    />
  </>
);

const STRIPE = 20 / 13;

const US = () => (
  <>
    <rect width="30" height="20" fill="#b31942" />
    {[1, 3, 5, 7, 9, 11].map((i) => (
      <rect key={i} y={i * STRIPE} width="30" height={STRIPE} fill="#fff" />
    ))}
    <rect width="12" height={STRIPE * 7} fill="#0a3161" />
    {/* Las 50 estrellas, sugeridas por una trama de puntos */}
    {[0, 1, 2, 3].flatMap((r) =>
      [0, 1, 2, 3, 4].map((c) => (
        <circle key={`${r}-${c}`} cx={1.3 + c * 2.35 + (r % 2) * 0.6} cy={1.45 + r * 2.6} r="0.42" fill="#fff" />
      )),
    )}
  </>
);

function BR() {
  const clip = `nx-flag-br-${useId().replace(/:/g, "")}`;
  return (
    <>
      <rect width="30" height="20" fill="#009c3b" />
      <polygon points="15,1.8 28.2,10 15,18.2 1.8,10" fill="#ffdf00" />
      <clipPath id={clip}>
        <circle cx="15" cy="10" r="5" />
      </clipPath>
      <circle cx="15" cy="10" r="5" fill="#002776" />
      <path d="M9.6 8.6 Q15.6 7.2 20.6 11.4" stroke="#fff" strokeWidth="1" fill="none" clipPath={`url(#${clip})`} />
    </>
  );
}

const FLAGS: Record<Locale, () => JSX.Element> = { es: CL, en: US, pt: BR };

/** Bandera del idioma, decorativa: el nombre del idioma va en texto junto a ella. */
export function Flag({ locale, className = "" }: { locale: Locale; className?: string }) {
  const Shape = FLAGS[locale];
  return (
    <svg viewBox="0 0 30 20" aria-hidden="true" focusable="false" className={className}>
      <Shape />
    </svg>
  );
}
