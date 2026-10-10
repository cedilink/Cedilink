"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DESKTOP, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { Cta } from "./cta";
import { Phone, ProcessingScreen, ReviewScreen, SuccessScreen, SummaryScreen, WalletScreen } from "./mocks";

const STEPS = [
  { title: "See exactly what you're paying for", text: "Merchant, product, amount and order reference, before anything is connected.", phone: "Smartpay", Screen: SummaryScreen },
  { title: "Connect a Stellar wallet", text: "Freighter today. No Credlink login, no shopper account.", phone: "Smartpay", Screen: WalletScreen },
  { title: "Review the payment", text: "Your balance, the recipient and the network fee, all in one place.", phone: "Review Payment", Screen: ReviewScreen },
  { title: "Approve it in your wallet", text: "You sign; Credlink submits the transaction and waits for Stellar.", phone: "Smartpay", Screen: ProcessingScreen },
  { title: "Paid, and verified on-chain", text: "Success is shown only once the payment is confirmed on Stellar.", phone: "Smartpay", Screen: SuccessScreen },
] as const;

/**
 * The centrepiece. On desktop the section pins and scrolling steps the phone through a
 * real checkout. GSAP owns the pin and the progress rail; Motion owns the change of
 * screen inside the phone. On small screens and with reduced motion nothing pins: the
 * steps advance on a timer while in view, and can be tapped.
 */
export function CheckoutScene() {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const still = useReducedMotion();

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        setPinned(true);
        const trigger = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 3}`,
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)));
            gsap.set(rail.current, { scaleY: self.progress });
          },
        });
        return () => {
          trigger.kill();
          setPinned(false);
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  // Without the pin, advance on a timer while the section is on screen.
  useEffect(() => {
    if (pinned || still || !root.current) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (entry?.isIntersecting) timer = setInterval(() => setActive((index) => (index + 1) % STEPS.length), 3200);
      },
      { threshold: 0.35 },
    );
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [pinned, still]);

  const step = STEPS[active]!;
  return (
    <section ref={root} id="how-it-works" className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-[1312px] items-center gap-10 px-4 py-20 sm:px-8 lg:h-dvh lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:py-0">
        <div>
          <h2 data-split className="text-display text-[clamp(2.25rem,4.4vw,3.75rem)] text-heading">
            A clear checkout.
            <br />
            No new account.
          </h2>
          <p data-fade className="mt-5 max-w-xl text-lg text-muted">
            Your customer sees who they&apos;re paying, what it&apos;s for and the USDC amount before connecting anything.
          </p>

          <ol className="relative mt-9 flex flex-col gap-1 pl-6" data-fade>
            <span className="absolute bottom-3 left-[3px] top-3 w-px bg-line" aria-hidden />
            <span
              ref={rail}
              aria-hidden
              className="absolute bottom-3 left-[3px] top-3 w-px origin-top bg-brand"
              style={pinned ? undefined : { transform: `scaleY(${(active + 1) / STEPS.length})`, transition: "transform 0.6s var(--ease-out-expo)" }}
            />
            {STEPS.map((item, index) => {
              const current = index === active;
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => !pinned && setActive(index)}
                    aria-current={current ? "step" : undefined}
                    className={`block w-full rounded-xl py-2 text-left transition-opacity duration-500 ${current ? "opacity-100" : "opacity-35"} ${pinned ? "cursor-default" : ""}`}
                  >
                    <span className="block text-lg tracking-tight text-ink">{item.title}</span>
                    <span className={`grid transition-[grid-template-rows] duration-500 ease-out ${current ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <span className="overflow-hidden text-sm text-muted">{item.text}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div data-fade className="mt-8">
            <Cta />
          </div>
        </div>

        <div className="relative mx-auto lg:mr-6" data-fade>
          <div className="absolute -inset-x-10 -inset-y-6 -z-10 rounded-[48px] bg-brand-tint" aria-hidden />
          <Phone title={step.phone} className="min-h-[560px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={still ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={still ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <step.Screen />
              </motion.div>
            </AnimatePresence>
          </Phone>
        </div>
      </div>
    </section>
  );
}
