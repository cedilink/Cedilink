"use client";

import { useState } from "react";
import { ApiError, type Transfer } from "@/lib/api/client";
import { checkRows } from "@/lib/dashboard/labels";
import { useCheckTransaction, useResolveTransfer } from "@/lib/dashboard/queries";
import { Overlay } from "./overlay";
import { Field, inputClass, PillButton } from "./ui";

/** The four checks of a transfer as the designs' sentence rows; the failing one is boxed. */
export function CheckRows({ transfer }: { transfer: Transfer }) {
  return (
    <ul>
      {checkRows(transfer).map((row) => {
        const failed = row.ok === false;
        return (
          <li
            key={row.label}
            className={`grid grid-cols-[96px_minmax(0,1fr)_12px] items-center gap-3 px-3 py-3.5 text-sm sm:grid-cols-[120px_minmax(0,1fr)_12px] ${
              failed ? "rounded-xl border border-line bg-surface/60" : "border-t border-dashed border-line first:border-0"
            }`}
          >
            <span className="text-[15px] text-ink">{row.label}</span>
            <span className="min-w-0 text-heading">{row.text}</span>
            <span
              className={`size-2 rounded-full ${row.ok === null ? "bg-subtle" : failed ? "bg-failed" : "bg-paid"}`}
              role="img"
              aria-label={row.ok === null ? "Not checked" : failed ? "Failed" : "Passed"}
            />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Confirms a merchant's decision on a flagged or unmatched transfer, saying exactly what
 * will happen. The note is saved with the decision.
 */
export function ResolveDialog({
  transfer,
  action,
  onClose,
  customerEmail,
}: {
  transfer: Transfer | null;
  action: "accept" | "dismiss";
  onClose: () => void;
  customerEmail?: string | null;
}) {
  const resolve = useResolveTransfer();
  const [note, setNote] = useState("");
  const open = transfer !== null;
  const t = transfer;
  const close = () => {
    resolve.reset();
    setNote("");
    onClose();
  };
  const error = resolve.error instanceof ApiError ? resolve.error.message : resolve.error ? "We couldn't save your decision. Please try again." : null;
  const accept = action === "accept";
  const already = t?.reason === "ALREADY_PAID";

  return (
    <Overlay
      open={open}
      onClose={close}
      role="alertdialog"
      title={t ? (accept ? `Accept ${t.paymentId ?? "this payment"} as paid?` : "Dismiss this payment?") : ""}
    >
      {t ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            resolve.mutate({ id: t.id, action, note: note.trim() || undefined }, { onSuccess: close });
          }}
        >
          {t.expected ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-2xl bg-surface p-4 text-sm">
              <dt className="text-muted">Expected</dt>
              <dd className="text-right text-ink">
                {t.expected.amount} {t.expected.asset}
              </dd>
              <dt className="text-muted">Received</dt>
              <dd className="text-right text-ink">
                {t.received.amount} {t.received.asset}
              </dd>
            </dl>
          ) : (
            <p className="rounded-2xl bg-surface p-4 text-sm text-ink">
              {t.received.amount} {t.received.asset} received
            </p>
          )}
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-heading">
            {accept ? (
              already ? (
                <>
                  <li>The request is already paid; this records that you have reviewed the extra payment.</li>
                  <li>Refund the customer from your wallet if you need to.</li>
                </>
              ) : (
                <>
                  <li>
                    {t.paymentId} is marked <strong className="font-medium text-ink">Confirmed</strong> and counts towards verified payments.
                  </li>
                  {customerEmail ? <li>The customer gets a receipt at {customerEmail}, if receipts are switched on.</li> : null}
                  {t.reason === "OVERPAID" ? <li>The extra amount stays in your wallet. Refund it yourself if you need to.</li> : null}
                  {t.reason === "UNDERPAID" ? <li>You accept less than you asked for; nothing else is collected.</li> : null}
                </>
              )
            ) : (
              <>
                <li>The payment stays in your wallet and the request keeps its status.</li>
                <li>It moves to Resolved, so it no longer counts as unmatched.</li>
              </>
            )}
          </ul>
          <Field label="Note (optional, saved with your decision)">
            <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={accept ? "e.g. Customer added a tip" : "e.g. Refunded off-platform"} />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-failed">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <PillButton variant="white" onClick={close}>
              Cancel
            </PillButton>
            <PillButton type="submit" variant={accept ? "brand" : "soft"} disabled={resolve.isPending}>
              {resolve.isPending ? "Saving…" : accept ? "Accept as paid" : "Dismiss"}
            </PillButton>
          </div>
        </form>
      ) : null}
    </Overlay>
  );
}

const VERDICTS: Partial<Record<NonNullable<Transfer["reason"]>, { title: string; body: string }>> = {
  WRONG_RECIPIENT: {
    title: "This payment went to a different wallet",
    body: "Cedilink can't recover it. Ask the customer to contact the owner of that wallet. The link stays open, so they can still pay to the right wallet.",
  },
  REFERENCE_MISMATCH: { title: "This transaction carries a different reference", body: "It was recorded against this request for you to review." },
  FAILED_ON_CHAIN: { title: "This transaction failed on Stellar", body: "Nothing was received. The customer can try again." },
};

/** "Check a transaction": a merchant pastes a hash a customer gave them and sees the result. */
export function CheckTransactionDialog({ paymentId, open, onClose }: { paymentId: string; open: boolean; onClose: () => void }) {
  const check = useCheckTransaction(paymentId);
  const [hash, setHash] = useState("");
  const close = () => {
    check.reset();
    setHash("");
    onClose();
  };
  const result = check.data;
  const verdict = result
    ? result.state === "matched"
      ? { title: "This payment matches", body: `${paymentId} is now confirmed.`, ok: true }
      : { ...(VERDICTS[result.reason ?? "UNVERIFIED"] ?? { title: "This payment needs review", body: result.reasonMessage }), ok: false }
    : null;
  const error =
    check.error instanceof ApiError
      ? check.error.code === "VALIDATION_ERROR"
        ? "A Stellar transaction hash is 64 letters and numbers."
        : check.error.message
      : check.error
        ? "We couldn't check that transaction. Please try again."
        : null;

  return (
    <Overlay open={open} onClose={close} title="Check a transaction" description={`Customer says they paid? Paste the transaction hash from their wallet and we'll check it against ${paymentId}.`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          check.mutate(hash.trim());
        }}
      >
        <Field label="Transaction hash" error={error ?? undefined}>
          <input
            className={`${inputClass} font-mono text-xs`}
            value={hash}
            onChange={(e) => {
              setHash(e.target.value);
              if (check.data || check.error) check.reset();
            }}
            spellCheck={false}
            autoComplete="off"
            placeholder="64-character hash"
            aria-invalid={Boolean(error)}
          />
        </Field>
        {result && verdict ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <div className={`rounded-2xl border px-4 py-3.5 ${verdict.ok ? "border-paid/20 bg-paid-tint/60" : "border-failed/20 bg-failed-tint/40"}`}>
              <p className={`text-[15px] font-medium ${verdict.ok ? "text-paid" : "text-failed"}`}>{verdict.title}</p>
              <p className="mt-1 text-sm text-heading">{verdict.body}</p>
            </div>
            <CheckRows transfer={result} />
          </div>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {result ? (
            <>
              <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-full border border-line px-4 text-sm text-ink hover:bg-surface">
                View on Stellar explorer
              </a>
              <PillButton onClick={close} className="bg-ink hover:bg-black">
                Done
              </PillButton>
            </>
          ) : (
            <PillButton type="submit" disabled={!hash.trim() || check.isPending}>
              {check.isPending ? "Checking…" : "Check transaction"}
            </PillButton>
          )}
        </div>
      </form>
    </Overlay>
  );
}

/** Asks before cancelling a link: customers can no longer pay it. */
export function CancelDialog({ open, onClose, onConfirm, pending, error }: { open: boolean; onClose: () => void; onConfirm: () => void; pending: boolean; error?: string | null }) {
  return (
    <Overlay open={open} onClose={onClose} role="alertdialog" title="Cancel this payment link?" description="Customers who open it will see that it was cancelled and won't be able to pay. This can't be undone.">
      {error ? (
        <p role="alert" className="mb-3 text-sm text-failed">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <PillButton variant="white" onClick={onClose}>
          Keep link
        </PillButton>
        <PillButton variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? "Cancelling…" : "Cancel link"}
        </PillButton>
      </div>
    </Overlay>
  );
}
