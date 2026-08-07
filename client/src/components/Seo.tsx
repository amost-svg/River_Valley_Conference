import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "organization";
  structuredData?: Record<string, unknown>;
}

const SITE_ORIGIN = "https://rvc-il.com";
const DEFAULT_IMAGE = "/logos/RVC Logo.png";

function absoluteUrl(value: string) {
  return new URL(value, SITE_ORIGIN).toString();
}

export default function Seo({
  title = "River Valley Conference | Illinois High School Athletics",
  description = "Official website of the River Valley Conference featuring 10 IHSA member schools, schedules, standings, conference news, and school profiles.",
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  structuredData,
}: SeoProps) {
  useEffect(() => {
    document.title = title;

    const canonicalUrl = url
      ? absoluteUrl(url)
      : absoluteUrl(window.location.pathname || "/");
    const socialImage = absoluteUrl(image);

    const setMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? "property" : "name";
      let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag("description", description);
    setMetaTag("robots", "index,follow,max-image-preview:large");
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", socialImage, true);
    setMetaTag("og:url", canonicalUrl, true);
    setMetaTag("og:type", type, true);
    setMetaTag("og:site_name", "River Valley Conference", true);
    setMetaTag("twitter:card", socialImage.endsWith("RVC%20Logo.png") ? "summary" : "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", socialImage);
    setMetaTag("theme-color", "#0940AE");

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const schema = structuredData ?? {
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      name: "River Valley Conference",
      description:
        "Illinois high school conference serving 10 IHSA member schools through athletics, academics, and fine-arts competition.",
      url: SITE_ORIGIN,
      logo: absoluteUrl(DEFAULT_IMAGE),
      foundingDate: "1940",
      areaServed: {
        "@type": "State",
        name: "Illinois",
      },
      memberOf: {
        "@type": "Organization",
        name: "Illinois High School Association",
        url: "https://www.ihsa.org",
      },
    };

    let script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-rvc-seo="true"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.rvcSeo = "true";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }, [title, description, image, url, type, structuredData]);

  return null;
}
