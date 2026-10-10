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
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/v1/:path*` }];
  },
};

export default nextConfig;
