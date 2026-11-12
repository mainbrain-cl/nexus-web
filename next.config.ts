import type { NextConfig } from "next";

// Sin `output: "export"`: el formulario de contacto necesita la ruta /api/contacto en el servidor (Vercel).
// La página sigue prerenderizada como estática; solo /api/contacto corre en el servidor.
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  poweredByHeader: false,
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
