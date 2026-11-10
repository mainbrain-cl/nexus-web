"use client";

import { useEffect, useRef } from "react";

type Layer = "back" | "front";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  heat: number;
  seed: number;
  burst: boolean;
};

type Props = {
  layer: Layer;
  /** ms desde el montaje para la ráfaga de ignición; omitir para no tener ráfaga */
  burstDelay?: number;
  className?: string;
};

// Rampa de color de una brasa: rojo apagado → naranja → ámbar → casi blanco.
const RAMP: [number, [number, number, number]][] = [
  [0, [110, 22, 6]],
  [0.35, [235, 82, 18]],
  [0.7, [255, 160, 62]],
  [1, [255, 240, 205]],
];

function heatColor(h: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, h));
  for (let i = 1; i < RAMP.length; i++) {
    const [p1, c1] = RAMP[i];
    const [p0, c0] = RAMP[i - 1];
    if (t <= p1) {
      const k = (t - p0) / (p1 - p0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return RAMP[RAMP.length - 1][1];
}

function makeSprite(rgb: [number, number, number], soft: number) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  const [r, gg, b] = rgb.map(Math.round);
  grd.addColorStop(0, `rgba(255,246,225,${soft > 0.5 ? 0.55 : 1})`);
  grd.addColorStop(soft > 0.5 ? 0.35 : 0.12, `rgba(${r},${gg},${b},0.85)`);
  grd.addColorStop(soft > 0.5 ? 0.7 : 0.4, `rgba(${r},${gg},${b},0.22)`);
  grd.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  return c;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Colores de estela ya armados como texto: crear un "rgb(...)" por brasa en cada cuadro
// llenaba la memoria de basura y el recolector producía tirones.
const STEPS = 48;
const STROKES = Array.from({ length: STEPS + 1 }, (_, i) => {
  const [r, g, b] = heatColor(i / STEPS);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
});
const strokeFor = (h: number) => STROKES[Math.round(Math.min(1, Math.max(0, h)) * STEPS)];

// Las brasas son luz suave: en pantallas de 120–144 Hz se dibuja un cuadro de cada dos (60–72 fps).
// Las de 60, 75, 90 o 100 Hz dibujan todos sus cuadros: el umbral está bajo el intervalo de esas pantallas.
const MIN_FRAME_MS = 9;
const FRAME_MS = 1000 / 60;

export function Embers({ layer, burstDelay, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const front = layer === "front";
    // Brasas de 1–2 px no ganan nada con más resolución; el canvas a pantalla completa es lo que cuesta.
    // Las cercanas son bokeh desenfocado: a media resolución se ven iguales y pintan un cuarto de píxeles.
    const dpr = front ? 0.5 : Math.min(window.devicePixelRatio || 1, 1.25);

    const sprites = [0.25, 0.55, 0.85].map((h) => makeSprite(heatColor(h), front ? 0.8 : 0.2));
    const pickSprite = (h: number) => sprites[h > 0.7 ? 2 : h > 0.4 ? 1 : 0];

    let w = 0;
    let h = 0;
    let target = 0;
    const particles: Particle[] = [];
    const pointer = { x: -9999, y: -9999 };
    // Última posición del mouse en la pantalla; se convierte a coordenadas del canvas una vez por cuadro.
    const screenPointer = { x: 0, y: 0, active: false, dirty: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Cambiar el tamaño del canvas borra su configuración; se repone aquí.
      ctx.lineCap = "round";
      const scale = Math.min(1, w / 1440) * (w < 768 ? 0.75 : 1);
      target = Math.round((front ? 7 : 60) * Math.max(0.35, scale));
    };

    const spawn = (opts: Partial<Particle> & { prefill?: boolean } = {}) => {
      // Las brasas nacen más en los costados, donde el fondo tiene el resplandor.
      const side = Math.random();
      const x =
        side < 0.38 ? rand(-0.05, 0.3) * w : side < 0.76 ? rand(0.7, 1.05) * w : rand(0.25, 0.75) * w;
      const life = front ? rand(4.5, 8) : rand(5, 11);
      const p: Particle = {
        x,
        y: opts.prefill ? rand(0.1, 1) * h : h + rand(5, 60),
        vx: rand(-14, 14),
        vy: front ? -rand(70, 150) : -rand(28, 105),
        age: opts.prefill ? rand(0, life * 0.6) : 0,
        life,
        size: front ? rand(5, 16) : rand(0.6, 2),
        heat: rand(0.45, 1),
        seed: Math.random() * 1000,
        burst: false,
        ...opts,
      };
      particles.push(p);
    };

    const burst = () => {
      const n = front ? 5 : Math.round(80 * Math.min(1, w / 1200) + 20);
      for (let i = 0; i < n; i++) {
        const fromTitle = Math.random() < 0.75;
        spawn({
          x: fromTitle ? rand(0.16, 0.84) * w : rand(0, 1) * w,
          y: fromTitle ? rand(0.3, 0.55) * h : h + rand(0, 30),
          vx: rand(-90, 90),
          vy: -rand(110, front ? 260 : 360),
          life: rand(1.1, 3.2),
          heat: rand(0.8, 1),
          size: front ? rand(8, 20) : rand(0.9, 2.6),
          burst: true,
        });
      }
    };

    const draw = (p: Particle) => {
      const k = p.age / p.life;
      const fade = k < 0.08 ? k / 0.08 : 1 - Math.pow((k - 0.08) / 0.92, 1.6);
      const heat = p.heat * (1 - k * 0.75);
      // Parpadeo propio de cada brasa
      const twinkle = 0.75 + 0.25 * Math.sin(p.age * (7 + (p.seed % 5)) + p.seed);
      const alpha = Math.max(0, fade) * twinkle;
      if (alpha <= 0.01) return;

      if (front) {
        const s = p.size * 3.2;
        ctx.globalAlpha = alpha * 0.42;
        ctx.drawImage(pickSprite(heat), p.x - s / 2, p.y - s / 2, s, s);
        return;
      }

      // Estela corta: una brasa se lee como punto incandescente, no como lluvia.
      const len = p.burst ? 0.022 : 0.016;
      // Cola tenue y cabeza encendida, sin crear un degradado por brasa en cada cuadro.
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = strokeFor(heat);
      ctx.lineWidth = p.size * 0.7;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len);
      ctx.stroke();

      const s = p.size * 9;
      ctx.globalAlpha = alpha * 0.55;
      ctx.drawImage(pickSprite(heat), p.x - s / 2, p.y - s / 2, s, s);
    };

    resize();

    if (reduced) {
      for (let i = 0; i < Math.round(target * 0.45); i++) spawn({ prefill: true });
      ctx.globalCompositeOperation = "lighter";
      particles.forEach(draw);
      return;
    }

    // Arranca con pocas brasas: la ráfaga de ignición es la que llena la escena.
    for (let i = 0; i < Math.round(target * 0.25); i++) spawn({ prefill: true });

    let raf = 0;
    let last = performance.now();
    let running = false;
    let visible = true;
    const start = performance.now();
    let burstDone = burstDelay === undefined;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < MIN_FRAME_MS) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (screenPointer.dirty) {
        screenPointer.dirty = false;
        if (screenPointer.active) {
          const rect = canvas.getBoundingClientRect();
          pointer.x = screenPointer.x - rect.left;
          pointer.y = screenPointer.y - rect.top;
        } else {
          pointer.x = pointer.y = -9999;
        }
      }
      const t = now / 1000;

      if (!burstDone && now - start >= (burstDelay ?? 0)) {
        burstDone = true;
        burst();
      }

      let ambient = 0;
      for (const p of particles) if (!p.burst) ambient++;
      if (ambient < target && Math.random() < (front ? 0.04 : 0.6)) spawn();

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        // Corriente de aire caliente: deriva lateral ondulante + empuje hacia arriba.
        const ax =
          Math.sin(t * 0.9 + p.seed) * 26 + Math.sin(t * 2.7 + p.seed * 1.7) * 14 + Math.sin(p.y * 0.012 + t) * 10;
        p.vx += ax * dt;
        p.vy -= (front ? 8 : 14) * dt;
        if (!front) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 150 * 150) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / 150) * 900;
            p.vx += (dx / d) * f * dt;
            p.vy += (dy / d) * f * dt;
          }
        }
        p.vx *= 1 - 0.9 * dt;
        p.vy *= 1 - (p.burst ? 0.9 : 0.25) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.age >= p.life || p.y < -40 || p.x < -80 || p.x > w + 80) {
          // Quitar cambiando por la última: splice movía todo el arreglo en cada brasa que se apagaba.
          particles[i] = particles[particles.length - 1];
          particles.pop();
          continue;
        }
        draw(p);
      }
      ctx.globalAlpha = 1;
    };

    const play = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      // Un cuadro atrás, para que el primer tick dibuje de inmediato.
      last = performance.now() - FRAME_MS;
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(canvas);

    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      screenPointer.x = e.clientX;
      screenPointer.y = e.clientY;
      screenPointer.active = true;
      screenPointer.dirty = true;
    };
    const onLeave = () => {
      screenPointer.active = false;
      screenPointer.dirty = true;
    };
    if (!front) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    play();

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [layer, burstDelay]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
