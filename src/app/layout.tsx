import type { Metadata, Viewport } from "next";
import { Archivo, Barlow_Condensed, Schibsted_Grotesk } from "next/font/google";
import { site } from "@/data/nexus";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["800"],
});

const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Nombre: grotesca ancha y pesada, recta, para que el nombre resalte.
const name = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.description,
    locale: "es_CL",
    type: "website",
    siteName: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#120f0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className={`${display.variable} ${sans.variable} ${name.variable}`}>
      <body>
        <a
          href="#contenido"
          className="sr-only rounded-full bg-oro px-5 py-3 font-semibold text-ceniza focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
        >
          Saltar al contenido
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
