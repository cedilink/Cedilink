import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The dashboard and checkouts are deliberately not disallowed here: they are kept out of
// search with `noindex` (see next.config.ts), which a crawler can only read if it may fetch the page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
