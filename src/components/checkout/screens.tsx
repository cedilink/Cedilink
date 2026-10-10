"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import bitcoin from "@/assets/illustrations/bitcoin.png";
import stellarLogo from "@/assets/illustrations/stellar-logo.png";
import walletCards from "@/assets/illustrations/wallet-cards.png";
import type { Checkout } from "@/lib/api/client";
import type { CheckoutController } from "@/lib/checkout/use-checkout";
import { walletAppLink } from "@/lib/checkout/sep7";
import { formatDateTime, truncateAddress, truncateHash } from "@/lib/format";
import { Badge, Spinner } from "../motion/badge";
import { Button, buttonClass } from "../ui/button";
import { CopyButton } from "../ui/copy-button";
import { Note, Panel, Row, StatusScreen } from "./parts";

type Props = { checkout: Checkout; controller: CheckoutController };

const FREIGHTER_URL = "https://www.freighter.app/";

/** "25.00" -> "$25", "25.50" -> "$25.50": the short form used on the pay button. */
const shortUsd = (amount: string) => `$${amount.replace(/\.00$/, "")}`;

function ExternalLink({ href, variant, children }: { href: string; variant: "ink" | "outline"; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={buttonClass({ variant })}>
      {children}
    </a>
  );
}

function ReturnToMerchant({ checkout, variant }: { checkout: Checkout; variant: "ink" | "outline" }) {
  if (!checkout.returnUrl) return null;
  return (
    <a href={checkout.returnUrl} className={buttonClass({ variant })}>
      Return to Merchant
    </a>
  );
}

// ── 01 ──────────────────────────────────────────────────────────────────────────

const METHOD_ART = {
  card: { src: walletCards, text: "Pay with a debit or credit card", className: "object-contain" },
  crypto: { src: bitcoin, text: "Pay with other supported crypto networks", className: "" },
  stellar_usdc: { src: stellarLogo, text: "Pay securely with USDC on Stellar.", className: "" },
} as const;

