import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { isPrefixedLocale } from "@/data/idiomas";

export default async function LocaleHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isPrefixedLocale(lang)) notFound();
  return <HomePage locale={lang} />;
}
