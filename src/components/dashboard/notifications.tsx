"use client";

import { Bell, CircleAlert, CircleCheck, Clock, Download, ShieldCheck, TimerOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Notification } from "@/lib/api/client";
import { useMarkRead, useNotifications } from "@/lib/dashboard/queries";

const TYPES: Record<Notification["type"], { Icon: typeof Bell; className: string }> = {
  payment_received: { Icon: CircleCheck, className: "bg-paid-tint text-paid" },
  payment_verified: { Icon: ShieldCheck, className: "bg-paid-tint text-paid" },
  payment_pending: { Icon: Clock, className: "bg-brand-tint text-brand" },
  payment_failed: { Icon: CircleAlert, className: "bg-failed-tint text-failed" },
  payment_unmatched: { Icon: Download, className: "bg-failed-tint text-failed" },
  request_expired: { Icon: TimerOff, className: "bg-line text-heading" },
};

/** Where a notification leads: unmatched payments to Reconciliation, the rest to the payment link. */
export function notificationHref(n: Notification): string {
  if (n.type === "payment_unmatched") return `/dashboard/reconciliation${n.transferId ? `?item=${n.transferId}` : ""}`;
  return n.paymentId ? `/dashboard/links/${n.paymentId}` : "/dashboard/notifications";
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
export function ago(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86_400), "day");
}

export function NotificationItem({ n, onOpen }: { n: Notification; onOpen?: () => void }) {
  const router = useRouter();
  const markRead = useMarkRead();
  const type = TYPES[n.type];
  return (
    <Link
      href={notificationHref(n)}
      onClick={(event) => {
        event.preventDefault();
        if (!n.read) markRead.mutate([n.id]);
        onOpen?.();
        router.push(notificationHref(n));
      }}
      className={`flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface ${n.read ? "" : "bg-brand-wash/60"}`}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${type.className}`}>
        <type.Icon className="size-4" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-ink">
          {n.title}
          {n.read ? null : <span className="sr-only"> (unread)</span>}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">{n.body}</span>
      </span>
      <span className="shrink-0 text-xs text-muted">{ago(n.createdAt)}</span>
    </Link>
  );
}

/** The bell in the top bar and its panel. Opening it does not mark anything read; opening an item does. */
export function NotificationsBell() {
  const { data } = useNotifications();
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-10 place-items-center rounded-full text-ink hover:bg-surface"
      >
        <Bell className="size-[18px]" strokeWidth={1.7} />
        {unread ? <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-failed ring-2 ring-white" /> : null}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panel}
            role="dialog"
            aria-labelledby={headingId}
            tabIndex={-1}
            className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_50px_rgba(0,0,0,0.14)] outline-none sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px]"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top right" }}
          >
            <div className="flex items-center gap-2 px-4 pb-2 pt-4">
              <h2 id={headingId} className="flex-1 text-base text-ink">
                Notifications
              </h2>
              {unread ? (
                <button type="button" onClick={() => markRead.mutate(undefined)} className="rounded-full px-2 py-1 text-xs text-brand hover:bg-brand-wash">
                  Mark all as read
                </button>
              ) : null}
            </div>
            <div className="max-h-[min(28rem,60dvh)] overflow-y-auto border-t border-line">
              {!data ? (
                <p className="px-4 py-8 text-center text-sm text-muted">Loading…</p>
              ) : data.notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">No notifications yet. Payments and checks will show up here.</p>
              ) : (
                data.notifications.slice(0, 10).map((n) => <NotificationItem key={n.id} n={n} onOpen={() => setOpen(false)} />)
              )}
            </div>
            <div className="flex gap-2 border-t border-line p-3">
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-surface text-sm text-ink hover:bg-line">
                View all
              </Link>
              <Link href="/dashboard/reconciliation" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-brand-tint text-sm text-brand hover:bg-brand-wash">
                Open Reconciliation
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
