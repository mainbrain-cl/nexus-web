import type { MetadataRoute } from "next";
import { content } from "@/data/nexus";

// /robots.txt. Todo el sitio se puede rastrear; solo queda fuera la ruta del formulario, que no es una página.
// Declara el sitemap para que los buscadores encuentren las tres versiones de idioma.
export default function robots(): MetadataRoute.Robots {
  const base = content.es.site.url;
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
