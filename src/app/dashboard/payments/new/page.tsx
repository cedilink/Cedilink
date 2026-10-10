"use client";

import { ChevronDown, CircleCheck, Copy, Plus, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, Field, inputClass, Loading, PageHeader, PillButton } from "@/components/dashboard/ui";
import { CopyButton } from "@/components/ui/copy-button";
import { ApiError, type Payment } from "@/lib/api/client";
import { useCreatePayment, useStellarSettings } from "@/lib/dashboard/queries";
import { formatUsd, truncateAddress } from "@/lib/format";

/** A select showing the single option available in this release. */
function FixedSelect({ value }: { value: string }) {
  return (
    <div className="relative">
      <select className={`${inputClass} appearance-none pr-10`} value={value} disabled aria-readonly>
        <option>{value}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink" />
    </div>
  );
}

function Created({ payment, onAnother }: { payment: Payment; onAnother: () => void }) {
  const [copied, setCopied] = useState(false);
  const rows: [string, string][] = [
    ["Payment ID", payment.paymentId],
    ["Order ID", payment.orderId],
    ["Amount", `${formatUsd(payment.amount)} ${payment.asset}`],
    ["Network", payment.network],
  ];
  return (
    <div className="mx-auto max-w-xl pt-4 lg:pt-10">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-paid-tint text-paid">
          <CircleCheck className="size-5" />
        </span>
        <div>
          <h1 className="text-xl tracking-tight text-ink">Checkout created</h1>
          <p className="text-xs text-muted">Share this link with your customer.</p>
        </div>
      </div>
      <Card className="p-5">
        <p className="mb-1.5 text-xs text-muted">Smartpay checkout link</p>
        <div className="flex h-11 items-center gap-3 rounded-full border border-line px-4">
          <span className="min-w-0 flex-1 truncate text-sm text-ink">{payment.checkoutUrl}</span>
          <CopyButton value={payment.checkoutUrl} label="checkout link" />
        </div>
        <dl className="mt-4 rounded-2xl border border-line px-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-4 border-b border-line py-3.5 text-sm last:border-0 max-sm:flex-col max-sm:gap-1">
              <dt className="w-36 shrink-0 text-xs text-muted sm:pt-0.5">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
        <PillButton
          onClick={async () => {
            await navigator.clipboard.writeText(payment.checkoutUrl).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Copy className="size-4" /> {copied ? "Copied" : "Copy link"}
        </PillButton>
        <a href={payment.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-ink hover:bg-line">
          <SquareArrowOutUpRight className="size-4" /> Open checkout
        </a>
        <PillButton variant="white" onClick={onAnother}>
          <Plus className="size-4" /> Create another
        </PillButton>
      </div>
    </div>
  );
}

export default function CreatePaymentPage() {
  const settings = useStellarSettings();
  const create = useCreatePayment();
  const [created, setCreated] = useState<Payment>();
  // One key per form, so a double submit or a retry after a network error cannot create two payments.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  if (created) {
    return (
      <Created
        payment={created}
        onAnother={() => {
          setCreated(undefined);
          create.reset();
          setIdempotencyKey(crypto.randomUUID());
        }}
      />
    );
  }

  const apiError = create.error instanceof ApiError ? create.error : undefined;
  const fields = (apiError?.details.fields ?? {}) as Record<string, string>;
  const orderTaken = apiError?.code === "ORDER_ID_TAKEN";
  const formError = create.error && !orderTaken && Object.keys(fields).length === 0 ? (apiError?.message ?? "We couldn't create the payment. Please try again.") : undefined;
  const ready = settings.data?.enabled && settings.data.receivingAddress;

  return (
    <>
      <PageHeader title="Create Payment" />
      {!settings.data ? (
        <Loading />
      ) : (
        <form
          className="mx-auto max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const text = (name: string) => String(form.get(name) ?? "").trim();
            create.mutate(
              {
                idempotencyKey,
                input: {
                  productName: text("productName"),
                  amount: text("amount"),
                  orderId: text("orderId") || undefined,
                  customer: { name: text("customerName") || undefined, email: text("customerEmail") || undefined },
                },
              },
              // A rejected request never created anything, so the next attempt needs a fresh key.
              { onSuccess: setCreated, onError: () => setIdempotencyKey(crypto.randomUUID()) },
            );
          }}
        >
          {!ready ? (
            <p className="mb-4 rounded-2xl bg-awaiting-tint px-4 py-3 text-sm text-awaiting">
              Stellar USDC is not enabled yet.{" "}
              <Link href="/dashboard/payment-methods/stellar-usdc" className="underline">
                Set your receiving wallet
              </Link>{" "}
              before creating a payment.
            </p>
          ) : null}
          <Card className="flex flex-col gap-5 p-5">
            <Field label="Product or service" error={fields.productName}>
              <input className={inputClass} name="productName" placeholder="Ghana Web3 Conference Ticket" maxLength={140} required aria-invalid={Boolean(fields.productName)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount" error={fields.amount}>
                <input className={inputClass} name="amount" inputMode="decimal" placeholder="25.00" pattern="\d+(\.\d{1,7})?" title="A number such as 25 or 25.00" required aria-invalid={Boolean(fields.amount)} />
              </Field>
              <Field label="Currency">
                <FixedSelect value="USDC" />
              </Field>
            </div>
            <Field label="Payment method">
              <FixedSelect value="Stellar USDC" />
            </Field>
            <Field label="Order ID or reference" error={orderTaken ? apiError?.message : fields.orderId} hint="Leave blank to generate one.">
              <input className={inputClass} name="orderId" placeholder="CD-2026-00124" maxLength={64} aria-invalid={orderTaken || Boolean(fields.orderId)} />
            </Field>
            <Field label="Payment destination">
              <input
                className={inputClass}
                readOnly
                value={settings.data.receivingAddress ? `Receiving wallet ${truncateAddress(settings.data.receivingAddress)}` : "No receiving wallet set"}
              />
            </Field>
            <div>
              <p className="mb-3 text-base text-ink">
                Customer information <span className="ml-1 text-xs text-muted">Optional</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Customer name" error={fields["customer.name"]}>
                  <input className={inputClass} name="customerName" placeholder="Enter customer name" maxLength={140} />
                </Field>
                <Field label="Email address" error={fields["customer.email"]}>
                  <input className={inputClass} name="customerEmail" type="email" placeholder="Enter email address" aria-invalid={Boolean(fields["customer.email"])} />
                </Field>
              </div>
            </div>
            {formError ? (
              <p className="text-sm text-failed" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Link href="/dashboard/payments" className="inline-flex h-10 items-center justify-center rounded-full border border-line px-5 text-sm font-medium text-ink hover:bg-surface">
                Cancel
              </Link>
              <PillButton type="submit" disabled={create.isPending || !ready} className="px-6">
                {create.isPending ? "Generating…" : "Generate checkout"}
              </PillButton>
            </div>
          </Card>
        </form>
      )}
    </>
  );
}
