import { notFound } from "next/navigation";
import { RootDocument, buildMetadata } from "@/components/RootDocument";
import { isPrefixedLocale, prefixedLocales } from "@/data/idiomas";

export { viewport } from "@/components/RootDocument";

// Inglés en `/en/` y portugués en `/pt/`, prerenderizados. Cualquier otro segmento es 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return prefixedLocales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isPrefixedLocale(lang)) notFound();
  return buildMetadata(lang);
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isPrefixedLocale(lang)) notFound();
  return <RootDocument locale={lang}>{children}</RootDocument>;
}
