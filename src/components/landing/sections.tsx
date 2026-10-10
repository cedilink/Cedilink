import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import clouds from "@/assets/photos/hero-clouds.jpg";
import portrait from "@/assets/photos/hero-portrait.jpg";
import consultation from "@/assets/photos/use-case-consultation.jpg";
import designDeposits from "@/assets/photos/use-case-design-deposits.jpg";
import eventTickets from "@/assets/photos/use-case-event-tickets.jpg";
import { Cta } from "./cta";
import { Faq, Magnetic, WalletArt } from "./interactive";
import { DashboardWindow, Phone, SummaryScreen } from "./mocks";

const container = "mx-auto max-w-[1312px] px-4 sm:px-8";
const h2 = "text-display text-[clamp(2.25rem,4.4vw,3.75rem)] text-heading";

const NAV = [
  ["How it works", "#how-it-works"],
  ["For merchants", "#for-merchants"],
  ["FAQs", "#faqs"],
] as const;

export function Nav() {
  return (
    <header data-nav className="group fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter] duration-300 data-[scrolled]:bg-white/80 data-[scrolled]:backdrop-blur-md">
      <div className={`${container} flex h-[72px] items-center justify-between`}>
        <Link href="/" className="text-lg tracking-tight text-ink">
          Credlink Smartpay
        </Link>
        <nav className="flex items-center gap-8" aria-label="Main">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="hidden text-sm text-brand underline-offset-4 hover:underline md:block">
              {label}
            </a>
          ))}
          <Cta className="h-11" />
        </nav>
      </div>
    </header>
  );
}

const AVATARS = [
  { src: portrait, position: "50% 12%" },
  { src: consultation, position: "30% 30%" },
  { src: consultation, position: "78% 28%" },
];

