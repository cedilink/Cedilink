import type { NextConfig } from "next";

// Where the Smartpay API lives. The browser never calls it directly: requests go to
// /api/* on this origin and are forwarded, so the merchant session cookie stays first-party.
const apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Lets a second build (e.g. the browser checks) run beside a live `next dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // Private pages stay out of search results even where the page's own metadata is not read.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/dashboard/:path*", headers: noindex },
      { source: "/c/:path*", headers: noindex },
      { source: "/offline.html", headers: noindex },
      {
        // The service worker must never be served stale, or installed apps stop receiving updates.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/v1/:path*` }];
  },
};

export default nextConfig;
