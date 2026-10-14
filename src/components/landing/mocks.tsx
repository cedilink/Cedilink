// Product screens drawn as real markup for the landing page. They reuse the checkout's
// own building blocks, so the marketing imagery cannot drift from the product, and each
// part can be animated on its own.
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  Globe,
  LayoutGrid,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  SquareArrowOutUpRight,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import bitcoin from "@/assets/illustrations/bitcoin.png";
import mascot from "@/assets/illustrations/mascot.png";
import stellarLogo from "@/assets/illustrations/stellar-logo.png";
import walletCards from "@/assets/illustrations/wallet-cards.png";
import { Note, Panel, Row } from "../checkout/parts";
import { Badge, Spinner } from "../motion/badge";

const Face = ({ size = 32 }: { size?: number }) => (
  <Image
    src={mascot}
    alt=""
    width={size}
    height={size}
    className="rounded-full"
  />
);

/** Phone body with a status bar. Children are the screen content. */
export function Phone({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-[320px] overflow-hidden rounded-[36px] bg-surface shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/5 ${className}`}
      aria-hidden
    >
      <div className="flex items-center justify-between px-7 pb-2 pt-4 text-[13px] font-semibold text-ink">
        <span>05:31</span>
        <span className="flex items-center gap-1">
          <span className="flex items-end gap-[2px]">
            {[4, 6, 8, 10].map((h) => (
              <i
                key={h}
                className="w-[3px] rounded-sm bg-ink"
                style={{ height: h }}
              />
            ))}
          </span>
          <i className="ml-1 h-[10px] w-[22px] rounded-[3px] bg-ink" />
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-white">
          <ArrowLeft className="size-4" />
        </span>
        <span className="text-sm text-ink">{title}</span>
      </div>
      <div className="px-3 pb-4">{children}</div>
    </div>
  );
}

const Amount = ({
  label,
  value = "$25.00",
  count = false,
}: {
  label: string;
  value?: string;
  count?: boolean;
}) => (
  <div className="pb-5 pt-4 text-center">
    <p className="text-xs text-muted">{label}</p>
    <p
      className="mt-1 text-[40px] font-medium leading-none tracking-[-0.04em] text-ink"
      {...(count
        ? { "data-count": "25", "data-decimals": "2", "data-prefix": "$" }
        : {})}
    >
      {value}
    </p>
  </div>
);

const InkButton = ({ children }: { children: ReactNode }) => (
  <div className="grid h-11 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
    {children}
  </div>
);

export function SummaryScreen({ count = false }: { count?: boolean }) {
  return (
    <div className="rounded-3xl bg-white p-3">
      <div className="flex items-center gap-2.5 px-1 pt-1 text-sm text-ink">
        <Face /> Ghana Web3 Conference
      </div>
      <Amount label="Amount due" count={count} />
      <Panel>
        <Row label="Product or service">Ghana Web3 Conference Ticket</Row>
        <Row label="USDC amount">25.00 USDC</Row>
        <Row label="Network">Stellar Testnet</Row>
        <Row label="Order ID">CD-2026-00124</Row>
      </Panel>
      <div className="mt-3">
        <InkButton>Connect Stellar Wallet</InkButton>
      </div>
    </div>
  );
}

export function WalletScreen() {
  const option = "flex items-center gap-3 rounded-2xl bg-white p-3";
  return (
    <div className="rounded-3xl bg-surface p-1">
      <p className="px-2 pb-3 pt-2 text-base tracking-tight text-ink">
        Connect your Stellar wallet
      </p>
      <div className="flex flex-col gap-2">
        <div className={`${option} ring-2 ring-brand`}>
          <span className="grid size-9 place-items-center rounded-full bg-surface">
            <Puzzle className="size-4" />
          </span>
          <span className="flex-1 text-sm text-ink">
            Freighter
            <span className="block text-xs text-muted">Browser extension</span>
          </span>
          <ChevronRight className="size-4" />
        </div>
        <div className={option}>
          <span className="grid size-9 place-items-center rounded-full bg-surface text-subtle">
            <Globe className="size-4" />
          </span>
          <span className="flex-1 text-sm text-muted">
            Albedo
            <span className="block text-xs">Web wallet · Coming soon</span>
          </span>
        </div>
        <div className="[&>p]:bg-white">
          <Note>
            Make sure your wallet contains enough Stellar USDC and XLM.
          </Note>
        </div>
      </div>
    </div>
  );
}

export function ReviewScreen() {
  return (
    <div className="rounded-3xl bg-white p-3">
      <Amount label="Payment amount" />
      <Panel>
        <Row label="Wallet">GBXK…7QLM</Row>
        <Row label="Available balance">120.50 USDC</Row>
        <Row label="Recipient">Ghana Web3 Conference</Row>
        <Row label="Network fee">About 0.00001 XLM</Row>
      </Panel>
      <div className="mt-3">
        <InkButton>Pay $25 USDC</InkButton>
      </div>
    </div>
  );
}

export function ProcessingScreen() {
  const step = (label: string, done: boolean) => (
    <li className="flex items-center gap-3">
      <span
        className={`grid size-7 place-items-center rounded-full ${done ? "bg-ink text-white" : "bg-white text-ink"}`}
      >
        {done ? (
          <Check className="size-3.5" strokeWidth={2.5} />
        ) : (
          <Spinner className="size-3.5" />
        )}
      </span>
      <span className="text-sm text-ink">
        {label}
        <span className="block text-xs text-muted">
          {done ? "Done" : "In progress"}
        </span>
      </span>
    </li>
  );
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-3 pt-6">
      <div className="mx-auto grid size-[72px] place-items-center rounded-full bg-surface text-ink">
        <Spinner />
      </div>
      <p className="text-center text-xl tracking-tight text-ink">
        Processing payment…
      </p>
      <Note>25.00 USDC to Ghana Web3 Conference</Note>
      <ol className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
        {step("Payment initiated", true)}
        {step("Transaction submitted", true)}
        {step("Confirming on Stellar", false)}
      </ol>
    </div>
  );
}

export function SuccessScreen() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-3 pt-6">
      <div className="mx-auto">
        <Badge tone="success" animated />
      </div>
      <div className="text-center">
        <p className="text-xl tracking-tight text-ink">Payment successful</p>
        <p className="mt-1 text-xs text-muted">Confirmed on Stellar.</p>
      </div>
      <Panel>
        <Row label="Amount paid">25.00 USDC</Row>
        <Row label="Transaction ID">9f3c…a81e</Row>
        <Row label="Order reference">CD-2026-00124</Row>
      </Panel>
      <InkButton>View Transaction</InkButton>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────────

function Stat({
  icon,
  tone,
  label,
  children,
  note,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  children: ReactNode;
  note: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="flex items-center gap-2 text-xs text-ink">
        <span className={`grid size-6 place-items-center rounded-md ${tone}`}>
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-3 flex items-baseline gap-2 text-2xl tracking-tight text-ink lg:text-[28px]">
        {children}
      </p>
      <p className="mt-2 truncate text-xs text-muted">{note}</p>
    </div>
  );
}

function Method({
  art,
  name,
  sub,
  amount,
  foot,
}: {
  art: typeof stellarLogo;
  name: string;
  sub: string;
  amount: number;
  foot: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 p-4">
        <Image
          src={art}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-lg object-contain"
        />
        <p className="text-sm text-ink">
          {name}
          <span className="block text-xs text-muted">{sub}</span>
        </p>
      </div>
      <div className="px-4 pb-4">
        <p className="text-xs text-muted">Received this month</p>
        <p
          className="mt-1 text-[28px] leading-tight tracking-tight text-ink"
          data-count={amount}
          data-decimals="2"
          data-prefix="$"
        >
          ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="flex h-11 items-center justify-between border-t border-line px-4 text-xs text-muted">
        {foot}
        <span className="inline-flex items-center gap-2 text-sm text-brand">
          Manage <ArrowRight className="size-4" />
        </span>
      </div>
    </div>
  );
}

export function MethodCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Method
        art={stellarLogo}
        name="Stellar USDC"
        sub="Receiving wallet GDOR…ZYFQ"
        amount={2850}
        foot="Testnet"
      />
      <Method
        art={walletCards}
        name="Card"
        sub="Card payments"
        amount={1120}
        foot="Settles in 2 days"
      />
      <Method
        art={bitcoin}
        name="Crypto"
        sub="Other networks"
        amount={640}
        foot="3 networks enabled"
      />
    </div>
  );
}

/** The merchant overview inside a browser window. */
export function DashboardWindow() {
  const nav = (
    icon: ReactNode,
    label: string,
    active = false,
    badge?: string,
  ) => (
    <span
      className={`flex h-10 items-center gap-2.5 rounded-full px-3 text-sm text-ink ${active ? "bg-surface" : ""}`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-line px-1.5 text-[11px]">
          {badge}
        </span>
      ) : null}
    </span>
  );
  return (
    <div
      className="overflow-hidden rounded-t-2xl bg-white shadow-[0_40px_100px_-40px_rgba(35,48,190,0.45)] ring-1 ring-black/5"
      aria-hidden
    >
      <div className="flex h-11 items-center gap-2 border-b border-line px-4">
        <i className="size-3 rounded-full bg-[#ff5f57]" />
        <i className="size-3 rounded-full bg-[#febc2e]" />
        <i className="size-3 rounded-full bg-[#28c840]" />
        <span className="mx-auto h-6 w-1/2 max-w-md rounded-md bg-surface text-center text-xs leading-6 text-muted">
          cedilink.com
        </span>
      </div>
      <div className="flex">
        <div className="hidden w-56 shrink-0 flex-col gap-1 p-4 lg:flex">
          <span className="mb-3 flex items-center gap-2.5 px-1 text-sm leading-tight text-ink">
            <Face size={36} />
            Cedilink
            <br />
            Smartpay
          </span>
          <span className="mb-3 flex h-10 items-center gap-2.5 rounded-full bg-surface px-3.5 text-sm text-ink/70">
            <Search className="size-4" /> Search..
          </span>
          {nav(<LayoutGrid className="size-4" />, "Overview", true)}
          {nav(<CreditCard className="size-4" />, "Payments", false, "12")}
          {nav(<SquareArrowOutUpRight className="size-4" />, "Checkouts")}
          {nav(<Wallet className="size-4" />, "Stellar USDC")}
        </div>
        <div className="min-w-0 flex-1 bg-surface p-4 lg:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-xl tracking-tight text-ink lg:text-2xl">
              Overview
            </p>
            <div className="flex gap-2">
              <span className="hidden h-10 items-center gap-2 rounded-full bg-white px-4 text-sm text-ink sm:inline-flex">
                <RefreshCw className="size-4" /> Refresh
              </span>
              <span className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm text-white">
                <Plus className="size-4" /> Create payment
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat
              icon={<Wallet className="size-3.5" />}
              tone="bg-paid-tint text-paid"
              label="Total Received"
              note="+8.4% vs last month"
            >
              <span data-count="2850" data-decimals="2" data-prefix="$">
                $2,850.00
              </span>
            </Stat>
            <Stat
              icon={<Clock className="size-3.5" />}
              tone="bg-awaiting-tint text-awaiting"
              label="Awaiting Payment"
              note="12 open checkouts"
            >
              <span data-count="1400" data-decimals="2" data-prefix="$">
                $1,400.00
              </span>
            </Stat>
            <Stat
              icon={<CircleCheck className="size-3.5" />}
              tone="bg-confirming-tint text-confirming"
              label="Paid This Month"
              note="Payments verified on Stellar"
            >
              <span data-count="24">24</span>
            </Stat>
            <Stat
              icon={<CircleAlert className="size-3.5" />}
              tone="bg-failed-tint text-failed"
              label="Needs Attention"
              note="Failed or expired payments"
            >
              <span data-count="3">3</span>
            </Stat>
          </div>
          <div className="mb-3 mt-6 flex items-center justify-between">
            <p className="text-lg tracking-tight text-ink">Payment methods</p>
            <span className="rounded-full bg-paid-tint px-3 py-1.5 text-xs text-paid">
              Stellar Testnet connected
            </span>
          </div>
          <MethodCards />
        </div>
      </div>
    </div>
  );
}
