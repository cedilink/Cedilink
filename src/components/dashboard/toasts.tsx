"use client";

import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import highFive from "@/assets/illustrations/high-five.svg";
import type { Schemas } from "@/lib/api/client";
import { formatUsd } from "@/lib/format";

type Update = Schemas["PaymentUpdate"];
const VISIBLE_FOR_MS = 8_000;

/**
 * Listens to the merchant's live event stream. Every update refreshes the data on screen;
 * a payment turning PAID also raises the "Payment successful" toast from the designs.
 */
export function LiveUpdates() {
  const client = useQueryClient();
  const [toasts, setToasts] = useState<Update[]>([]);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.addEventListener("payment.updated", (event) => {
      let update: Update;
      try {
        update = JSON.parse((event as MessageEvent).data);
      } catch {
        return;
      }
      void client.invalidateQueries({ queryKey: ["payments"] });
      void client.invalidateQueries({ queryKey: ["payment", update.paymentId] });
      void client.invalidateQueries({ queryKey: ["overview"] });
      if (update.status === "PAID" && !update.flag) {
        setToasts((current) => [...current.filter((t) => t.paymentId !== update.paymentId), update]);
        setTimeout(() => setToasts((current) => current.filter((t) => t.paymentId !== update.paymentId)), VISIBLE_FOR_MS);
      }
    });
    return () => source.close();
  }, [client]);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.paymentId}
            layout
            className="pointer-events-auto relative w-full rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:w-72"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <button
              type="button"
              aria-label="Dismiss"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full hover:bg-surface"
              onClick={() => setToasts((current) => current.filter((t) => t.paymentId !== toast.paymentId))}
            >
              <X className="size-3.5" />
            </button>
            <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }} className="w-fit">
              <Image src={highFive} alt="" width={40} height={36} unoptimized />
            </motion.div>
            <Link href={`/dashboard/payments/${toast.paymentId}`} className="mt-2 block">
              <p className="text-sm font-medium text-ink">Payment successful</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatUsd(toast.amount.replace(/(\.\d\d)\d+$/, "$1"))} {toast.assetCode} · {toast.orderId}
              </p>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
