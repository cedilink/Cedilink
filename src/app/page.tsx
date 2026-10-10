// Placeholder until the landing page is built: confirms fonts, tokens and assets are wired up.
import Image from "next/image";
import mascot from "@/assets/illustrations/mascot.png";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-brand-tint px-6 py-24 text-center">
      <Image src={mascot} alt="" width={72} height={72} className="rounded-full" priority />
      <h1 className="text-display max-w-3xl text-5xl text-ink sm:text-7xl">
        A smarter way to accept USDC.
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Credlink Smartpay: Stellar USDC payments for your business, starting on Testnet.
      </p>
      <span className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white">
        Landing page in progress
      </span>
    </main>
  );
}
