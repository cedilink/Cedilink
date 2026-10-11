import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { describeCheckout, loadCheckout } from "@/lib/checkout/load";
import { OPEN_GRAPH } from "@/lib/site";

// The tab title and the preview shown when the link is shared name this payment: who is being
// paid, how much and what for. Checkouts stay out of search results all the same.
export async function generateMetadata({ params }: PageProps<"/c/[paymentId]">): Promise<Metadata> {
  const robots = { index: false, follow: false };
  const { paymentId } = await params;
  const checkout = await loadCheckout(paymentId).catch(() => null);
  if (!checkout) return { title: "Checkout", robots };
  const { title, description } = describeCheckout(checkout);
  return {
    title,
    description,
    robots,
    openGraph: { ...OPEN_GRAPH, title, description, url: `/c/${checkout.paymentId}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function CheckoutLoader({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const checkout = await loadCheckout(paymentId);
  if (!checkout) notFound();
  return <CheckoutFlow checkout={checkout} />;
}

function CheckoutSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface" aria-busy="true" aria-label="Loading checkout">
      <div className="h-20" />
      <div className="flex flex-1 items-start justify-center px-4 sm:items-center sm:pb-24">
        <div className="h-[420px] w-full max-w-[400px] animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}

export default function CheckoutPage({ params }: PageProps<"/c/[paymentId]">) {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutLoader params={params} />
    </Suspense>
  );
}
