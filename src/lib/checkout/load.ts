import { cache } from "react";
import { api, ApiError, type Checkout } from "@/lib/api/client";

/**
 * Loads a checkout on the server, or null when there is no such payment. Shared by the page,
 * its metadata and its link-preview image, which all render for the same request, so the
 * backend is asked once. Always the live state: a checkout must never be served from a cache.
 */
export const loadCheckout = cache(
  async (paymentId: string): Promise<Checkout | null> => {
    try {
      return await api<Checkout>(`/checkout/${encodeURIComponent(paymentId)}`, {
        cache: "no-store",
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      )
        return null;
      throw error;
    }
  },
);

/** How a checkout is described in a browser tab and in a link preview. */
export function describeCheckout(checkout: Checkout) {
  const amount = `${checkout.amount} ${checkout.asset}`;
  const order = `${checkout.productName} · Order ${checkout.orderId}`;
  if (checkout.status === "PAID") {
    return {
      title: `Paid: ${amount} to ${checkout.merchant.name}`,
      description: `${order}. This payment has been verified on ${checkout.network.label}.`,
    };
  }
  if (checkout.status === "EXPIRED") {
    return {
      title: `Expired: ${amount} to ${checkout.merchant.name}`,
      description: `${order}. This payment request is no longer active.`,
    };
  }
  return {
    title: `Pay ${amount} to ${checkout.merchant.name}`,
    description: `${checkout.merchant.name} is requesting ${amount} for ${checkout.productName}. Order ${checkout.orderId}. Pay from your Stellar wallet with Cedilink Smartpay.`,
  };
}
