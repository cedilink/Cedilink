import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadCheckout } from "@/lib/checkout/load";

// The picture shown when a checkout link is shared (WhatsApp, X, iMessage, …): the merchant,
// what is being paid for and how much, drawn for each payment.
export const alt = "Credlink Smartpay payment request";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (weight: 500 | 600) => readFile(join(process.cwd(), `src/assets/fonts/Manrope-${weight}.ttf`));
// Long names are cut so the layout holds.
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export default async function Image({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const [checkout, medium, semibold] = await Promise.all([loadCheckout(paymentId).catch(() => null), font(500), font(600)]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#e8eaf8", color: "#242424", fontFamily: "Manrope" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: "#2330be" }}>Credlink Smartpay</div>
        {checkout ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, color: "#2330be" }}>{clip(checkout.merchant.name, 48)} is requesting</div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 124, lineHeight: 1, letterSpacing: "-0.045em" }}>
              {checkout.amount} {checkout.asset}
            </div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 40, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{clip(checkout.productName, 80)}</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1, letterSpacing: "-0.045em" }}>Payment request</div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#2330be" }}>
          <div style={{ display: "flex" }}>{checkout ? `Order ${checkout.orderId}` : "credlink.cc"}</div>
          <div style={{ display: "flex" }}>{checkout ? checkout.network.label : "Stellar USDC"}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: medium, style: "normal", weight: 500 },
        { name: "Manrope", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}
