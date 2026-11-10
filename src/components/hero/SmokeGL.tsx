"use client";

import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Humo con fbm deformado por dominio (un nivel, 4 octavas): sube lento y se calienta cerca del suelo.
const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(.8,.6,-.6,.8);
for(int i=0;i<4;i++){v+=a*n(p);p=R*p*2.03;a*=.5;}return v;}
void main(){
vec2 uv=gl_FragCoord.xy/r;
vec2 p=uv*vec2(r.x/r.y,1.)*1.7;
float T=t*.05;
vec2 q=vec2(fbm(p+vec2(0.,-T)),fbm(p+vec2(5.2,1.3-T*1.3)));
float f=fbm(p+2.4*q+vec2(0.,-T*1.6));
float smoke=smoothstep(.42,.98,f);
float floorGlow=pow(1.-uv.y,2.4);
float sideGlow=pow(abs(uv.x-.5)*2.,2.)*floorGlow;
vec3 cool=vec3(.2,.19,.19);
vec3 warm=vec3(.62,.27,.09);
vec3 col=mix(cool,warm,clamp(floorGlow*.7+sideGlow*.8,0.,1.)*smoothstep(.35,.85,f));
float a=smoke*(.2+.34*floorGlow);
gl_FragColor=vec4(col*a,a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  // Sin consultar el estado aquí: esa consulta obliga a esperar la compilación en el hilo principal.
  gl.compileShader(s);
  return s;
}

type Idle = (cb: () => void, opts?: { timeout: number }) => number;

export function SmokeGL({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let disposed = false;
    let teardown: (() => void) | undefined;
    let waitRaf = 0;

    const init = () => {
      if (disposed) return;
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) return;

      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      // Con esta extensión el shader se compila en otro hilo y se pregunta, cuadro a cuadro, si ya está.
      const parallel = gl.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null;
      const waitReady = () => {
        if (disposed) return;
        if (parallel && !gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) {
          waitRaf = requestAnimationFrame(waitReady);
          return;
        }
        start(gl, prog);
      };
      waitReady();
    };

    const start = (gl: WebGLRenderingContext, prog: WebGLProgram) => {
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(prog, "r");
      const uT = gl.getUniformLocation(prog, "t");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const seed = 40 + Math.random() * 60;
      let lastT = seed;

      const render = (t: number) => {
        lastT = t;
        gl.uniform1f(uT, t);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      // Tamaño ya configurado; empieza en 0 para que la primera llamada siempre fije la resolución del shader.
      let setW = 0;
      let setH = 0;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        // El humo es de baja frecuencia: renderizarlo a media resolución no se nota y ahorra GPU.
        const scale = rect.width < 768 ? 0.25 : 0.33;
        const cw = Math.max(1, Math.round(rect.width * scale));
        const ch = Math.max(1, Math.round(rect.height * scale));
        if (cw === setW && ch === setH) return;
        setW = cw;
        setH = ch;
        canvas.width = cw;
        canvas.height = ch;
        gl.viewport(0, 0, cw, ch);
        gl.uniform2f(uR, cw, ch);
        // Cambiar el tamaño borra el dibujo: se repinta al tiro para que no parpadee.
        render(lastT);
      };
      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      if (reduced) {
        render(seed);
        teardown = () => ro.disconnect();
        return;
      }

      let raf = 0;
      let lastDraw = 0;
      let running = false;
      let visible = true;
      const t0 = performance.now();

      const tick = (now: number) => {
        // 24 fps bastan para un humo lento.
        if (now - lastDraw > 41) {
          lastDraw = now;
          render(seed + (now - t0) / 1000);
        }
        raf = requestAnimationFrame(tick);
      };
      const play = () => {
        if (running || !visible || document.hidden) return;
        running = true;
        raf = requestAnimationFrame(tick);
      };
      const pause = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) play();
        else pause();
      });
      io.observe(canvas);
      const onVis = () => (document.hidden ? pause() : play());
      document.addEventListener("visibilitychange", onVis);
      render(seed);
      play();

      teardown = () => {
        pause();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
      };
    };

    // El humo aparece recién a los 1,35 s (ver .in-bg): se prepara cuando el navegador queda libre,
    // para no competir con la carga de la página ni con la ignición del título.
    // Safari no tiene requestIdleCallback: ahí se usa una espera corta.
    const w = window as Window & { requestIdleCallback?: Idle; cancelIdleCallback?: (id: number) => void };
    const hasIdle = typeof w.requestIdleCallback === "function";
    const idleId = hasIdle ? w.requestIdleCallback!(init, { timeout: 500 }) : window.setTimeout(init, 300);

    return () => {
      disposed = true;
      cancelAnimationFrame(waitRaf);
      if (hasIdle) w.cancelIdleCallback?.(idleId);
      else window.clearTimeout(idleId);
      teardown?.();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