export function SelectMethod({ checkout, controller }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-2">
        {checkout.methods.map((method) => {
          const art = METHOD_ART[method.id as keyof typeof METHOD_ART] ?? METHOD_ART.stellar_usdc;
          return (
            <div
              key={method.id}
              role="radio"
              aria-checked={method.available}
              aria-disabled={!method.available}
              className={`flex items-center gap-3 rounded-2xl bg-white p-3 ${method.available ? "" : "opacity-55"}`}
            >
              <Image src={art.src} alt="" width={36} height={36} className={`size-9 shrink-0 rounded-lg ${art.className}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{method.label}</p>
                <p className="text-xs text-muted">{method.available ? art.text : "Not available in this demo"}</p>
              </div>
              <span className={`grid size-4 place-items-center rounded-full border ${method.available ? "border-ink" : "border-subtle"}`}>
                {method.available ? <span className="size-2 rounded-full bg-ink" /> : null}
              </span>
            </div>
          );
        })}
      </div>
      <Button onClick={controller.next}>Continue</Button>
    </div>
  );
}

// ── 02 ──────────────────────────────────────────────────────────────────────────

export function Summary({ checkout, controller }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <Row label="Product or service">{checkout.productName}</Row>
        <Row label={`${checkout.asset} amount`}>
          {checkout.amount} {checkout.asset}
        </Row>
        <Row label="Network">{checkout.network.label}</Row>
        <Row label="Order ID">{checkout.orderId}</Row>
        <Row label="Payment ID">{checkout.paymentId}</Row>
      </Panel>
      <Button onClick={controller.openWallets}>Connect Stellar Wallet</Button>
    </div>
  );
}

// ── 04 ──────────────────────────────────────────────────────────────────────────

export function Review({ checkout, controller }: Props) {
  const { wallet, preflight } = controller.state;
  if (!wallet || !preflight) return null;
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div>
          <Row label="Wallet">
            <span>{truncateAddress(wallet.address)}</span>
            <CopyButton value={wallet.address} label="wallet address" />
          </Row>
          <button type="button" onClick={controller.disconnect} className="mt-2 text-sm text-ink underline-offset-4 hover:underline">
            Disconnect
          </button>
        </div>
        <Row label="Available balance">
          {preflight.balance} {preflight.asset}
        </Row>
        <Row label="Payment amount">
          {checkout.amount} {checkout.asset}
        </Row>
        <Row label="Network">{checkout.network.label}</Row>
        <div>
          <Row label="Recipient">{checkout.merchant.name}</Row>
          <p className="mt-1.5 flex items-center gap-2.5 text-sm text-ink">
            <span>{truncateAddress(checkout.recipientAddress)}</span>
            <CopyButton value={checkout.recipientAddress} label="recipient address" />
          </p>
        </div>
        <Row label="Network fee" note="A small fee paid to the Stellar network.">
          About {Number(preflight.estimatedFee)} {preflight.feeAsset}
        </Row>
      </Panel>
      <Button onClick={controller.pay}>
        Pay {shortUsd(checkout.amount)} {checkout.asset}
      </Button>
    </div>
  );
}

// ── 05 ──────────────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
  <div className="grid size-[72px] place-items-center rounded-full bg-surface text-ink">
    <Spinner />
  </div>
);

const PaymentLine = ({ checkout }: { checkout: Checkout }) => (
  <Note>
    {checkout.amount} {checkout.asset} to {checkout.merchant.name}
  </Note>
);

export function AwaitingApproval({ checkout, controller }: Props) {
  return (
    <StatusScreen
      icon={<SpinnerIcon />}
      title="Waiting for approval"
      message="Approve the payment in your wallet to continue."
      actions={
        <Button variant="soft" onClick={controller.cancelApproval}>
          Cancel
        </Button>
      }
    >
      <PaymentLine checkout={checkout} />
      <div className="flex items-center justify-center gap-2 py-1" aria-hidden>
        <motion.span className="size-1.5 rounded-full bg-ink" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <span className="h-px w-8 bg-line" />
        <span className="size-1.5 rounded-full bg-line" />
        <span className="h-px w-8 bg-line" />
        <span className="size-1.5 rounded-full bg-line" />
      </div>
    </StatusScreen>
  );
}

// ── 06 ──────────────────────────────────────────────────────────────────────────

function Step({ label, state }: { label: string; state: "done" | "active" | "waiting" }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
          state === "done" ? "bg-ink text-white" : "bg-white text-ink"
        }`}
      >
        {state === "done" ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
            <Check className="size-3.5" strokeWidth={2.5} />
          </motion.span>
        ) : state === "active" ? (
          <Spinner className="size-3.5" />
        ) : null}
      </span>
      <span>
        <span className={`block text-sm ${state === "waiting" ? "text-muted" : "text-ink"}`}>{label}</span>
        <span className="block text-xs text-muted">{state === "done" ? "Done" : state === "active" ? "In progress" : "Waiting"}</span>
      </span>
    </li>
  );
}

export function Processing({ checkout, controller }: Props) {
  const { status } = controller.state;
  // Each step reflects a backend status, not a timer.
  const submitted = status === "TRANSACTION_SUBMITTED" || status === "CONFIRMING" || status === "PAID";
  const confirming = status === "CONFIRMING" || status === "PAID";
  return (
    <StatusScreen icon={<SpinnerIcon />} title="Processing payment…">
      <PaymentLine checkout={checkout} />
      <ol className="flex flex-col gap-4 rounded-2xl bg-surface p-4" aria-live="polite">
        <Step label="Payment initiated" state="done" />
        <Step label="Transaction submitted" state={submitted ? "done" : "active"} />
        <Step label="Confirming on Stellar" state={status === "PAID" ? "done" : confirming || submitted ? "active" : "waiting"} />
      </ol>
      <p className="text-center text-sm text-muted">Please keep this page open.</p>
    </StatusScreen>
  );
}

// ── 07 ──────────────────────────────────────────────────────────────────────────

function TransactionRow({ hash, label = "Transaction ID" }: { hash: string; label?: string }) {
  return (
    <Row label={label}>
      <span>{truncateHash(hash)}</span>
      <CopyButton value={hash} label="transaction ID" />
    </Row>
  );
}

export function Success({ checkout, controller }: Props) {
  const { transactionHash, paidAt } = controller.state;
  return (
    <StatusScreen
      icon={<Badge tone="success" animated />}
      title="Payment successful"
      message={`Your payment to ${checkout.merchant.name} has been confirmed on Stellar.`}
      actions={
        <>
          {transactionHash ? (
            <ExternalLink href={explorerLink(checkout, transactionHash)} variant="ink">
              View Transaction
            </ExternalLink>
          ) : null}
          <ReturnToMerchant checkout={checkout} variant="outline" />
        </>
      }
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <Panel>
          <Row label="Amount paid">
            {checkout.amount} {checkout.asset}
          </Row>
          <Row label="Asset">{checkout.asset}</Row>
          <Row label="Network">{checkout.network.label}</Row>
          {transactionHash ? <TransactionRow hash={transactionHash} /> : null}
          <Row label="Order reference">{checkout.orderId}</Row>
          {paidAt ? <Row label="Date and time">{formatDateTime(paidAt)}</Row> : null}
          <Row label="Payment ID">{checkout.paymentId}</Row>
        </Panel>
      </motion.div>
    </StatusScreen>
  );
}

// ── 08 – 16 ─────────────────────────────────────────────────────────────────────

const alert = <Badge tone="alert" />;

const OtherMethod = ({ controller }: Pick<Props, "controller">) => (
  <Button variant="outline" onClick={controller.disconnect}>
    Choose another payment method
  </Button>
);

export function InsufficientUsdc({ controller }: Props) {
  const p = controller.state.preflight;
  return (
    <StatusScreen
      icon={alert}
      title="Not enough USDC"
      message="You don't have enough USDC to complete this payment."
      actions={
        <>
          <Button onClick={controller.retry} disabled={controller.state.connecting}>Try again</Button>
          <OtherMethod controller={controller} />
        </>
      }
    >
      {p ? (
        <Note icon={false}>
          Your balance {p.balance} {p.asset}. Needed {p.needed} {p.asset}.
        </Note>
      ) : null}
      <Note>Add USDC to your wallet, then try again.</Note>
    </StatusScreen>
  );
}

export function InsufficientXlm({ controller }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Not enough XLM for the fee"
      message="You need a small amount of XLM to cover the Stellar transaction fee."
      actions={
        <>
          <Button onClick={controller.retry} disabled={controller.state.connecting}>Try again</Button>
          <OtherMethod controller={controller} />
        </>
      }
    >
      <Note>XLM is the fee token used on Stellar.</Note>
    </StatusScreen>
  );
}

export function Failed({ checkout, controller }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Payment failed"
      message="Your payment could not be completed. Please try again."
      actions={
        <>
          <Button onClick={controller.retry} disabled={controller.state.connecting}>Try again</Button>
          <ReturnToMerchant checkout={checkout} variant="outline" />
        </>
      }
    />
  );
}

