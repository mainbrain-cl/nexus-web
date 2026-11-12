import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/components/RootDocument";
import { NotFoundPage } from "@/components/NotFoundPage";
import "./globals.css";

// 404 de todo el sitio: rutas que no existen (`/xyz`, `/en/xyz`, `/es/`). Next la sirve sin pasar por los
// layouts, así que trae su propio <html>, las fuentes y el CSS. El idioma se ajusta en el navegador según la ruta.

// El título lo pone NotFoundPage con <title>, en el idioma de la ruta.
export const metadata: Metadata = {
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: "#120f0d",
};

export default function GlobalNotFound() {
  return (
    <html lang="es-CL" className={fontVariables}>
      <body>
        <NotFoundPage />
      </body>
    </html>
  );
}
