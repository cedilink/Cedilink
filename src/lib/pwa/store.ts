"use client";

import { useSyncExternalStore } from "react";

/** Chrome's install prompt event. Not in the DOM typings because only Chromium browsers fire it. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type PwaState = {
  /** The browser has offered an install prompt we can trigger. */
  installable: boolean;
  /** Already running as an installed app. */
  installed: boolean;
  /** iPhone and iPad have no install prompt; the user adds the app from the Share menu. */
  ios: boolean;
  offline: boolean;
  /** A new version has been downloaded and is waiting to take over. */
  updateReady: boolean;
};

const SERVER_STATE: PwaState = { installable: false, installed: false, ios: false, offline: false, updateReady: false };

let state = SERVER_STATE;
let installEvent: BeforeInstallPromptEvent | undefined;
let waiting: ServiceWorker | undefined;
let started = false;
const listeners = new Set<() => void>();

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function watch(registration: ServiceWorkerRegistration) {
  const ready = (worker: ServiceWorker | null) => {
    // With no controller this is the first install, not an update.
    if (!worker || !navigator.serviceWorker.controller) return;
    waiting = worker;
    set({ updateReady: true });
  };
  if (registration.waiting) ready(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => worker.state === "installed" && ready(worker));
  });
}

async function register() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  watch(registration);

  // Hand over the build assets this page loaded before the worker was in control.
  const worker = await navigator.serviceWorker.ready;
  const urls = performance.getEntriesByType("resource").map((entry) => entry.name).filter((name) => name.includes("/_next/static/"));
  worker.active?.postMessage({ type: "WARM", urls });

  // An installed app can stay open for days; look for a new version when it comes back into view.
  let checkedAt = Date.now();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || Date.now() - checkedAt < 60 * 60 * 1000) return;
    checkedAt = Date.now();
    void registration.update().catch(() => {});
  });
}

/** Starts listening for install, connectivity and update events. Safe to call more than once. */
export function startPwa() {
  if (started || typeof window === "undefined") return;
  started = true;

  const standalone = window.matchMedia("(display-mode: standalone)");
  // iPadOS reports itself as a Mac; the touch points give it away.
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  set({ ios, offline: !navigator.onLine, installed: standalone.matches || (navigator as { standalone?: boolean }).standalone === true });

  standalone.addEventListener("change", (event) => set({ installed: event.matches }));
  window.addEventListener("online", () => set({ offline: false }));
  window.addEventListener("offline", () => set({ offline: true }));
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser's own banner away; the dashboard offers the install instead.
    event.preventDefault();
    installEvent = event as BeforeInstallPromptEvent;
    set({ installable: true });
  });
  window.addEventListener("appinstalled", () => {
    installEvent = undefined;
    set({ installable: false, installed: true });
  });

  // A service worker in development serves stale code while you edit, so it is production only.
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    void register().catch(() => {});
  }
}

/** Shows the browser's install dialog. Resolves to whether the user accepted. */
export async function promptInstall() {
  if (!installEvent) return false;
  const event = installEvent;
  // A prompt can be used once.
  installEvent = undefined;
  set({ installable: false });
  await event.prompt();
  return (await event.userChoice).outcome === "accepted";
}

/** Switches to the downloaded version and reloads the page on it. */
export function applyUpdate() {
  if (!waiting) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  waiting.postMessage({ type: "SKIP_WAITING" });
  set({ updateReady: false });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePwa() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
