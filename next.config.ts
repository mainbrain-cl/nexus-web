import type { NextConfig } from "next";

// Sin `output: "export"`: el formulario de contacto necesita la ruta /api/contacto en el servidor (Vercel).
// La página sigue prerenderizada como estática; solo /api/contacto corre en el servidor.
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  poweredByHeader: false,
  // Página 404 propia para todo el sitio (app/global-not-found.tsx): hay dos layouts raíz, (es) y [lang],
  // así que no hay un layout único desde el cual armarla con not-found.tsx.
  experimental: {
    globalNotFound: true,
  },
  // Cabeceras de seguridad. La CSP lleva solo `frame-ancestors` (nadie puede incrustar el sitio en un iframe):
  // una CSP completa rompería Motion, WebGL o Turnstile.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
