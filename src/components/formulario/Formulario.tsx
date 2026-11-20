"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, SealCheck, WhatsappLogo } from "@phosphor-icons/react";
import {
  getFormTexts,
  limits,
  openFormEvent,
  resolveServiceId,
  servicesWithoutIncident,
  statusVariantByService,
  type ClientId,
  type Locale,
  type ServiceId,
  type StatusId,
  type UrgencyId,
} from "@/data/formulario";
import { contact, whatsapp } from "@/data/nexus";
import { cleanLine, isEmail, isPhone, stripForbidden, type ContactPayload } from "@/lib/contacto";
import { Arrow } from "@/components/Arrow";
import { ease, useReduce } from "@/components/ui/primitives";

// Formulario de contacto condicional: una pregunta por pantalla, con avance, vuelta atrás y opciones grandes.
// Las preguntas de selección única avanzan solas al elegir. Los textos vienen de `src/data/formulario.ts`.

type StepId = "cliente" | "servicio" | "estado" | "caso" | "contacto";

type Data = {
  cliente: ClientId | "";
  clienteOtro: string;
  servicio: ServiceId | "";
  estado: StatusId[];
  lugar: string;
  fecha: string;
  descripcion: string;
  urgencia: UrgencyId | "";
  plazoDetalle: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
};

type Field = keyof Data;
type Errors = Partial<Record<Field, string>>;
type Phase = "form" | "sending" | "done";
type SendError = "invalido" | "limite" | "noDisponible" | "envio" | "verificacion" | "vencido" | "red" | null;

/** Código de error del servidor → mensaje del formulario. */
const SERVER_ERRORS: Record<string, Exclude<SendError, null>> = {
  invalido: "invalido",
  limite: "limite",
  "no-disponible": "noDisponible",
  error: "envio",
  verificacion: "verificacion",
  vencido: "vencido",
};

/** Altura de la barra de navegación fija; coincide con el `scroll-padding-top` global (6rem). */
const NAV_HEIGHT = 96;
/** Espera mínima entre recibir el token y enviar: el servidor exige 4 s y aquí se deja margen. */
const TOKEN_WAIT_MS = 4500;
/** Pasado este tiempo se pide un token nuevo antes de enviar (el servidor los acepta hasta 6 h). */
const TOKEN_REFRESH_MS = 5 * 60 * 60 * 1000;

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Token = { value: string; at: number };
type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

const sleep = (ms: number) => new Promise((ok) => window.setTimeout(ok, ms));

const EMPTY: Data = {
  cliente: "",
  clienteOtro: "",
  servicio: "",
  estado: [],
  lugar: "",
  fecha: "",
  descripcion: "",
  urgencia: "",
  plazoDetalle: "",
  nombre: "",
  empresa: "",
  correo: "",
  telefono: "",
};

const AUTO_ADVANCE_MS = 280; // deja ver la opción marcada antes de pasar

const variantOf = (d: Data) => (d.servicio ? statusVariantByService[d.servicio] : "revision");

/** Los pasos que ve el visitante según lo que lleva respondido. */
function stepsFor(d: Data): StepId[] {
  return ["cliente", "servicio", ...(variantOf(d) ? (["estado"] as const) : []), "caso", "contacto"];
}

const needsDeadline = (u: Data["urgencia"]) => u === "semanas" || u === "urgente";

// ---------- Piezas visuales ----------

const OPTION =
  "group relative flex w-full items-center gap-4 rounded-[1.1rem] border px-5 py-4 text-left text-[1.02rem] leading-snug transition-[background-color,border-color,color,transform] duration-300 ease-expo focus-visible:rounded-[1.1rem] active:scale-[0.99] sm:min-h-[4.25rem]";
const OPTION_OFF = "border-hueso/[0.12] bg-ceniza/40 text-hueso/90 hover:border-oro/60 hover:bg-oro/[0.06] hover:text-hueso";
const OPTION_ON = "border-oro bg-oro/[0.13] text-hueso";

const INPUT =
  "w-full border bg-ceniza/70 px-5 text-[1.02rem] text-hueso placeholder:text-gris/55 transition-[border-color,box-shadow] duration-300 focus-visible:outline-none focus:border-oro-claro focus:shadow-[0_0_0_3px_rgba(224,192,143,0.22)]";

