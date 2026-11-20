"use client";

import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Image from "next/image";
import hands from "@/assets/illustrations/new-illustration.svg";
import type { ComponentType } from "react";
import type { Checkout } from "@/lib/api/client";
import type { Screen } from "@/lib/checkout/machine";
import { useCheckout, type CheckoutController } from "@/lib/checkout/use-checkout";
import { formatUsd } from "@/lib/format";
import { AutoHeight } from "../motion/auto-height";
import { Mascot } from "../motion/mascot";
import * as screens from "./screens";
import { WalletPicker } from "./wallet-picker";

const SCREENS: Record<Screen, ComponentType<{ checkout: Checkout; controller: CheckoutController }>> = {
  selectMethod: screens.SelectMethod,
  summary: screens.Summary,
  review: screens.Review,
  awaitingApproval: screens.AwaitingApproval,
  processing: screens.Processing,
  success: screens.Success,
  insufficientUsdc: screens.InsufficientUsdc,
  insufficientXlm: screens.InsufficientXlm,
  failed: screens.Failed,
  pending: screens.Pending,
  wrongNetwork: screens.WrongNetwork,
  expired: screens.Expired,
  alreadyPaid: screens.AlreadyPaid,
  walletDisconnected: screens.WalletDisconnected,
  connectionRejected: screens.ConnectionRejected,
  walletNotInstalled: screens.WalletNotInstalled,
  walletApp: screens.WalletApp,
  cancelled: screens.Cancelled,
  mismatch: screens.Mismatch,
};

// Order of the main path, used to slide forwards or backwards between screens.
const ORDER: Screen[] = ["selectMethod", "summary", "review", "awaitingApproval", "processing", "success"];

// The three screens that lead with the amount. It stays mounted across them, so the
// figure holds its place while the rest of the card changes around it.
const AMOUNT_LABEL: Partial<Record<Screen, string>> = {
  selectMethod: "Total",
  summary: "Amount due",
  review: "Payment amount",
};

export function CheckoutFlow({ checkout }: { checkout: Checkout }) {
  const controller = useCheckout(checkout);
  const { state } = controller;
  const ScreenView = SCREENS[state.screen];

  const amountLabel = AMOUNT_LABEL[state.screen];
  const canGoBack = state.screen === "summary" || state.screen === "review" || state.screen === "walletApp";
  const title =
    state.screen === "selectMethod"
      ? "Choose payment method"
      : state.screen === "summary" || state.screen === "walletApp"
        ? "Awaiting Payment"
        : state.screen === "review"
          ? "Review Payment"
          : "SmartPay";
  const identity = state.screen === "selectMethod" ? checkout.productName : checkout.merchant.name;
  // Method selection sits on the page background with its own white rows, as designed.
  const plain = state.screen === "selectMethod";

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-white">
        <header className="relative z-10 flex h-20 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            aria-label="Back"
            onClick={controller.back}
            disabled={!canGoBack}
            className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-opacity disabled:opacity-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <p className="text-[15px] text-ink">{title}</p>
          <span className="ml-auto rounded-full bg-surface px-3 py-1.5 text-xs text-muted">{checkout.network.label}</span>
        </header>

        {/* Room at the bottom for the hands, so the last button never sits over their busiest part. */}
        <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-40 pt-2 sm:items-center sm:pb-56 sm:pt-0">
          <div className="w-full max-w-[400px]">
            <AnimatePresence initial={false}>
              {amountLabel ? (
                <motion.section
                  key="amount"
                  className="overflow-hidden rounded-t-3xl bg-surface"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  style={plain ? { borderRadius: 24, marginBottom: 12 } : undefined}
                >
                  <div className="px-4 pb-6 pt-4">
                    <AnimatePresence initial={false}>
                      {state.screen !== "review" ? (
                        <motion.div
                          key="identity"
                          className="flex items-center gap-2.5 overflow-hidden"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 40 }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Mascot size={32} />
                          <span className="truncate text-sm text-ink">{identity}</span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <div className="pt-6 text-center">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={amountLabel}
                          className="text-xs text-muted"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                        >
                          {amountLabel}
                        </motion.p>
                      </AnimatePresence>
                      <p className="mt-1 text-[44px] font-medium leading-none tracking-[-0.04em] text-ink">{formatUsd(checkout.amount)}</p>
                    </div>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>

            <AutoHeight className={`${plain ? "" : "bg-surface"} ${amountLabel && !plain ? "rounded-b-3xl" : "rounded-3xl"}`}>
              <div className={plain ? "" : "p-4"}>
                <AnimatePresence mode="wait" initial={false} custom={ORDER.indexOf(state.screen)}>
                  <motion.div
                    key={state.screen}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ScreenView checkout={checkout} controller={controller} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </AutoHeight>
          </div>
        </main>

        <Hands />

        <WalletPicker
          open={state.walletPickerOpen}
          connecting={state.connecting ? state.lastWalletId : null}
          onSelect={controller.connect}
          // Older backends do not send the issuer; without it a direct payment cannot be described.
          onWalletApp={checkout.assetIssuer ? controller.payFromWalletApp : undefined}
          onClose={controller.closeWallets}
        />
      </div>
    </MotionConfig>
  );
}

/**
 * The hand-drawn hands along the bottom of every checkout screen. They sit behind the card,
 * pinned to the bottom of the page, and never take a tap. They rise once on first load;
 * reduced motion shows them still. On phones one fixed crop is used on every screen.
 */
function Hands() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-start overflow-hidden sm:justify-center"
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
    >
      <Image src={hands} alt="" priority={false} unoptimized className="-ml-5 h-auto w-[760px] max-w-none select-none sm:ml-0 sm:w-[min(1438px,94vw)]" />
    </motion.div>
  );
}
