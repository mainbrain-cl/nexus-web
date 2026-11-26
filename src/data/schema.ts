// Datos estructurados (JSON-LD, schema.org) de la portada: le dicen a los buscadores y a los asistentes de IA,
// sin ambigüedad, qué es NEXUS, quién es Domingo, qué credencial tiene y qué servicios ofrece.
//
// Todo sale de `src/data/nexus.ts`: aquí no se escribe ningún dato nuevo sobre NEXUS, salvo la ciudad base
// (ver `base`). Si un dato no está publicado en el sitio, tampoco va aquí.
// Se valida en https://validator.schema.org y en https://search.google.com/test/rich-results.

import { contact, content } from "@/data/nexus";
import { localeInfo, locales, type Locale } from "@/data/idiomas";

/** Ciudad base (PRODUCT.md). El sitio atiende todo Chile y el extranjero: por eso `areaServed` es el país. */
const base = { locality: "Valdivia", region: "Los Ríos", country: "CL" } as const;

/** Sitio oficial de la International Association of Arson Investigators. */
const IAAI_URL = "https://www.firearson.com/";

/** Quita las marcas de negrita (`**`) de los textos del sitio. */
const plain = (text: string) => text.replace(/\*\*/g, "");

export function buildSchema(locale: Locale) {
  const c = content[locale];
  const site = c.site.url;
  const pageUrl = `${site}${localeInfo[locale].path}`;
  const lang = localeInfo[locale].htmlLang;

  // Los mismos identificadores en los tres idiomas: es una sola firma y una sola persona.
  const orgId = `${site}/#nexus`;
  const personId = `${site}/#domingo-soto-game`;
  const websiteId = `${site}/#sitio`;

  const iaai = { "@type": "Organization", name: "International Association of Arson Investigators (IAAI)", url: IAAI_URL };
  // Sellos de Perfil: [IAAI, Capítulo 82 Chile, IAAI-FIT].
  const [, chapter, fit] = c.profile.seals;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${site}/`,
        name: c.site.name,
        inLanguage: locales.map((l) => localeInfo[l].htmlLang),
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#pagina`,
        url: pageUrl,
        name: c.site.title,
        description: c.site.description,
        inLanguage: lang,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
        primaryImageOfPage: { "@type": "ImageObject", url: `${site}${c.og.image}`, width: c.og.width, height: c.og.height },
      },
      {
        "@type": "ProfessionalService",
        "@id": orgId,
        name: c.site.name,
        url: `${site}/`,
        description: c.site.description,
        slogan: c.site.tagline,
        image: `${site}${c.og.image}`,
        telephone: contact.phoneE164,
        email: contact.email,
        address: { "@type": "PostalAddress", addressLocality: base.locality, addressRegion: base.region, addressCountry: base.country },
        areaServed: { "@type": "Country", name: "Chile" },
        availableLanguage: locales.map((l) => localeInfo[l].htmlLang),
        knowsAbout: [...c.intersection.threads, ...c.method.standards.map((s) => s.code)],
        employee: { "@id": personId },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: c.navLinks.find((l) => l.key === "servicios")?.label,
          itemListElement: c.services.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.name,
              description: plain(s.text),
              serviceType: s.name,
              provider: { "@id": orgId },
            },
          })),
        },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: contact.name,
        givenName: contact.firstName,
        familyName: contact.lastName,
        jobTitle: c.profile.role,
        description: plain(c.profile.bio),
        image: `${site}/hero/domingo.webp`,
        url: `${pageUrl}#perfil`,
        email: contact.email,
        telephone: contact.phoneE164,
        worksFor: { "@id": orgId },
        knowsAbout: [...c.intersection.threads, ...c.method.standards.map((s) => s.code)],
        hasCredential: {
          "@type": "EducationalOccupationalCredential",
          name: `${fit.name} (${fit.by})`,
          credentialCategory: "certification",
          recognizedBy: iaai,
        },
        memberOf: [iaai, { "@type": "Organization", name: chapter.name, parentOrganization: iaai }],
      },
    ],
  };
}
