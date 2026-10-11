import type { Metadata } from "next";

/** Public address of this app. Canonical links, the sitemap and social cards are built from it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://credlink.cc").replace(/\/$/, "");

export const SITE_NAME = "Credlink Smartpay";
export const SITE_TITLE = "Credlink Smartpay — Accept USDC on Stellar";
export const SITE_DESCRIPTION =
  "Stellar USDC payments for Ghanaian merchants. One link, a clear checkout, and payments you can verify on-chain. Running on Stellar Testnet.";

/** Colours the browser and the installed app paint around the page. */
export const THEME_COLOR = "#ffffff";
export const SPLASH_COLOR = "#fff4e2";

/** Open Graph fields every public page shares. A page that sets `openGraph` replaces the whole object, so spread this. */
export const OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_GH",
} satisfies Metadata["openGraph"];

/**
 * Metadata for a public, indexable page: its own canonical address, and a social card
 * whose title and description match the page instead of falling back to the home page's.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH, title: `${title} · ${SITE_NAME}`, description, url: path },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description },
  };
}
