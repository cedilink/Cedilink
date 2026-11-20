"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A modal: a centred dialog from `sm` up, a bottom sheet on phones so its actions sit in
 * thumb reach. Escape and the backdrop close it; focus moves in and returns on close.
 */
export function Overlay({
  open,
  onClose,
  title,
  description,
  children,
  role = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  role?: "dialog" | "alertdialog";
}) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none sm:max-w-[480px] sm:rounded-3xl sm:p-6"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <span className="mx-auto -mt-1 mb-3 block h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="flex items-start gap-3">
              <h2 id={titleId} className="flex-1 text-xl leading-tight tracking-tight text-ink">
                {title}
              </h2>
              <button type="button" aria-label="Close" onClick={onClose} className="-mr-2 -mt-2 grid size-10 place-items-center rounded-full hover:bg-surface">
                <X className="size-4" />
              </button>
            </div>
            {description ? (
              <div id={descId} className="mt-2 text-sm text-heading">
                {description}
              </div>
            ) : null}
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
