import { RootDocument, buildMetadata } from "@/components/RootDocument";

export { viewport } from "@/components/RootDocument";

// Español, en `/`: la URL de siempre, sin prefijo.
export const metadata = buildMetadata("es");

export default function SpanishLayout({ children }: LayoutProps<"/">) {
  return <RootDocument locale="es">{children}</RootDocument>;
}
