// Checks the installable-app behaviour in Chrome: the manifest, the service worker, and what
// a visitor sees with no connection. Needs a production build, as the service worker is not
// registered in development.
//
//   npm run build && npm start
//   FRONTEND_URL=http://localhost:3000 node scripts/pwa-browser-check.mjs
import { chromium } from "playwright-core";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:3000";

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${ok || !detail ? "" : `  -> ${detail}`}`);
};

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

console.log("\nManifest");
const manifest = await (await context.request.get(`${FRONTEND}/manifest.webmanifest`)).json();
check("has a name, start URL and standalone display", Boolean(manifest.name && manifest.start_url) && manifest.display === "standalone");
for (const image of [...manifest.icons, ...manifest.screenshots, ...manifest.shortcuts.flatMap((shortcut) => shortcut.icons)]) {
  const response = await context.request.get(FRONTEND + image.src);
  check(`${image.src} loads`, response.ok(), String(response.status()));
}
check("has a 512px maskable icon", manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));

console.log("\nService worker");
await page.goto(FRONTEND, { waitUntil: "networkidle" });
const active = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
check("is registered and active", active === `${FRONTEND}/sw.js`, String(active));
// Give the worker a moment to store the build assets the page reported.
await page.waitForTimeout(2500);
const cached = await page.evaluate(async () => {
  const names = await caches.keys();
  const entries = await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)));
  return entries.flat();
});
check("offline page is stored", cached.includes("/offline.html"));
check("build assets from the first visit are stored", cached.filter((path) => path.startsWith("/_next/static/")).length > 5, `${cached.length} entries`);
check("no API response is stored", !cached.some((path) => path.startsWith("/api/")));

// A second visit, now under the worker's control, stores the page itself.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

console.log("\nOffline");
await context.setOffline(true);
await page.goto(FRONTEND, { waitUntil: "load" });
check("landing page opens from the stored copy", (await page.locator("h1").first().textContent())?.includes("A smarter way to accept USDC") ?? false);
check("the offline notice is shown", await page.getByText("You're offline. What you see may be out of date.").isVisible().catch(() => false));

for (const path of ["/dashboard", "/c/pay_does_not_matter", "/login"]) {
  await page.goto(FRONTEND + path, { waitUntil: "load" });
  check(`${path} shows the offline page`, (await page.locator("h1").textContent()) === "You're offline");
}

console.log("\nBack online");
await context.setOffline(false);
// The offline page reloads itself when the connection returns.
const signIn = page.getByRole("heading", { name: "Sign in to Credlink Smartpay" });
check("the page that was asked for loads by itself", await signIn.waitFor({ timeout: 10_000 }).then(() => true, () => false));
const stored = await page.evaluate(async () => (await (await caches.open((await caches.keys()).find((name) => name.includes("pages")) ?? "")).keys()).map((request) => new URL(request.url).pathname));
check("private pages were never stored", !stored.some((path) => /^\/(c|dashboard|login|signup)(\/|$)/.test(path)), stored.join(", "));

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