export function Pending({ checkout, controller }: Props) {
  const { transactionHash } = controller.state;
  return (
    <StatusScreen
      icon={<SpinnerIcon />}
      title="Payment pending"
      message="We're waiting for the Stellar network to confirm your payment."
      actions={
        <>
          <Button onClick={controller.refreshStatus}>Refresh status</Button>
          <ReturnToMerchant checkout={checkout} variant="outline" />
        </>
      }
    >
      {transactionHash ? (
        <Panel>
          <TransactionRow hash={transactionHash} />
        </Panel>
      ) : null}
      <Note>You don&apos;t need to pay again. This page will update when it&apos;s confirmed.</Note>
    </StatusScreen>
  );
}

export function WrongNetwork({ checkout, controller }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Wrong network or asset"
      message="Please make sure you're paying with Stellar USDC."
      actions={
        <>
          <Button onClick={controller.retry} disabled={controller.state.connecting}>Try again</Button>
          <OtherMethod controller={controller} />
        </>
      }
    >
      <Note>
        Switch your wallet to {checkout.network.label} and pay with {checkout.asset}.
      </Note>
    </StatusScreen>
  );
}

export function Expired({ checkout }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Payment expired"
      message="This payment request is no longer active."
      actions={<ReturnToMerchant checkout={checkout} variant="ink" />}
    >
      <Note>Please return to the merchant to start a new payment.</Note>
    </StatusScreen>
  );
}

