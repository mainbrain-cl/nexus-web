import type { Locale } from "@/data/idiomas";
import { buildSchema } from "@/data/schema";

/** Datos estructurados de la portada (JSON-LD), en el idioma de la página. Ver `src/data/schema.ts`. */
export function StructuredData({ locale }: { locale: Locale }) {
  // `<` se escapa para que ningún texto pueda cerrar la etiqueta <script> (recomendación de Next.js).
  const json = JSON.stringify(buildSchema(locale)).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