/** Marca de la opción: círculo para elección única y casilla cuadrada con visto para varias. */
function Node({ on, multi }: { on: boolean; multi?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-[1.35rem] shrink-0 place-items-center border ${multi ? "rounded-[0.3rem]" : "rounded-full"} transition-[background-color,border-color,box-shadow] duration-300 ${
        on ? "border-oro-claro bg-oro-claro shadow-[0_0_12px_2px_rgba(255,122,42,0.45)]" : "border-hueso/30 group-hover:border-oro/70"
      }`}
    >
      {multi ? (
        <Check weight="bold" className={`size-3 text-ceniza transition-opacity duration-200 ${on ? "opacity-100" : "opacity-0"}`} />
      ) : (
        <span className={`size-2 rounded-full bg-ceniza transition-transform duration-300 ${on ? "scale-100" : "scale-0"}`} />
      )}
    </span>
  );
}

function OptionText({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span>{label}</span>
      {hint && <span className="text-[0.72rem] font-semibold tracking-[0.14em] text-oro-claro uppercase">{hint}</span>}
    </span>
  );
}

/** Campo con label real, ayuda opcional y error asociado. */
function FieldShell({
  id,
  label,
  optional,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  optional?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[0.95rem] font-semibold text-hueso">
        {label}
        {optional && " "}
        {optional && <span className="ml-1 text-[0.8rem] font-normal text-gris">({optional})</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[0.9rem] text-brasa">
          {error}
        </p>
      )}
    </div>
  );
}

/** Progreso: el hilo dorado con un nodo por paso. */
function Progress({ id, index, total, label }: { id: string; index: number; total: number; label: string }) {
  const reduce = useReduce();
  return (
    <div className="flex flex-col gap-3">
      <p id={id} className="text-[0.74rem] font-semibold tracking-[0.18em] text-gris uppercase">
        {label}
      </p>
      <div
        className="relative h-[13px]"
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-valuetext={label}
      >
        <span aria-hidden="true" className="absolute inset-x-[6px] top-1/2 h-px -translate-y-1/2 bg-hueso/15" />
        <motion.span
          aria-hidden="true"
          className="absolute top-1/2 left-[6px] h-px origin-left -translate-y-1/2 bg-gradient-to-r from-oro to-oro-claro"
          style={{ right: 6 }}
          initial={false}
          animate={{ scaleX: total > 1 ? index / (total - 1) : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.7, ease }}
        />
        <ol aria-hidden="true" className="absolute inset-0 flex items-center justify-between">
          {Array.from({ length: total }, (_, i) => (
            <li
              key={i}
              className={`rounded-full transition-[background-color,box-shadow,width,height] duration-500 ${
                i < index
                  ? "size-[9px] bg-oro"
                  : i === index
                    ? "size-[13px] bg-oro-claro shadow-[0_0_12px_2px_rgba(255,122,42,0.55)]"
                    : "size-[9px] border border-hueso/30 bg-humo"
              }`}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------- Cloudflare Turnstile (solo si existe NEXT_PUBLIC_TURNSTILE_SITE_KEY) ----------

let turnstileScript: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if ((window as { turnstile?: TurnstileApi }).turnstile) return Promise.resolve();
  turnstileScript ??= new Promise<void>((ok, ko) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      turnstileScript = null;
      ko(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return turnstileScript;
}

const turnstileApi = () => (window as { turnstile?: TurnstileApi }).turnstile;

/**
 * Verificación anti-robots en el último paso. Con `appearance: "interaction-only"` no se ve nada salvo que
 * Cloudflare necesite que la persona marque la casilla.
 */
function TurnstileBox({
  language,
  tokenRef,
  widgetRef,
}: {
  language: string;
  tokenRef: { current: string };
  widgetRef: { current: string | null };
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    let id: string | null = null;
    loadTurnstile()
      .then(() => {
        const api = turnstileApi();
        if (!alive || !box.current || !api) return;
        id = api.render(box.current, {
          sitekey: TURNSTILE_KEY,
          appearance: "interaction-only",
          theme: "dark",
          language,
          action: "contacto",
          "refresh-expired": "auto",
          callback: (token: string) => {
            tokenRef.current = token;
          },
          "expired-callback": () => {
            tokenRef.current = "";
          },
          "error-callback": () => {
            tokenRef.current = "";
          },
        });
        widgetRef.current = id;
      })
      .catch(() => {
        // Sin el script de Cloudflare el envío avisa con el mensaje de verificación.
      });
    return () => {
      alive = false;
      tokenRef.current = "";
      widgetRef.current = null;
      if (id) turnstileApi()?.remove(id);
    };
  }, [language, tokenRef, widgetRef]);
  return <div ref={box} className="mt-6 empty:hidden" />;
}

// ---------- Formulario ----------

export function Formulario({ locale = "es" }: { locale?: Locale }) {
  const t = getFormTexts(locale);
  const reduce = useReduce();
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [data, setData] = useState<Data>(EMPTY);
  const [step, setStep] = useState<StepId>("cliente");
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [sendError, setSendError] = useState<SendError>(null);
  // Servicio elegido desde fuera (tarjeta de servicio o enlace): el paso 2 se salta al avanzar.
  const [preselected, setPreselected] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const errorTitleRef = useRef<HTMLParagraphElement>(null);
  const errorPanelRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<Data>(EMPTY);
  const stepRef = useRef<StepId>("cliente");
  const phaseRef = useRef<Phase>("form");
  const sendingRef = useRef(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  // Token de tiempo firmado por el servidor: se pide en la primera interacción con el formulario.
  const tokenRef = useRef<Token | null>(null);
  const tokenPromise = useRef<Promise<Token> | null>(null);
  const turnstileToken = useRef("");
  const turnstileWidget = useRef<string | null>(null);
  const navigated = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const steps = stepsFor(data);
  const index = Math.max(0, steps.indexOf(step));
  // Mientras no hay servicio se muestra el total de la rama más común (con paso de estado); al elegir se ajusta.
  const totalSteps = data.servicio ? steps.length : 5;
  const st = t.steps;
  const done = phase === "done";

  useEffect(() => {
    dataRef.current = data;
    stepRef.current = step;
    phaseRef.current = phase;
  }, [data, step, phase]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // ----- Token de tiempo -----
  const fetchToken = useCallback(() => {
    const p = fetch("/api/contacto/", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ token?: unknown }>) : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        const tk: Token = { value: typeof b.token === "string" ? b.token : "", at: Date.now() };
        if (tokenPromise.current === p) tokenRef.current = tk;
        return tk;
      });
    tokenPromise.current = p;
    p.catch(() => {
      if (tokenPromise.current === p) tokenPromise.current = null;
    });
    return p;
  }, []);

  /** Token nuevo: después de un envío exitoso o al empezar otra consulta. */
  const renewToken = useCallback(() => {
    tokenRef.current = null;
    fetchToken().catch(() => {});
  }, [fetchToken]);

  /** Primera interacción: pide el token si aún no lo hay. */
  const touch = useCallback(() => {
    if (!tokenRef.current && !tokenPromise.current) fetchToken().catch(() => {});
  }, [fetchToken]);

  const getToken = async (): Promise<Token> => {
    const tk = tokenRef.current;
    if (tk && Date.now() - tk.at < TOKEN_REFRESH_MS) return tk;
    if (!tk && tokenPromise.current) return tokenPromise.current;
    return fetchToken();
  };

  // Al cambiar de paso o al terminar (no al cargar la página), si el formulario quedó bajo la barra fija, se trae.
  useEffect(() => {
    if (!navigated.current) return;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < NAV_HEIGHT) root.scrollIntoView({ block: "start" });
  }, [step, done]);

  // Si el envío falla, el panel de error queda a la vista y con el foco.
  useEffect(() => {
    if (!sendError || phase !== "form") return;
    errorTitleRef.current?.focus({ preventScroll: true });
    errorPanelRef.current?.scrollIntoView({ block: "nearest" });
  }, [sendError, phase]);

  // El foco va a la pregunta recién cuando aparece: con AnimatePresence el paso nuevo se monta después de la salida.
  const headingCallback = useCallback((el: HTMLHeadingElement | null) => {
    headingRef.current = el;
    if (el && navigated.current) el.focus({ preventScroll: true });
  }, []);

  const go = useCallback((to: StepId, direction: number) => {
    window.clearTimeout(timer.current);
    navigated.current = true;
    setDir(direction);
    setErrors({});
    setStep(to);
  }, []);

  /** Paso siguiente a `from` con los datos `d`; salta el paso 2 si el servicio vino elegido. */
  const nextOf = useCallback(
    (from: StepId, d: Data) => {
      const list = stepsFor(d);
      let i = list.indexOf(from) + 1;
      if (list[i] === "servicio" && preselected && d.servicio) i++;
      return list[Math.min(i, list.length - 1)];
    },
    [preselected],
  );

  // ----- Abrir con un servicio elegido: `#contacto?servicio=…`, `?servicio=…#contacto` o el evento -----
  const preselect = useCallback(
    (raw: string | null | undefined, fromClick: boolean) => {
      const servicio = resolveServiceId(raw);
      const section = document.getElementById("contacto");
      if (section) section.scrollIntoView({ block: "start" });
      // Mientras se envía, no se toca la consulta en curso.
      if (!servicio || phaseRef.current === "sending") return;
      const wasDone = phaseRef.current === "done";
      setPhase("form");
      setSendError(null);
      setPreselected(true);
      // Después de una consulta enviada se parte de cero y con un token nuevo.
      if (wasDone) renewToken();
      else touch();
      const d = wasDone ? EMPTY : dataRef.current;
      const nd = { ...d, servicio, estado: d.servicio === servicio ? d.estado : [] };
      setData(nd);
      const to: StepId = nd.cliente ? (stepsFor(nd).includes("estado") ? "estado" : "caso") : "cliente";
      const sameStep = !wasDone && stepRef.current === to;
      go(to, 1);
      // Desde un clic, el foco va a la pregunta. Si el paso cambia, lo hace `headingCallback` al montarse.
      if (fromClick && sameStep) requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    },
    [go, renewToken, touch],
  );

  useEffect(() => {
    const fromUrl = (fromClick: boolean) => {
      const { hash, search, pathname } = window.location;
      const m = /^#contacto\?(.*)$/.exec(hash);
      const hashParams = new URLSearchParams(m ? m[1] : "");
      const searchParams = new URLSearchParams(search);
      const value = m ? hashParams.get("servicio") : hash === "#contacto" ? searchParams.get("servicio") : null;
      if (!m && value === null) return;
      if (value !== null) {
        // Se borra solo `servicio` (se conservan utm_* y los demás) para que un segundo clic en el mismo enlace
        // vuelva a funcionar.
        (m ? hashParams : searchParams).delete("servicio");
        const query = searchParams.toString();
        const rest = hashParams.toString();
        window.history.replaceState(window.history.state, "", `${pathname}${query ? `?${query}` : ""}#contacto${rest ? `?${rest}` : ""}`);
      }
      preselect(value, fromClick);
    };
    const onHash = () => fromUrl(true);
    const onEvent = (e: Event) => preselect((e as CustomEvent<{ servicio?: string }>).detail?.servicio, true);
    fromUrl(false);
    window.addEventListener("hashchange", onHash);
    window.addEventListener(openFormEvent, onEvent);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener(openFormEvent, onEvent);
    };
  }, [preselect]);

  // ----- Edición -----
  const set = <K extends Field>(k: K, v: Data[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const chooseCliente = (id: ClientId) => {
    const nd = { ...data, cliente: id };
    setData(nd);
    setErrors({});
    window.clearTimeout(timer.current);
    if (id === "otro") return; // muestra el campo "¿Quién?" y espera a Continuar
    timer.current = window.setTimeout(() => go(nextOf("cliente", nd), 1), AUTO_ADVANCE_MS);
  };

  const chooseServicio = (id: ServiceId) => {
    const nd = { ...data, servicio: id, estado: data.servicio === id ? data.estado : [] };
    setData(nd);
    setErrors({});
    setPreselected(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => go(nextOf("servicio", nd), 1), AUTO_ADVANCE_MS);
  };

  const toggleEstado = (id: StatusId) => {
    setErrors({});
    setData((d) => ({ ...d, estado: d.estado.includes(id) ? d.estado.filter((e) => e !== id) : [...d.estado, id] }));
  };

  // ----- Validación por paso -----
  const validate = (s: StepId): Errors => {
    const e: Errors = {};
    if (s === "cliente" && !data.cliente) e.cliente = t.errors.pick;
    if (s === "servicio" && !data.servicio) e.servicio = t.errors.pick;
    if (s === "estado" && data.estado.length === 0) e.estado = t.errors.pickSome;
    if (s === "caso" && stripForbidden(data.descripcion, true).trim().length < limits.descripcionMin) {
      e.descripcion = t.errors.descripcion(limits.descripcionMin);
    }
    if (s === "contacto") {
      const telefono = cleanLine(stripForbidden(data.telefono));
      if (cleanLine(stripForbidden(data.nombre)).length < limits.nombreMin) e.nombre = t.errors.nombre;
      const correo = cleanLine(stripForbidden(data.correo));
      if (!correo) e.correo = t.errors.correoVacio;
      else if (!isEmail(correo)) e.correo = t.errors.correo;
      if (telefono && !isPhone(telefono)) e.telefono = t.errors.telefono;
    }
    return e;
  };

  const focusFirstError = (e: Errors) => {
    const first = Object.keys(e)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(fid(first));
      (el ?? headingRef.current)?.focus();
    });
  };

  const onNext = () => {
    // Un segundo Enter o clic mientras se envía no hace nada.
    if (phase === "sending" || sendingRef.current) return;
    const e = validate(step);
    if (Object.keys(e).length) {
      setErrors(e);
      focusFirstError(e);
      return;
    }
    if (step === "contacto") return void submit();
    go(nextOf(step, data), 1);
  };

  const onBack = () => {
    const list = stepsFor(data);
    const i = list.indexOf(step);
    if (i > 0) {
      if (list[i - 1] === "servicio") setPreselected(false);
      go(list[i - 1], -1);
    }
  };

  // ----- Envío -----
  const submit = async () => {
    sendingRef.current = true;
    setPhase("sending");
    setSendError(null);
    const variant = variantOf(data);
    const noIncident = data.servicio !== "" && servicesWithoutIncident.includes(data.servicio);
    // Se quitan los caracteres invisibles que se cuelan al pegar; el servidor rechaza los que lleguen.
    const line = (v: string) => stripForbidden(v);
    const datos: ContactPayload = {
      cliente: data.cliente as ClientId,
      clienteOtro: data.cliente === "otro" ? line(data.clienteOtro) : "",
      servicio: data.servicio as ServiceId,
      estado: variant ? data.estado : [],
      lugar: noIncident ? "" : line(data.lugar),
      fecha: noIncident ? "" : line(data.fecha),
      descripcion: stripForbidden(data.descripcion, true),
      urgencia: data.urgencia,
      plazoDetalle: needsDeadline(data.urgencia) ? line(data.plazoDetalle) : "",
      nombre: line(data.nombre),
      empresa: data.cliente === "particular" ? "" : line(data.empresa),
      correo: cleanLine(line(data.correo)),
      telefono: line(data.telefono),
      idioma: locale,
    };
    let error: Exclude<SendError, null> = "red";
    try {
      const token = await getToken();
      // El servidor rechaza un envío a menos de 4 s de emitido el token: se espera lo que falte.
      if (token.value) {
        const wait = token.at + TOKEN_WAIT_MS - Date.now();
        if (wait > 0) await sleep(wait);
      }
      let turnstile = "";
      if (TURNSTILE_KEY) {
        // El widget suele resolver en uno o dos segundos; se le dan hasta 10.
        for (let i = 0; i < 50 && !turnstileToken.current; i++) await sleep(200);
        turnstile = turnstileToken.current;
      }
      if (TURNSTILE_KEY && !turnstile) {
        error = "verificacion";
      } else {
        const res = await fetch("/api/contacto/", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ datos, web: honeypotRef.current?.value ?? "", token: token.value, turnstile }),
        });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (res.ok && body?.ok) {
          tokenRef.current = null; // ya se usó
          tokenPromise.current = null;
          navigated.current = true;
          setPhase("done");
          return;
        }
        error = (body?.error && SERVER_ERRORS[body.error]) || (res.status >= 500 ? "envio" : "red");
        // El token de Turnstile es de un solo uso.
        if (turnstile && turnstileWidget.current) {
          turnstileToken.current = "";
          turnstileApi()?.reset(turnstileWidget.current);
        }
        if (error === "vencido") renewToken();
      }
    } catch {
      error = "red";
    } finally {
      sendingRef.current = false;
    }
    setSendError(error);
    setPhase("form");
  };

  const restart = () => {
    setData(EMPTY);
    setPreselected(false);
    setSendError(null);
    renewToken();
    setPhase("form");
    go("cliente", -1);
  };

  // ----- Render -----
  const clienteLabel = st.cliente.options.find((o) => o.id === data.cliente)?.label ?? "";
  const servicioLabel = st.servicio.options.find((o) => o.id === data.servicio)?.label ?? "";
  const waHref = whatsapp(t.whatsappText(clienteLabel || t.unknown, servicioLabel || t.unknown));
  const firstError = Object.values(errors).find(Boolean) ?? "";
  const describedBy = (k: Field) => (errors[k] ? `${fid(k)}-error` : undefined);

  const motionProps = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, x: 28 * dir, filter: "blur(6px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -20 * dir, filter: "blur(4px)" },
        transition: { duration: 0.45, ease },
      };

  const stagger = (i: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease, delay: 0.06 + i * 0.035 } };

  // Al aparecer "¿Quién?" se enfoca sin que el navegador mueva la página por su cuenta (dejaba el título bajo la barra
  // fija) y se trae a la vista solo si hace falta; `scroll-padding-top` del html respeta la barra.
  const focusOtro = useCallback((el: HTMLInputElement | null) => {
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest" });
  }, []);

  const heading = (text: string, help?: string) => (
    <div className="flex flex-col gap-2">
      <h3
        ref={headingCallback}
        tabIndex={-1}
        id={fid("pregunta")}
        className="font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[0.95] text-hueso uppercase italic [text-wrap:balance] focus:outline-none"
      >
        {text}
      </h3>
      {help && <p className="text-[1rem] leading-relaxed text-gris">{help}</p>}
    </div>
  );

  let body: ReactNode;
  if (phase === "done") {
    body = (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-oro/[0.13] text-oro-claro ring-1 ring-oro/30 ring-inset">
          <SealCheck weight="fill" aria-hidden="true" className="size-8" />
        </span>
        <h3 ref={headingCallback} tabIndex={-1} className="font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-[0.95] text-hueso uppercase italic focus:outline-none">
          {t.done.title}
        </h3>
        <p className="max-w-[40ch] text-[1.05rem] leading-relaxed text-gris">{t.done.text(cleanLine(data.correo))}</p>
        <button type="button" onClick={restart} className="btn btn-linea mt-3 h-[3.3rem] px-8 text-[0.85rem]">
          {t.done.again}
        </button>
      </div>
    );
  } else if (step === "cliente") {
    body = (
      <>
        {heading(st.cliente.title)}
        <ul role="list" aria-labelledby={fid("pregunta")} className="mt-7 grid gap-3 sm:grid-cols-2">
          {st.cliente.options.map((o, i) => (
            <motion.li key={o.id} {...stagger(i)}>
              <button
                type="button"
                aria-pressed={data.cliente === o.id}
                onClick={() => chooseCliente(o.id)}
                className={`${OPTION} ${data.cliente === o.id ? OPTION_ON : OPTION_OFF}`}
              >
                <Node on={data.cliente === o.id} />
                <OptionText label={o.label} />
              </button>
            </motion.li>
          ))}
        </ul>
        {data.cliente === "otro" && (
          <FieldShell id={fid("clienteOtro")} label={st.cliente.otherLabel} optional={t.optional} className="mt-6 sm:max-w-[26rem]">
            <input
              id={fid("clienteOtro")}
              type="text"
              ref={focusOtro}
              maxLength={limits.clienteOtro}
              value={data.clienteOtro}
              onChange={(e) => set("clienteOtro", e.target.value)}
              placeholder={st.cliente.otherPlaceholder}
              className={`${INPUT} h-[3.25rem] rounded-full focus-visible:rounded-full border-hueso/15`}
            />
          </FieldShell>
        )}
      </>
    );
  } else if (step === "servicio") {
    body = (
      <>
        {heading(st.servicio.title)}
        <ul role="list" aria-labelledby={fid("pregunta")} className="mt-7 grid gap-3 sm:grid-cols-2">
          {st.servicio.options.map((o, i) => (
            <motion.li key={o.id} {...stagger(i)}>
              <button
                type="button"
                aria-pressed={data.servicio === o.id}
                onClick={() => chooseServicio(o.id)}
                className={`${OPTION} h-full ${data.servicio === o.id ? OPTION_ON : OPTION_OFF}`}
              >
                <Node on={data.servicio === o.id} />
                <OptionText label={o.label} hint={o.hint} />
              </button>
            </motion.li>
          ))}
        </ul>
      </>
    );
  } else if (step === "estado") {
    const variant = variantOf(data) ?? "revision";
    body = (
      <fieldset
        aria-labelledby={fid("pregunta")}
        aria-describedby={errors.estado ? `${fid("estado-ayuda")} ${fid("estado-error")}` : fid("estado-ayuda")}
        aria-invalid={!!errors.estado}
      >
        {heading(st.estado.title)}
        <p id={fid("estado-ayuda")} className="mt-2 text-[1rem] text-gris">
          {st.estado.help}
        </p>
        <ul role="list" className="mt-7 grid gap-3">
          {st.estado.variants[variant].map((o, i) => {
            const on = data.estado.includes(o.id);
            return (
              <motion.li key={o.id} {...stagger(i)}>
                <label
                  className={`${OPTION} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-oro-claro ${on ? OPTION_ON : OPTION_OFF}`}
                >
                  <input
                    id={i === 0 ? fid("estado") : undefined}
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => toggleEstado(o.id)}
                  />
                  <Node on={on} multi />
                  <OptionText label={o.label} />
                </label>
              </motion.li>
            );
          })}
        </ul>
      </fieldset>
    );
  } else if (step === "caso") {
    const noIncident = data.servicio !== "" && servicesWithoutIncident.includes(data.servicio);
    const c = st.caso;
    body = (
      <>
        {heading(noIncident ? c.titleCapacitacion : c.title, noIncident ? c.helpCapacitacion : c.help)}
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {!noIncident && (
            <>
              <FieldShell id={fid("lugar")} label={c.lugar.label} optional={t.optional}>
                <input id={fid("lugar")} type="text" maxLength={limits.lugar} value={data.lugar} onChange={(e) => set("lugar", e.target.value)} placeholder={c.lugar.placeholder} className={`${INPUT} h-[3.25rem] rounded-full focus-visible:rounded-full border-hueso/15`} />
              </FieldShell>
              <FieldShell id={fid("fecha")} label={c.fecha.label} optional={t.optional}>
                <input id={fid("fecha")} type="text" maxLength={limits.fecha} value={data.fecha} onChange={(e) => set("fecha", e.target.value)} placeholder={c.fecha.placeholder} className={`${INPUT} h-[3.25rem] rounded-full focus-visible:rounded-full border-hueso/15`} />
              </FieldShell>
            </>
          )}
          <FieldShell id={fid("descripcion")} label={c.descripcion.label} error={errors.descripcion} className="sm:col-span-2">
            <textarea
              id={fid("descripcion")}
              rows={4}
              maxLength={limits.descripcion}
              required
              aria-invalid={!!errors.descripcion}
              aria-describedby={describedBy("descripcion")}
              value={data.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder={noIncident ? c.descripcion.placeholderCapacitacion : c.descripcion.placeholder}
              className={`${INPUT} min-h-[8.5rem] resize-y rounded-[1.25rem] py-4 leading-relaxed focus-visible:rounded-[1.25rem] ${errors.descripcion ? "border-brasa" : "border-hueso/15"}`}
            />
          </FieldShell>
          <fieldset className="flex flex-col gap-3 sm:col-span-2">
            <legend className="mb-2 text-[0.95rem] font-semibold text-hueso">
              {c.urgencia.label}{" "}
              <span className="ml-1 text-[0.8rem] font-normal text-gris">({t.optional})</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {c.urgencia.options.map((o) => {
                const on = data.urgencia === o.id;
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2.5 text-[0.95rem] transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-oro-claro ${on ? OPTION_ON : OPTION_OFF}`}
                  >
                    <input type="radio" name={fid("urgencia")} className="sr-only" checked={on} onChange={() => set("urgencia", o.id)} />
                    <span aria-hidden="true" className={`size-2.5 rounded-full ${on ? "bg-oro-claro shadow-[0_0_8px_1px_rgba(255,122,42,0.5)]" : "border border-hueso/35"}`} />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {needsDeadline(data.urgencia) && (
            <FieldShell id={fid("plazoDetalle")} label={c.plazoDetalle.label} optional={t.optional} className="sm:col-span-2">
              <input id={fid("plazoDetalle")} type="text" maxLength={limits.plazoDetalle} value={data.plazoDetalle} onChange={(e) => set("plazoDetalle", e.target.value)} placeholder={c.plazoDetalle.placeholder} className={`${INPUT} h-[3.25rem] rounded-full focus-visible:rounded-full border-hueso/15`} />
            </FieldShell>
          )}
        </div>
      </>
    );
  } else {
    const c = st.contacto;
    const input = (k: "nombre" | "empresa" | "correo" | "telefono", type: string, autoComplete: string, max: number, required = false) => (
      <input
        id={fid(k)}
        type={type}
        autoComplete={autoComplete}
        maxLength={max}
        required={required}
        aria-invalid={!!errors[k]}
        aria-describedby={describedBy(k)}
        value={data[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={c[k].placeholder}
        className={`${INPUT} h-[3.25rem] rounded-full focus-visible:rounded-full ${errors[k] ? "border-brasa" : "border-hueso/15"}`}
        {...(type === "tel" ? { inputMode: "tel" as const } : {})}
      />
    );
    body = (
      <>
        {heading(c.title)}
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <FieldShell id={fid("nombre")} label={c.nombre.label} error={errors.nombre}>
            {input("nombre", "text", "name", limits.nombre, true)}
          </FieldShell>
          {data.cliente !== "particular" && (
            <FieldShell id={fid("empresa")} label={c.empresa.label} optional={t.optional}>
              {input("empresa", "text", "organization", limits.empresa)}
            </FieldShell>
          )}
          <FieldShell id={fid("correo")} label={c.correo.label} error={errors.correo}>
            {input("correo", "email", "email", limits.correo, true)}
          </FieldShell>
          <FieldShell id={fid("telefono")} label={c.telefono.label} optional={t.optional} error={errors.telefono}>
            {input("telefono", "tel", "tel", limits.telefono)}
          </FieldShell>
        </div>
        {/* Trampa para robots: invisible y fuera del orden de tabulación. Una persona nunca la llena. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            {t.honeypotLabel}
            <input ref={honeypotRef} type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        <p className="mt-6 max-w-[62ch] text-[0.88rem] leading-relaxed text-gris">{c.privacy}</p>
        {TURNSTILE_KEY && <TurnstileBox language={locale === "pt" ? "pt-br" : locale} tokenRef={turnstileToken} widgetRef={turnstileWidget} />}
      </>
    );
  }

  const hasSelection = (step === "cliente" && data.cliente) || (step === "servicio" && data.servicio);
  const showNext = phase !== "done" && (!["cliente", "servicio"].includes(step) || hasSelection);
  const sending = phase === "sending";

  return (
    <div
      ref={rootRef}
      onPointerDown={touch}
      onFocus={touch}
      onKeyDown={touch}
      className="relative w-full border border-hueso/[0.09] max-sm:-mx-5 max-sm:w-[calc(100%+2.5rem)] max-sm:border-x-0 bg-humo/85 text-left backdrop-blur-sm before:absolute before:inset-x-0 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-oro/80 before:to-transparent"
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="flex flex-col px-5 py-7 sm:p-[clamp(2rem,4vw,3rem)] lg:min-h-[33rem]"
      >
        {phase !== "done" && (
          <div className="mb-8 flex items-start gap-5">
            <div className="flex-1">
              <Progress id={fid("progreso")} index={index} total={totalSteps} label={t.stepOf(index + 1, totalSteps)} />
            </div>
          </div>
        )}

        {/* Avisos para lectores de pantalla: errores de validación y de envío */}
        <p aria-live="assertive" className="sr-only">
          {firstError || (sendError ? t.errors[sendError] : "")}
        </p>

        <div className="relative flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={phase === "done" ? "done" : step} {...motionProps}>
              {body}
              {(step === "cliente" || step === "servicio") && firstError && (
                <p className="mt-4 text-[0.9rem] text-brasa">{firstError}</p>
              )}
              {step === "estado" && errors.estado && (
                <p id={fid("estado-error")} className="mt-4 text-[0.9rem] text-brasa">
                  {errors.estado}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {phase !== "done" && sendError && (
          <div ref={errorPanelRef} role="group" aria-labelledby={fid("envio-error")} className="mt-7 flex flex-col gap-4 border-t border-hueso/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p ref={errorTitleRef} id={fid("envio-error")} tabIndex={-1} className="font-semibold text-hueso focus:outline-none">
                {t.failure.title}
              </p>
              <p className="text-[0.95rem] text-gris">{t.errors[sendError]}</p>
              <p className="text-[0.9rem] text-gris">
                {t.failure.email}{" "}
                <a href={`mailto:${contact.email}`} className="text-oro-claro underline decoration-oro/50">
                  {contact.email}
                </a>
              </p>
            </div>
            <a href={waHref} target="_blank" rel="noopener" className="btn btn-linea h-[3.3rem] shrink-0 px-7 text-[0.82rem]">
              <WhatsappLogo weight="fill" aria-hidden="true" className="size-5" />
              {t.failure.whatsapp}
            </a>
          </div>
        )}

        {phase !== "done" && (index > 0 || showNext) && (
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-hueso/10 pt-6">
            {index > 0 ? (
              <button
                type="button"
                onClick={onBack}
                disabled={sending}
                className="group inline-flex h-12 items-center gap-2 rounded-full px-4 -ml-4 text-[0.92rem] font-semibold text-gris transition-colors hover:text-hueso disabled:opacity-50"
              >
                <ArrowLeft weight="bold" aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                {t.back}
              </button>
            ) : (
              <span />
            )}
            {showNext && (
              <button type="submit" disabled={sending} aria-disabled={sending} className="btn btn-oro h-[3.3rem] px-8 text-[0.85rem] disabled:cursor-wait disabled:opacity-80 sm:px-10">
                {sending ? t.sending : step === "contacto" ? t.submit : t.next}
                {!sending && <Arrow className="btn-arrow size-[1.1em]" />}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
