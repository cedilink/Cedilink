import type { MetadataRoute } from "next";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SPLASH_COLOR,
  THEME_COLOR,
} from "@/lib/site";

// The installed app is the merchant's tool, so it opens on the dashboard. The scope stays
// the whole site so a checkout link opened on the same device stays inside the app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: "Smartpay",
    description: SITE_DESCRIPTION,
    lang: "en",
    dir: "ltr",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: SPLASH_COLOR,
    theme_color: THEME_COLOR,
    categories: ["finance", "business", "productivity"],
    prefer_related_applications: false,
    // The mascot sits well inside the safe zone on a full-bleed background, so one image serves both purposes.
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Create payment",
        short_name: "New payment",
        description: "Create a payment and get its checkout link",
        url: "/dashboard/payments/new?source=pwa-shortcut",
        icons: [
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
        ],
      },
      {
        name: "Payments",
        description: "See where every payment stands",
        url: "/dashboard/payments?source=pwa-shortcut",
        icons: [
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
        ],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/landing-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Cedilink Smartpay: accept USDC with one link",
      },
      {
        src: "/screenshots/landing-narrow.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Cedilink Smartpay on a phone",
      },
    ],
  };
}
