"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { LedgerRow } from "@/data/nexus";
import { useContent } from "@/components/LocaleProvider";
import { Container, GoldRule, Reveal, Section, useReduce } from "@/components/ui/primitives";
import { Rich } from "@/components/ui/Rich";
import { PhotoBand } from "@/components/ui/PhotoBand";

type Vars = CSSProperties & Record<`--${string}`, string>;

// El hilo baja por la columna de los años en este tiempo; el nudo de cada fila prende cuando el hilo la alcanza.
const THREAD_S = 1.8;

/**
 * Registro de trayectoria. Las filas se ven siempre: antes aparecían escalonadas y, al bajar rápido, quedaban
 * vacías un instante (Aaron pidió que prendan de una, 12-11). Solo el hilo y sus nudos se animan: el hilo se
 * recoge si al hidratar el registro todavía está bajo la pantalla, y baja al entrar.
 * El estado vive en un data-atributo y las transiciones son CSS: nada de estado de React por cuadro.
 */
function Ledger() {
  const { profile } = useContent();
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReduce();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // La preferencia de movimiento reducido llega después de hidratar: si el registro ya se armó, se desarma.
    if (reduce) {
      delete el.dataset.phase;
      return;
    }
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    el.dataset.phase = "armed";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.phase = "lit";
        io.disconnect();
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const n = profile.ledger.length;

  return (
    <ol ref={ref} className="group relative mt-7 border-b border-hueso/10">
      {/* El hilo: recorre la columna de los años de arriba abajo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[5.5rem] w-px origin-top bg-gradient-to-b from-oro-claro via-oro/55 to-oro/15 transition-transform duration-[1800ms] ease-[cubic-bezier(0.45,0.1,0.35,1)] group-data-[phase=armed]:scale-y-0 sm:left-[8rem]"
      />
      {profile.ledger.map((row: LedgerRow, i) => {
        // Retraso del nudo: el momento en que el hilo llega a su altura.
        const d = { "--d": `${0.12 + (THREAD_S * (i + 0.35)) / n}s` } as Vars;
        return (
          <li key={`${row.year}-${row.name}`} className="grid grid-cols-[5.5rem_minmax(0,1fr)] border-t border-hueso/10 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <span className="py-6 pr-4 sm:py-7">
              {/* "Desde" sobre el año en lo que sigue vigente: sube al relleno de la fila para no mover el año */}
              {row.yearNote && (
                <span className="-mt-[1.1rem] mb-1.5 block text-[0.72rem] leading-none font-semibold tracking-[0.14em] text-oro-claro/80 uppercase">
                  {row.yearNote}
                </span>
              )}
              {row.year ? (
                <span className="block font-name text-[clamp(1.45rem,2.3vw,2.05rem)] leading-none font-extrabold text-oro tabular-nums [font-stretch:115%]">
                  {row.year}
                </span>
              ) : (
                row.logo && (
                  // eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes
                  <img
                    src={row.logo}
                    alt=""
                    width={320}
                    height={320}
                    loading="lazy"
                    decoding="async"
                    className="-mt-1 size-11 rounded-full shadow-[0_6px_18px_-8px_rgba(0,0,0,.85)] sm:size-12"
                  />
                )
              )}
            </span>
            <div className="relative py-6 pl-6 sm:py-7 sm:pl-9">
              {/* Nudo donde el hilo toca la fila */}
              <span
                aria-hidden="true"
                className="absolute top-[calc(1.5rem+0.45em)] -left-[3.5px] size-[7px] rounded-full bg-oro-claro shadow-[0_0_10px_rgba(224,192,143,0.55)] transition-transform duration-150 ease-out [transition-delay:var(--d)] group-data-[phase=armed]:scale-0 sm:top-[calc(1.75rem+0.5em)]"
                style={d}
              />
              <div>
                <p className="text-[1.08rem] leading-snug font-semibold text-hueso sm:text-[1.15rem]">{row.name}</p>
                {row.by && <p className="mt-1.5 text-[0.98rem] leading-relaxed text-gris">{row.by}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Perfil() {
  const { hero, profile, photos } = useContent();
  return (
    <Section id="perfil" tone="ceniza" labelledBy="perfil-title" className="pb-[clamp(3.5rem,6vw,5rem)]">
      <Container>
        <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-[clamp(2.5rem,5vw,6rem)]">
          {/* Retrato: encuadre cerrado de cabeza, hombros y parche, distinto del cuerpo completo de la hero */}
          <Reveal className="mx-auto w-full max-w-[460px] md:sticky md:top-28 md:mx-0 md:max-w-none md:self-start">
            <figure
              className="relative aspect-[4/5] max-h-[52svh] w-full overflow-hidden md:max-h-none"
              // Sin marco: los bordes se disuelven en el fondo, como Domingo emerge del humo en la hero.
              style={{
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent), linear-gradient(180deg, transparent, #000 9%, #000 66%, transparent)",
                maskImage:
                  "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent), linear-gradient(180deg, transparent, #000 9%, #000 66%, transparent)",
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center opacity-45"
                style={{ backgroundImage: "url(/hero/humo.webp)" }}
              />
              {/* Brasa que asoma por el borde derecho, abajo: la única luz saturada del cuadro */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(55% 45% at 104% 82%, rgba(255,110,34,.26), transparent 70%), radial-gradient(70% 40% at 50% 112%, rgba(255,110,34,.12), transparent 70%)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
              <img
                src="/hero/domingo.webp"
                alt={profile.portraitAlt}
                width={950}
                height={1503}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover object-top"
                // Filtro fijo, nunca animado. La escala desde un origen sobre el marco deja aire sobre la cabeza.
                style={{
                  transform: "scale(1.26)",
                  transformOrigin: "50% -12%",
                  filter: "grayscale(.35) contrast(1.05) brightness(.9) sepia(.06)",
                }}
              />
              {/* Fundido inferior hacia el fondo y un leve viñeteado para que la foto no flote */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(29,24,21,.96) 0%, rgba(29,24,21,.55) 16%, transparent 38%), radial-gradient(120% 80% at 50% 30%, transparent 55%, rgba(18,15,13,.45) 100%)",
                }}
              />
            </figure>
          </Reveal>

          <div className="min-w-0">
            <Reveal>
              <h2 id="perfil-title" className="font-name text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.02] font-extrabold tracking-[0.005em] text-hueso uppercase [font-stretch:115%]">
                <span className="block">{hero.firstName}</span>
                <span className="block text-oro-claro">{hero.lastName}</span>
              </h2>
              <GoldRule className="mt-6 w-[clamp(72px,8vw,120px)]" delay={0.3} />
              <p className="mt-5 max-w-[46ch] text-[0.95rem] font-semibold tracking-[0.08em] text-oro-claro uppercase [text-wrap:balance]">
                {/* Guion que no se corta: "IAAI-FIT" no debe partirse entre dos líneas */}
                {profile.role.replace(/-/g, "‑")}
              </p>
              {/* Logos del portafolio PDF del cliente; Aaron pidió usarlos (10-11). El logo carga la credencial; el nombre va debajo, corto */}
              <ul aria-label={profile.sealsLabel} className="mt-6 grid max-w-[34rem] grid-cols-3 gap-4 sm:gap-6">
                {profile.seals.map((seal, i) => (
                  <Reveal as="li" key={seal.name} delay={0.1 + i * 0.1} className="flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sin optimizador de imágenes */}
                    <img
                      src={seal.logo}
                      alt={profile.sealAlt(seal.name)}
                      width={320}
                      height={320}
                      loading="lazy"
                      decoding="async"
                      className="size-[clamp(4.5rem,9vw,6rem)] rounded-full shadow-[0_10px_26px_-12px_rgba(0,0,0,.8)]"
                    />
                    <span className="mt-3 text-[0.85rem] leading-snug font-semibold text-hueso [text-wrap:balance] sm:text-[0.9rem]">
                      {seal.name.replace("-", "‑")}
                    </span>
                    <span className="mt-0.5 max-sm:hidden text-[0.78rem] leading-snug text-gris [text-wrap:balance] sm:text-[0.82rem]">{seal.by}</span>
                  </Reveal>
                ))}
              </ul>
              <p className="mt-6 max-w-[60ch] text-[1.1rem] leading-relaxed text-hueso/90">
                <Rich text={profile.bio} />
              </p>
            </Reveal>

            <h3 className="mt-10 text-[1.05rem] font-semibold tracking-[0.02em] text-hueso sm:mt-14">{profile.ledgerTitle}</h3>
            <Ledger />
          </div>
        </div>

        {/* Cierre del perfil: el abogado y el investigador en una misma conversación */}
        <PhotoBand
          {...photos.reunion}
          position="58% 35%"
          className="mt-[clamp(3rem,7vw,6rem)] aspect-[4/3] w-full sm:aspect-[16/9]"
        />
      </Container>
    </Section>
  );
}
