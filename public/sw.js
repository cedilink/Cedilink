// Cedilink Smartpay service worker. Plain JavaScript, served as-is from /sw.js.
//
// What it does:
//   - Build assets (/_next/static, content-hashed) are served from cache first.
//   - Images are served from cache and refreshed in the background.
//   - Public pages are fetched from the network, with the last good copy as a fallback.
//   - Any page that cannot be loaded shows /offline.html.
//
// What it never touches: /api/* (payments, sessions, the live event stream), anything that
// is not a GET, and other origins. Checkout and dashboard pages are never stored, so a
// payment's state always comes from the server.
//
// Bump VERSION to throw away every cache on the next visit.
const VERSION = "v1";
const STATIC_CACHE = `credlink-static-${VERSION}`;
const IMAGE_CACHE = `credlink-images-${VERSION}`;
const PAGE_CACHE = `credlink-pages-${VERSION}`;
const CACHES = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

// Pages whose content is private or must be live. They fall back to the offline page only.
const NEVER_STORED = [
  /^\/c\//,
  /^\/dashboard(\/|$)/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
];

const STATIC_LIMIT = 250;
const IMAGE_LIMIT = 80;
const PAGE_LIMIT = 20;
const PAGE_TIMEOUT_MS = 6000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(
          PRECACHE.map((url) => new Request(url, { cache: "reload" })),
        ),
      ),
  );
  // No skipWaiting here: a new version takes over when the page asks (see the "message" handler),
  // so a tab is never switched to new code in the middle of a payment.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith("credlink-") && !CACHES.includes(name),
          )
          .map((name) => caches.delete(name)),
      );
      if (self.registration.navigationPreload)
        await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  // The page lists the build assets it loaded before this worker was in control,
  // so the first visit is enough for the page to work offline.
  if (data.type === "WARM" && Array.isArray(data.urls))
    event.waitUntil(warm(data.urls));
});

async function warm(urls) {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(
    urls
      .filter(
        (url) =>
          typeof url === "string" &&
          url.startsWith(`${self.location.origin}/_next/static/`),
      )
      .slice(0, 100)
      .map(async (url) => {
        if (await cache.match(url)) return;
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        } catch {
          // Not reachable now; it is cached the next time the page asks for it.
        }
      }),
  );
  await trim(STATIC_CACHE, STATIC_LIMIT);
}

// Cache keys are returned oldest first, so this drops the entries stored longest ago.
async function trim(name, limit) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - limit))
      .map((key) =>
        PRECACHE.includes(new URL(key.url).pathname)
          ? undefined
          : cache.delete(key),
      ),
  );
}

async function store(name, limit, request, response) {
  const cache = await caches.open(name);
  await cache.put(request, response);
  await trim(name, limit);
}

const storable = (response) => response.ok && response.type === "basic";

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (storable(response))
    event.waitUntil(
      store(STATIC_CACHE, STATIC_LIMIT, event.request, response.clone()),
    );
  return response;
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const fresh = fetch(event.request).then((response) => {
    if (storable(response))
      event.waitUntil(
        store(IMAGE_CACHE, IMAGE_LIMIT, event.request, response.clone()),
      );
    return response;
  });
  if (!cached) return fresh;
  event.waitUntil(fresh.catch(() => {}));
  return cached;
}

async function offlinePage() {
  return (
    (await caches.match(OFFLINE_URL)) ??
    new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function fromNetwork(event) {
  // The browser may already have started this request while the worker was starting up.
  return (await event.preloadResponse) ?? fetch(event.request);
}

async function privatePage(event) {
  try {
    return await fromNetwork(event);
  } catch {
    return offlinePage();
  }
}

async function publicPage(event) {
  const cached = await caches.match(event.request, { ignoreSearch: true });
  let timer;
  try {
    const network = fromNetwork(event);
    // On a connection that hangs, show the stored copy instead of a blank screen.
    const response = cached
      ? await Promise.race([
          network,
          new Promise(
            (_, reject) => (timer = setTimeout(reject, PAGE_TIMEOUT_MS)),
          ),
        ])
      : await network;
    if (storable(response))
      event.waitUntil(
        store(PAGE_CACHE, PAGE_LIMIT, event.request, response.clone()),
      );
    return response;
  } catch {
    return cached ?? offlinePage();
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      NEVER_STORED.some((pattern) => pattern.test(url.pathname))
        ? privatePage(event)
        : publicPage(event),
    );
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event));
    return;
  }
  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(staleWhileRevalidate(event));
  }
  // Everything else (page data for in-app navigation, the manifest, …) goes straight to the network.
});
