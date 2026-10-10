import type { Checkout } from "@/lib/api/client";

/**
 * A SEP-7 payment link (`web+stellar:pay?...`). Wallet apps that support the standard open
 * with the destination, amount, asset and memo already filled in. The memo is the payment
 * ID, which is how Credlink matches the incoming transfer to this checkout.
 */
export function walletAppLink(checkout: Pick<Checkout, "recipientAddress" | "amount" | "asset" | "assetIssuer" | "paymentId" | "network">): string {
  const params = new URLSearchParams({
    destination: checkout.recipientAddress,
    amount: checkout.amount,
    asset_code: checkout.asset,
    asset_issuer: checkout.assetIssuer,
    memo: checkout.paymentId,
    memo_type: "MEMO_TEXT",
    network_passphrase: checkout.network.passphrase,
  });
  // URLSearchParams writes spaces as "+", which some wallets read literally.
  return `web+stellar:pay?${params.toString().replace(/\+/g, "%20")}`;
}