export function Hero() {
  return (
    <section data-hero-root className="px-4 pt-[88px]">
      <div data-hero className="mx-auto grid max-w-[1408px] gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div data-hero-panel className="flex min-h-[560px] flex-col justify-between rounded-[20px] bg-brand-tint p-6 sm:p-8 lg:min-h-[760px]">
          <p data-hero-item className="flex items-center gap-3 text-xs leading-tight text-brand">
            <Globe className="size-5" strokeWidth={1.5} />
            <span>
              Built for Ghanaian merchants.
              <br />
              Exploring payments on Stellar.
            </span>
          </p>
          <div>
            <h1 data-hero-title className="text-display text-[clamp(2.5rem,4.6vw,4rem)] text-ink">
              A smarter way to accept USDC. One link. A clear checkout. Payments you can verify.
            </h1>
            <p data-hero-item className="mt-6 max-w-md text-sm text-ink">
              Meet Credlink Smartpay: Stellar USDC payments for your business, starting on Testnet.
            </p>
            <div data-hero-item className="mt-8 flex flex-wrap items-center gap-5">
              <Cta />
              <div className="flex items-center" aria-hidden>
                {AVATARS.map((avatar, index) => (
                  <span key={index} data-hero-avatar className="-ml-3 size-11 overflow-hidden rounded-full ring-2 ring-brand-tint first:ml-0">
                    <Image src={avatar.src} alt="" width={88} height={88} className="size-full object-cover" style={{ objectPosition: avatar.position }} />
                  </span>
                ))}
                <span data-hero-avatar className="-ml-3 grid size-11 place-items-center rounded-full bg-white text-lg text-muted ring-2 ring-brand-tint">
                  +
                </span>
              </div>
            </div>
          </div>
        </div>

        <div data-hero-panel className="relative min-h-[520px] overflow-hidden rounded-[20px] bg-[#1d4a5c] lg:min-h-[760px]">
          {/* Three nested layers so scroll parallax, ambient drift and the opening zoom never fight over one transform. */}
          <div data-hero-sky className="absolute -inset-y-[12%] inset-x-0">
            <div data-hero-drift className="absolute inset-y-0 -inset-x-[6%]">
              <Image data-hero-image src={clouds} alt="" fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            </div>
          </div>
          <div data-hero-phone-wrap className="absolute inset-x-0 top-[12%] flex justify-center">
            <div data-hero-phone className="origin-top scale-[0.92] sm:scale-100 lg:scale-[1.15]">
              <Phone title="Smartpay">
                <SummaryScreen count />
              </Phone>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Statement() {
  return (
    <section className={`${container} grid gap-8 py-24 lg:grid-cols-2 lg:py-36`}>
      <h2 data-split className={h2}>
        Your business.
        <br />A new way to be paid.
      </h2>
      <p data-words className="max-w-xl text-xl leading-snug text-ink lg:justify-self-end lg:text-2xl">
        Credlink helps Ghanaian merchants accept crypto payments. Smartpay adds USDC on Stellar, with a checkout link your customer can open and pay from their wallet.
      </p>
    </section>
  );
}

const STEPS = [
  ["01", "Create a payment", "Set your receiving wallet and enable Stellar USDC. Add your product or service, USDC amount and order reference."],
  ["02", "Share your link", "Generate a Smartpay checkout link and send it to your customer. The order details travel with it."],
  ["03", "Let your customer pay", "Your customer reviews the checkout, connects a Stellar wallet and approves the payment in their wallet."],
] as const;

export function Steps() {
  return (
    <section id="for-merchants" className={`${container} grid gap-4 pb-24 md:grid-cols-3`}>
      {STEPS.map(([number, title, text]) => (
        <article key={number} data-fade className="rounded-2xl bg-surface p-7">
          <p className="text-3xl tracking-tight text-brand">{number}</p>
          <h3 className="mt-5 text-2xl tracking-tight text-brand">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
        </article>
      ))}
    </section>
  );
}

export function DashboardScene() {
  return (
    <section className="overflow-hidden bg-white pt-24 lg:pt-36">
      <div className={`${container} grid gap-8 lg:grid-cols-2`}>
        <h2 data-split className={h2}>
          Know where every
          <br />
          payment stands.
        </h2>
        <div className="lg:justify-self-end">
          <p data-fade className="max-w-xl text-lg text-muted">
            Keep the checkout link, order reference and payment status together. Open a payment to inspect its details and the transaction behind it.
          </p>
          <div data-fade className="mt-6">
            <Cta />
          </div>
        </div>
      </div>
      <div className={`${container} mt-14`}>
        <div className="rounded-t-[28px] bg-brand-tint px-4 pt-6 sm:px-8 sm:pt-10">
          <div data-dashboard-frame>
            <DashboardWindow />
          </div>
        </div>
      </div>
    </section>
  );
}

const CHECKS = ["Transaction exists", "Transaction successful", "Destination matches", "Asset matches", "Amount matches", "Payment reference matches"];

export function VerifyScene() {
  return (
    <section className={`${container} grid items-center gap-12 py-24 lg:grid-cols-2 lg:py-36`}>
      <div>
        <h2 data-split className={h2}>
          The details match.
          <br />
          The proof is on-chain.
        </h2>
        <p data-fade className="mt-5 max-w-xl text-lg text-muted">
          Smartpay checks the Stellar transaction against the payment request: destination, asset, amount and payment reference. You can inspect the transaction on the Stellar explorer.
        </p>
        <div data-fade className="mt-6">
          <Cta />
        </div>
      </div>
      <div data-fade className="rounded-[28px] bg-brand-tint p-4 sm:p-8">
        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-base text-ink">Verification</p>
            <span data-verify-result className="rounded-full bg-paid-tint px-3 py-1.5 text-xs font-medium text-paid">
              Paid · SP-00124
            </span>
          </div>
          <ul className="mt-2">
            {CHECKS.map((label) => (
              <li key={label} data-verify-row className="flex items-center gap-3 border-b border-line py-4 text-sm text-ink last:border-0">
                <svg viewBox="0 0 24 24" className="size-5 text-paid" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle data-draw cx="12" cy="12" r="9" pathLength={1} strokeDasharray={1} />
                  <path data-draw d="m8.5 12.2 2.4 2.4 4.6-4.9" pathLength={1} strokeDasharray={1} />
                </svg>
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 truncate rounded-full bg-surface px-4 py-2.5 text-center font-mono text-xs text-muted">9c8a2f71e4d0…b04d6e92</p>
        </div>
      </div>
    </section>
  );
}

export function WalletScene() {
  return (
    <section className={`${container} grid items-center gap-12 pb-24 lg:grid-cols-2 lg:pb-36`}>
      <div data-fade className="rounded-[28px] bg-brand-tint p-8 sm:p-12 lg:order-first">
        <WalletArt />
      </div>
      <div>
        <h2 data-split className={h2}>
          A wallet. Some USDC.
          <br />A little XLM.
        </h2>
        <p data-fade className="mt-5 max-w-xl text-lg text-muted">
          A wallet holds your crypto and lets you approve payments. Freighter is enabled for the demo; Albedo and other wallet options are coming soon.
        </p>
        <div data-fade className="mt-6">
          <Cta />
        </div>
      </div>
    </section>
  );
}

const CASES = [
  { image: eventTickets, alt: "Attendees seated at a conference session", title: "Event tickets", text: "Create a request for a conference ticket, then share the checkout link with your attendee." },
  { image: designDeposits, alt: "A designer arranging colour swatches beside a laptop", title: "Design deposits", text: "Request a USDC deposit for a design project, with an order reference that keeps the brief and payment connected." },
  { image: consultation, alt: "Two people in conversation over a laptop", title: "Consultation payments", text: "Send a payment request for a consultation and follow its status before marking the order as paid." },
];

export function UseCases() {
  return (
    <section className={`${container} pb-24 lg:pb-36`}>
      <h2 data-split className={h2}>
        Real business needs.
        <br />
        One payment-link workflow.
      </h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {CASES.map((item) => (
          <article key={item.title} className="group overflow-hidden rounded-2xl bg-surface">
            <div data-clip className="relative aspect-[16/10] overflow-hidden">
              <div data-clip-inner className="absolute inset-0">
                <div data-parallax="0.07" className="absolute -inset-y-[9%] inset-x-0">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                  />
                </div>
              </div>
            </div>
            <div data-fade className="p-6">
              <h3 className="text-xl tracking-tight text-brand">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TestnetBand() {
  return (
    <section className={container}>
      <div data-band className="grid gap-8 rounded-[20px] bg-surface px-6 py-14 sm:px-12 lg:grid-cols-2 lg:py-20">
        <h2 data-split className={h2}>
          Try the flow.
          <br />
          Not real money.
        </h2>
        <div>
          <p data-fade className="max-w-xl text-lg text-muted">
            Smartpay currently runs on Stellar Testnet, a practice network for testing transactions. The demo uses test USDC and test XLM, not real funds.
          </p>
          <div data-fade className="mt-6">
            <Cta />
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { question: "Can I accept real payments today?", answer: "No. The Smartpay MVP runs on Stellar Testnet. All payments in the demo use test assets; no real money is used." },
  { question: "Does my customer need a Credlink account?", answer: "No. Shoppers open the checkout link and connect a Stellar wallet. There is no customer login or account to create." },
  { question: "What does a merchant need to get started?", answer: "Set a receiving wallet and enable Stellar USDC. Then create a payment with a product or service, USDC amount and order reference. Customer name and email are optional." },
  { question: "Which wallet can I use for the demo?", answer: "Freighter is enabled. Albedo and other supported wallets are coming soon. Make sure your wallet is on Stellar Testnet and contains test USDC and enough test XLM." },
  { question: "Why do I need XLM as well as USDC?", answer: "USDC is the payment asset. XLM covers a small fee paid to the Stellar network. The example estimate is about 0.00001 XLM; check the fee in your wallet before approving." },
];

export function FaqSection() {
  return (
    <section id="faqs" className={`${container} grid gap-10 py-24 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:py-36`}>
      <div>
        <h2 data-split className={h2}>
          Clear answers
          <br />
          to FAQs
        </h2>
        <p data-fade className="mt-5 max-w-xs text-base text-muted">
          The essentials before you try your first Testnet checkout.
        </p>
      </div>
      <Faq items={FAQS} />
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4">
      <div className="mx-auto grid max-w-[1408px] items-center gap-10 rounded-[20px] bg-brand-wash px-6 py-16 sm:px-16 lg:grid-cols-[1fr_auto] lg:py-24">
        <div>
          <h2 data-split className="text-display text-[clamp(2.5rem,5vw,4.25rem)] text-brand">
            Your next payment
            <br />
            starts with a link.
          </h2>
          <p data-fade className="mt-6 text-base text-brand">
            Explore Credlink Smartpay, from creating a request to verifying a payment.
          </p>
        </div>
        <div data-fade>
          <Magnetic>
            <Cta />
          </Magnetic>
          <p className="mt-4 text-xs text-brand">Stellar Testnet only. No real money is used.</p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className={`${container} pb-10 pt-14`}>
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-line pb-8">
        <p className="text-lg tracking-tight text-brand">Credlink Smartpay</p>
        <nav className="flex flex-wrap gap-x-8 gap-y-2" aria-label="Footer">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="text-sm text-brand underline-offset-4 hover:underline">
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap justify-between gap-2 pt-6 text-xs text-muted">
        <p>© 2026 Credlink Smartpay</p>
        <p>Built for Ghanaian merchants · MVP on Stellar Testnet</p>
      </div>
    </footer>
  );
}
