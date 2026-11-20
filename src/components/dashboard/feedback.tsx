"use client";

import { MessageSquareText } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { Overlay } from "./overlay";
import { Field, inputClass, PillButton } from "./ui";

// The scenarios from docs/user-testing-guide.md, so feedback can be grouped by task.
const SCENARIOS = [
  "Create a payment link",
  "Pay a link (checkout)",
  "Pay from a wallet app",
  "Review a flagged payment",
  "Accept or dismiss a payment",
  "Find a transaction",
  "Download a CSV report",
  "Cancel a link",
  "Notifications",
  "Something else",
];

/** User-testing feedback, shown only when NEXT_PUBLIC_FEEDBACK=true. */
export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [rating, setRating] = useState(0);
  if (process.env.NEXT_PUBLIC_FEEDBACK !== "true") return null;

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setState("idle");
      setRating(0);
    }, 300);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-30 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-white shadow-lg lg:left-auto lg:right-6 lg:bottom-6"
      >
        <MessageSquareText className="size-4" /> Feedback
      </button>
      <Overlay open={open} onClose={close} title={state === "sent" ? "Thank you" : "How did that go?"}>
        {state === "sent" ? (
          <div>
            <p className="text-sm text-heading">Your feedback was saved. It goes straight into the validation report.</p>
            <PillButton className="mt-5 w-full" onClick={close}>
              Done
            </PillButton>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setState("sending");
              try {
                await api("/feedback", {
                  method: "POST",
                  body: {
                    scenario: String(form.get("scenario")),
                    rating,
                    worked: form.get("worked") === "yes",
                    comment: String(form.get("comment") ?? "").trim() || undefined,
                    page: pathname,
                    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
                  },
                });
                setState("sent");
              } catch {
                setState("error");
              }
            }}
          >
            <Field label="What were you trying to do?">
              <select name="scenario" className={inputClass} defaultValue={SCENARIOS[0]}>
                {SCENARIOS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-xs text-muted">Did it work?</legend>
              <div className="flex gap-2">
                {["yes", "no"].map((v) => (
                  <label key={v} className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full border border-line text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-tint has-[:checked]:text-brand">
                    <input type="radio" name="worked" value={v} required className="sr-only" />
                    {v === "yes" ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1.5 text-xs text-muted">How easy was it? (1 hard, 5 easy)</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                    className={`h-10 flex-1 rounded-full border text-sm ${rating === n ? "border-brand bg-brand-tint text-brand" : "border-line text-ink"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Anything confusing or broken? (optional)">
              <textarea name="comment" rows={3} maxLength={2000} className={`${inputClass} h-auto rounded-2xl py-3`} />
            </Field>
            {state === "error" ? (
              <p role="alert" className="text-sm text-failed">
                We couldn&apos;t save that. Please try again.
              </p>
            ) : null}
            <PillButton type="submit" disabled={!rating || state === "sending"}>
              {state === "sending" ? "Sending…" : "Send feedback"}
            </PillButton>
          </form>
        )}
      </Overlay>
    </>
  );
}
