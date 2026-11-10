"use client";

import { Container, Reveal, Section, SectionTitle } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { PhotoBand } from "@/components/ui/PhotoBand";
import { Rich } from "@/components/ui/Rich";
import { photos, result, type Verdict } from "@/data/nexus";

// Resultado: qué entrega una auditoría, en una imagen y tres resultados posibles.
// Antes era una hoja de informe simulada; Aaron la quitó por ser texto inventado que no aporta (10-11).

const TITLE_ID = "resultado-titulo";

const VERDICT_ICON: Record<Verdict, IconName> = {
  sustentada: "sello",
  respaldo: "controvertidas",
  no: "descartada",
};

export function Resultado() {
  return (
    <Section id="resultado" tone="humo" labelledBy={TITLE_ID}>
      <Container>
        {/* Escritorio: la foto a la izquierda y, al lado, título, línea y los tres resultados.
            Celular: título, línea, resultados y foto. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-x-[clamp(3rem,5.5vw,6rem)]">
          <div className="lg:order-2">
            <SectionTitle id={TITLE_ID} lines={result.title} accent={1} size="md" />
            <Reveal as="p" delay={0.15} className="mt-6 max-w-[42ch] text-[1.08rem] leading-relaxed text-gris">
              <Rich text={result.text} />
            </Reveal>

            {/* Los tres resultados posibles de una revisión: ícono relleno y nombre, nada más */}
            <ul className="mt-9 grid gap-3">
              {result.levels.map((level, i) => (
                <Reveal
                  as="li"
                  key={level.id}
                  delay={0.2 + i * 0.12}
                  className="flex items-center gap-4 rounded-full border border-oro/20 bg-oro/[0.06] py-2 pr-6 pl-2"
                >
                  <Icon name={VERDICT_ICON[level.id]} badge delay={0.3 + i * 0.12} className="size-11" />
                  <span className="text-[1.08rem] font-semibold text-hueso">{level.name}</span>
                </Reveal>
              ))}
            </ul>
          </div>

          <PhotoBand {...photos.informe} position="45% 45%" className="aspect-[4/3] w-full lg:order-1" />
        </div>
      </Container>
    </Section>
  );
}
