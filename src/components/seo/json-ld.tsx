import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const ORGANIZATION = `${SITE_URL}/#organization`;
const WEBSITE = `${SITE_URL}/#website`;

/**
 * Structured data for the landing page: who Cedilink is, what Smartpay is, and the FAQs
 * exactly as they are shown on the page (search engines require the two to match).
 */
export function LandingJsonLd({
  faqs,
}: {
  faqs: readonly { question: string; answer: string }[];
}) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION,
        name: "Cedilink",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        areaServed: { "@type": "Country", name: "Ghana" },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": ORGANIZATION },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        image: `${SITE_URL}/opengraph-image.png`,
        publisher: { "@id": ORGANIZATION },
        // The Testnet demo is free to use.
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        isPartOf: { "@id": WEBSITE },
        mainEntity: faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
  // "<" is escaped so no string in the data can close the script element.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
