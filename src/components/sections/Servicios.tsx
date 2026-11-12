"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Arrow } from "@/components/Arrow";
import { Container, GoldRule, Reveal, Section, SectionTitle, ease, useReduce } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { Rich } from "@/components/ui/Rich";
import { services, servicesIntro, type Service } from "@/data/nexus";
import { contactFormHref } from "@/data/formulario";

// Ids fijos: la sección existe una sola vez en la página. Escritorio y celular usan prefijos distintos
// para no repetir ids, porque las dos versiones están en el HTML y solo el CSS decide cuál se ve.
const TITLE_ID = "servicios-titulo";
const PANEL_ID = "servicios-panel";
const tabId = (s: Service) => `servicios-tab-${s.id}`;
const accButtonId = (s: Service) => `servicios-acc-btn-${s.id}`;
const accRegionId = (s: Service) => `servicios-acc-${s.id}`;

export function Servicios() {
  // Solo la versión de escritorio usa este índice; el acordeón lleva su propio estado.
  const [active, setActive] = useState(0);

  return (
    // overflow-clip en lugar de hidden: hidden vuelve la sección un contenedor de scroll y anula el sticky del panel.
    <Section id="servicios" tone="humo" labelledBy={TITLE_ID} className="overflow-clip!">
      <Container>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-x-[clamp(3rem,6vw,6.5rem)]">
          <div>
            <SectionTitle id={TITLE_ID} lines={servicesIntro.title} accent={1} size="md" />
            <Reveal as="p" delay={0.15} className="mt-7 max-w-[44ch] text-[1.08rem] leading-relaxed text-gris">
              <Rich text={servicesIntro.text} />
            </Reveal>

            <SituationTabs active={active} onSelect={setActive} />
            <SituationAccordion />
          </div>

          <div className="hidden lg:block">
            {/* Queda fijo mientras la lista sigue en pantalla: el visitante recorre situaciones sin perder el detalle */}
            <div className="sticky top-24 pt-2">
              <ServicePanel service={services[active]} />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ---------- Escritorio: lista de situaciones como pestañas ---------- */

function SituationTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const reduce = useReduce();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Activación automática: mover el foco con las flechas cambia el servicio, como en el patrón ARIA de pestañas.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = services.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowDown") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowUp") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    onSelect(next);
    tabs.current[next]?.focus();
  };

  const slide = reduce ? { duration: 0 } : { duration: 0.55, ease };
  // La brasa llega un instante después que el hilo, con un resorte corto: se lee como algo que se desliza.
  const emberSlide = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.9 };

  return (
    <div
      role="tablist"
      aria-labelledby={TITLE_ID}
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      className="relative mt-14 hidden lg:block"
    >
      {/* El hilo de fondo: la vía por donde corre la brasa. Se dibuja de arriba hacia abajo al entrar. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-px origin-top bg-hueso/10"
        initial={reduce ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.4, ease, delay: 0.2 }}
      />

      {services.map((s, i) => {
        const selected = i === active;
        return (
          <button
            key={s.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={tabId(s)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={PANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(i)}
            className="group relative block w-full cursor-pointer rounded-none py-5 pr-4 pl-9 text-left text-[1.15rem] focus-visible:rounded-xl"
          >
            {selected && (
              <>
                <motion.span
                  layoutId="servicios-hilo"
                  aria-hidden="true"
                  className="absolute top-[calc(1.25rem+0.69em)] bottom-5 left-0 w-px bg-gradient-to-b from-oro-claro via-oro/70 to-oro/0"
                  transition={slide}
                />
                <motion.span
                  layoutId="servicios-brasa"
                  aria-hidden="true"
                  className="absolute top-[calc(1.25rem+0.69em-3.5px)] left-[-3px] size-[7px] rounded-full bg-[#ffb070] shadow-[0_0_0_1.5px_#ff7a2a,0_0_12px_2px_rgba(255,122,42,0.55)]"
                  transition={emberSlide}
                />
              </>
            )}
            {/* El nombre del servicio es lo primero que se lee; la situación lo explica en palabras del cliente */}
            <span className="flex items-start gap-3.5">
              <Icon
                name={s.id as IconName}
                mode="static"
                badge
                className={`mt-[-0.15rem] size-9 transition-opacity duration-500 ${selected ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
              />
              <span className="min-w-0">
                <span
                  className={`block text-[1.08rem] leading-snug font-semibold [text-wrap:balance] transition-colors duration-500 ease-expo ${
                    selected ? "text-hueso" : "text-hueso/80 group-hover:text-hueso/90"
                  }`}
                >
                  {s.name}
                </span>
                <span
                  className={`mt-1 block text-[0.9rem] leading-snug [text-wrap:pretty] transition-colors duration-500 ease-expo text-gris`}
                >
                  {s.situation}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Escritorio: panel del servicio activo ---------- */

function ServicePanel({ service }: { service: Service }) {
  const reduce = useReduce();

  return (
    // Altura mínima del servicio más largo (nombre en tres líneas y chips en tres filas, a 1024 px): así el
    // panel no cambia de alto al cambiar de pestaña. La columna de pestañas es más alta, así que no deja hueco.
    <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(service)} tabIndex={0} className="min-h-[36rem] rounded-sm">
      {/* initial={false}: el primer servicio llega ya escrito en el HTML; solo los cambios se animan */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={service.id}
          initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease } }}
          exit={
            reduce
              ? undefined
              : { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }
          }
        >
          {/* Va dentro del bloque con key: se vuelve a dibujar cada vez que cambia el servicio */}
          <Icon name={service.id as IconName} badge delay={0.1} className="mb-7 size-16" />
          <h3 className="font-display text-[clamp(2rem,2.9vw,2.75rem)] leading-[0.95] text-hueso uppercase italic [text-wrap:balance]">
            {service.name}
          </h3>
          <GoldRule className="mt-6 w-40" />
          <ServiceBody service={service} staggerItems={!reduce} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Contenido común a escritorio y celular ---------- */

function ServiceBody({ service, staggerItems }: { service: Service; staggerItems: boolean }) {
  return (
    <>
      <p className="mt-5 max-w-[58ch] text-[1.06rem] leading-relaxed text-hueso/85 [text-wrap:pretty] lg:mt-6">
        <Rich text={service.text} />
      </p>

      <h4 className="mt-7 text-[0.95rem] font-semibold text-oro-claro lg:mt-8">{servicesIntro.includesTitle}</h4>
      {/* Chips, no botones: sin hover ni cursor. El texto puede partirse en dos líneas para no salirse a 320 px. */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {service.includes.map((item, i) => (
          <motion.li
            key={item}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-oro/25 bg-oro/[0.07] py-1.5 pr-4 pl-3 text-[0.92rem] leading-snug text-hueso/90"
            initial={staggerItems ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.14 + i * 0.05 }}
          >
            <Icon name="sello" mode="static" className="size-4 text-oro-claro" />
            <span className="min-w-0">{item}</span>
          </motion.li>
        ))}
      </ul>

      <a
        href={contactFormHref(service.id)}
        className="btn btn-oro mt-8 h-14 w-full justify-center px-8 text-[0.85rem] max-sm:px-5 max-sm:text-[0.78rem] max-sm:tracking-[0.06em] max-sm:whitespace-nowrap sm:w-auto"
      >
        {service.cta}
        {/* Fuera de contexto el botón no diría de qué servicio se trata ni adónde lleva */}
        <span className="sr-only">: {service.name}</span>
        <Arrow className="btn-arrow size-4" />
      </a>
    </>
  );
}

/* ---------- Celular y tablet: acordeón ---------- */

function SituationAccordion() {
  const reduce = useReduce();
  const [open, setOpen] = useState<string | null>(services[0].id);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  // Al cerrarse el bloque de arriba, el que se abrió puede quedar sobre el borde de la pantalla: se acerca con suavidad.
  const keepInView = (s: Service) => {
    const btn = buttons.current[s.id];
    if (!btn) return;
    const top = btn.getBoundingClientRect().top;
    // 72 px mide la barra de navegación ya compacta.
    if (top < 80) window.scrollTo({ top: window.scrollY + top - 96, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <ul className="mt-12 border-b border-hueso/10 lg:hidden">
      {services.map((s) => {
        const isOpen = open === s.id;
        return (
          <li key={s.id} className="relative border-t border-hueso/10">
            {/* El hilo dorado y la brasa marcan la situación abierta, igual que en escritorio */}
            <motion.span
              aria-hidden="true"
              className="absolute -top-px left-0 h-px w-full origin-left bg-gradient-to-r from-oro-claro via-oro/60 to-transparent"
              initial={false}
              animate={{ scaleX: isOpen ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, ease }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute -top-[4px] left-0 size-[7px] rounded-full bg-[#ffb070] shadow-[0_0_0_1.5px_#ff7a2a,0_0_12px_2px_rgba(255,122,42,0.55)]"
              initial={false}
              animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.4 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease }}
            />

            <h3>
              <button
                ref={(el) => {
                  buttons.current[s.id] = el;
                }}
                id={accButtonId(s)}
                type="button"
                aria-expanded={isOpen}
                aria-controls={accRegionId(s)}
                onClick={() => setOpen(isOpen ? null : s.id)}
                className="flex min-h-[44px] w-full cursor-pointer items-start justify-between gap-5 py-6 text-left focus-visible:rounded-xl"
              >
                <span className="flex items-start gap-3.5">
                  <Icon name={s.id as IconName} mode="static" badge className={`mt-[-0.1rem] size-9 ${isOpen ? "opacity-100" : "opacity-60"}`} />
                  <span className="min-w-0">
                    <span
                      className={`block text-[1.08rem] leading-snug font-semibold [text-wrap:balance] transition-colors duration-500 ease-expo ${
                        isOpen ? "text-hueso" : "text-hueso/75"
                      }`}
                    >
                      {s.name}
                    </span>
                    <span className="mt-1 block text-[0.9rem] leading-snug text-gris">{s.situation}</span>
                  </span>
                </span>
                <PlusMinus open={isOpen} />
              </button>
            </h3>

            <motion.div
              id={accRegionId(s)}
              role="region"
              aria-labelledby={accButtonId(s)}
              // inert saca el contenido cerrado del foco y del lector de pantalla, aunque siga en el HTML.
              inert={!isOpen}
              className="-mx-4 overflow-hidden px-4"
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.55, ease }}
              onAnimationComplete={() => {
                if (isOpen) keepInView(s);
              }}
            >
              <div className="pb-9">
                <span aria-hidden="true" className="block h-px w-24 bg-gradient-to-r from-oro-claro via-oro/60 to-transparent" />
                <ServiceBody service={s} staggerItems={false} />
              </div>
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}

/** Más y menos dibujados: la barra vertical gira hasta acostarse y el conjunto da media vuelta. */
function PlusMinus({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-500 ease-expo ring-inset ${
        open ? "text-oro-claro ring-oro/60" : "text-hueso/80 ring-hueso/15"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`size-4 transition-transform duration-500 ease-expo motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
      >
        <path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M10 4v12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`origin-center transition-transform duration-500 ease-expo [transform-box:fill-box] motion-reduce:transition-none ${
            open ? "rotate-90" : ""
          }`}
        />
      </svg>
    </span>
  );
}
