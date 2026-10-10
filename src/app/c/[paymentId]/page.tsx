import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { api, ApiError, type Checkout } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

async function CheckoutLoader({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  let checkout: Checkout;
  try {
    // Always the live state: a checkout must never be served from a cache.
    checkout = await api<Checkout>(`/checkout/${encodeURIComponent(paymentId)}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
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