export function AlreadyPaid({ checkout, controller }: Props) {
  const hash = controller.state.transactionHash;
  return (
    <StatusScreen
      icon={<Badge tone="success" />}
      title="Already paid"
      message="This order has already been paid."
      actions={
        <>
          {hash ? (
            <ExternalLink href={explorerLink(checkout, hash)} variant="ink">
              View Transaction
            </ExternalLink>
          ) : null}
          <ReturnToMerchant checkout={checkout} variant="outline" />
        </>
      }
    >
      <Panel>
        <Row label="Order ID">{checkout.orderId}</Row>
        {hash ? <TransactionRow hash={hash} /> : null}
      </Panel>
    </StatusScreen>
  );
}

export function WalletDisconnected({ controller }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Wallet disconnected"
      message="Your wallet was disconnected. Reconnect to continue."
      actions={
        <>
          <Button onClick={controller.retry} disabled={controller.state.connecting}>Reconnect wallet</Button>
          <Button variant="outline" onClick={controller.disconnect}>Cancel</Button>
        </>
      }
    />
  );
}

export function ConnectionRejected({ controller }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Connection rejected"
      message="You declined the connection request in your wallet."
      actions={
        <>
          <Button onClick={controller.retry} disabled={controller.state.connecting}>Try again</Button>
          <Button variant="outline" onClick={controller.openWallets}>Choose another wallet</Button>
        </>
      }
    />
  );
}

export function WalletNotInstalled({ controller }: Props) {
  return (
    <StatusScreen
      icon={alert}
      title="Freighter not found"
      message="Install Freighter to continue, or choose another wallet."
      actions={
        <>
          <ExternalLink href={FREIGHTER_URL} variant="ink">
            Install Freighter
          </ExternalLink>
          <Button variant="outline" onClick={controller.openWallets}>Choose another wallet</Button>
        </>
      }
    />
  );
}

/**
 * Paying from a wallet app instead of a browser extension, which is the route for phones.
 * The customer sends the payment themselves; Credlink recognises it by the memo and this
 * page moves to success when it has been verified.
 */
export function WalletApp({ checkout, controller }: Props) {
  const copyRow = (label: string, shown: string, value: string) => (
    <Row label={label}>
      <span className="min-w-0 truncate">{shown}</span>
      <CopyButton value={value} label={label.toLowerCase()} />
    </Row>
  );
  return (
    <StatusScreen
      icon={<SpinnerIcon />}
      title="Pay from your wallet app"
      message="Send this exact payment from any Stellar wallet. This page updates when it arrives."
      actions={
        <>
          <a href={walletAppLink(checkout)} className={buttonClass({ variant: "ink" })}>
            Open wallet app
          </a>
          <Button variant="outline" onClick={controller.openWallets}>
            Choose another wallet
          </Button>
        </>
      }
    >
      <Panel>
        {copyRow("Amount", `${checkout.amount} ${checkout.asset}`, checkout.amount)}
        {copyRow("Send to", truncateAddress(checkout.recipientAddress, 6, 6), checkout.recipientAddress)}
        {copyRow("Memo (text)", checkout.paymentId, checkout.paymentId)}
        {copyRow(`${checkout.asset} issuer`, truncateAddress(checkout.assetIssuer, 6, 6), checkout.assetIssuer)}
        <Row label="Network">{checkout.network.label}</Row>
      </Panel>
      <Note>Include the memo exactly as shown. Without it we can&apos;t match your payment to this order.</Note>
      <p className="flex items-center justify-center gap-2 text-sm text-muted" role="status">
        <Spinner className="size-3.5" /> Waiting for your payment…
      </p>
    </StatusScreen>
  );
}

/** The API gives the explorer link for the stored hash; a hash learned later reuses its pattern. */
function explorerLink(checkout: Checkout, hash: string): string {
  if (checkout.explorerUrl && checkout.transactionHash === hash) return checkout.explorerUrl;
  return `https://stellar.expert/explorer/${checkout.network.id}/tx/${hash}`;
}
