"use client";

import Lenis from "lenis";
import { useRef, type ReactNode } from "react";
import { DESKTOP, gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

const EASE = "expo.out";

/**
 * Owns every scroll-driven animation on the landing page. Sections stay plain markup and
 * opt in with data attributes:
 *
 *   data-split            heading whose lines rise from behind a mask when it enters
 *   data-words            paragraph whose words fill in as it crosses the viewport
 *   data-fade             fades and rises in; siblings entering together are staggered
 *   data-clip             frame opened by a wipe, with [data-clip-inner] settling inside
 *   data-parallax="0.15"  drifts against the scroll by that fraction of its height
 *   data-count="25"       counts up to the number (data-prefix / data-decimals optional)
 *
 * Everything is created inside gsap.matchMedia, so it is skipped for visitors who prefer
 * reduced motion and reverted when the page unmounts.
 */
export function LandingMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add({ motion: MOTION_OK, desktop: DESKTOP }, (context) => {
        const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        if (!motion) return;
        window.__motionReady = true;
        const q = gsap.utils.selector(scope);

        // ── Smooth scrolling, driven by GSAP's clock so pinned scenes stay in step ──
        const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        const onAnchor = (event: MouseEvent) => {
          const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
          const target = link && document.querySelector<HTMLElement>(link.getAttribute("href")!);
          if (!target) return;
          event.preventDefault();
          lenis.scrollTo(target, { offset: -72 });
        };
        document.addEventListener("click", onAnchor);

        // ── Hero: plays once on load. Large screens only; on small screens the hero is
        // already on screen and its entrance is CSS (see globals.css). ──
        const heroTitle = desktop ? q("[data-hero-title]")[0] : undefined;
        const hero = gsap.timeline({ defaults: { ease: EASE }, paused: !desktop });
        gsap.set(q("[data-hero]"), { autoAlpha: 1 });
        if (desktop) hero
          .fromTo(q("[data-hero-panel]"), { clipPath: "inset(100% 0% 0% 0% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.3, stagger: 0.12 })
          .fromTo(q("[data-hero-image]"), { scale: 1.3 }, { scale: 1, duration: 2.2 }, 0)
          .fromTo(q("[data-hero-phone]"), { yPercent: 45, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.5, ease: "back.out(1.1)" }, 0.35)
          .fromTo(q("[data-hero-item]"), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.7)
          .fromTo(q("[data-hero-avatar]"), { x: (i) => -i * 26, scale: 0.4, autoAlpha: 0 }, { x: 0, scale: 1, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: "back.out(1.6)" }, 1);
        if (heroTitle) {
          SplitText.create(heroTitle, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, stagger: 0.09, ease: EASE, delay: 0.25 }),
          });
        }
        // The sky is never quite still.
        gsap.to(q("[data-hero-drift]"), { xPercent: -4, duration: 26, ease: "sine.inOut", yoyo: true, repeat: -1 });
        // On scroll the layers separate: sky slower than the page, phone faster.
        gsap.to(q("[data-hero-sky]"), { yPercent: 14, ease: "none", scrollTrigger: { trigger: q("[data-hero-root]")[0], start: "top top", end: "bottom top", scrub: true } });
        gsap.to(q("[data-hero-phone-wrap]"), { yPercent: desktop ? -14 : -6, ease: "none", scrollTrigger: { trigger: q("[data-hero-root]")[0], start: "top top", end: "bottom top", scrub: true } });

        // ── Navigation: steps aside while reading down, returns on the way up ──
        const nav = q("[data-nav]")[0];
        if (nav) {
          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
              const hide = self.direction === 1 && self.scroll() > 240;
              gsap.to(nav, { yPercent: hide ? -120 : 0, duration: 0.5, ease: "power3.out", overwrite: true });
              nav.toggleAttribute("data-scrolled", self.scroll() > 24);
            },
          });
        }

        // ── Headings: lines rise from behind a mask ──
        for (const element of q("[data-split]")) {
          gsap.set(element, { autoAlpha: 1 });
          SplitText.create(element, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, { yPercent: 110, duration: 1.1, stagger: 0.09, ease: EASE, scrollTrigger: { trigger: element, start: "top 88%", once: true } }),
          });
        }

        // ── Statement text: words fill in with the scroll ──
        for (const element of q("[data-words]")) {
          gsap.set(element, { autoAlpha: 1 });
          SplitText.create(element, {
            type: "words",
            // The words stay ordinary text for screen readers. (The default labels the
            // element instead, which is not allowed on a paragraph.)
            aria: "none",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(self.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: element, start: "top 85%", end: "top 40%", scrub: true } }),
          });
        }

        // ── Generic fade-up; elements arriving together are staggered ──
        ScrollTrigger.batch(q("[data-fade]"), {
          start: "top 90%",
          once: true,
          onEnter: (batch) => gsap.fromTo(batch, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.1, ease: EASE, overwrite: true }),
        });

        // ── Framed images: wipe open while the picture settles inside ──
        for (const frame of q("[data-clip]")) {
          const inner = frame.querySelector("[data-clip-inner]");
          const reveal = gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 88%", once: true }, defaults: { ease: EASE, duration: 1.5 } });
          reveal.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 }, { clipPath: "inset(0% 0% 0% 0%)" });
          if (inner) reveal.fromTo(inner, { scale: 1.35 }, { scale: 1 }, 0);
        }

        for (const element of q<HTMLElement>("[data-parallax]")) {
          const amount = Number(element.dataset.parallax) * (desktop ? 100 : 50);
          gsap.fromTo(element, { yPercent: -amount }, { yPercent: amount, ease: "none", scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        }

        // ── Numbers count up when first seen ──
        for (const element of q<HTMLElement>("[data-count]")) {
          const target = Number(element.dataset.count);
          const decimals = Number(element.dataset.decimals ?? 0);
          const prefix = element.dataset.prefix ?? "";
          const state = { value: 0 };
          const render = () => (element.textContent = prefix + state.value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
          gsap.to(state, { value: target, duration: 1.6, ease: "power3.out", onUpdate: render, scrollTrigger: { trigger: element, start: "top 92%", once: true } });
        }

        // ── Dashboard: the browser window tilts up and settles flat as it arrives ──
        const frame = q("[data-dashboard-frame]")[0];
        if (frame) {
          gsap.fromTo(
            frame,
            { scale: 0.86, rotateX: desktop ? 14 : 6, y: 80, transformPerspective: 1600, transformOrigin: "50% 0%" },
            { scale: 1, rotateX: 0, y: 0, ease: "none", scrollTrigger: { trigger: frame, start: "top 98%", end: "top 30%", scrub: true } },
          );
        }

        // ── Verification: each check is drawn in turn ──
        const checks = q("[data-verify-row]");
        if (checks.length) {
          const verify = gsap.timeline({ scrollTrigger: { trigger: checks[0], start: "top 80%", once: true } });
          checks.forEach((row, index) => {
            const at = index * 0.32;
            verify
              .fromTo(row, { autoAlpha: 0.25 }, { autoAlpha: 1, duration: 0.3 }, at)
              .fromTo(row.querySelectorAll("[data-draw]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, stagger: 0.18, ease: "power2.out" }, at);
          });
          verify.fromTo(q("[data-verify-result]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE });
        }

        // ── Testnet band: widens to full bleed ──
        const band = q("[data-band]")[0];
        if (band) {
          gsap.fromTo(band, { clipPath: "inset(0% 9% 0% 9% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", ease: "none", scrollTrigger: { trigger: band, start: "top 95%", end: "top 45%", scrub: true } });
        }

        // The pinned checkout scene registers itself before this code runs (child effects
        // run first), so put the triggers back in page order, and measure again once the
        // web font has settled the line breaks.
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        void document.fonts.ready.then(() => ScrollTrigger.refresh());

        return () => {
          document.removeEventListener("click", onAnchor);
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      });

      return () => media.revert();
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
