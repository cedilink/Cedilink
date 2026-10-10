import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://credlink.cc"),
  title: {
    default: "Credlink Smartpay — Accept USDC on Stellar",
    template: "%s · Credlink Smartpay",
  },
  description:
    "Stellar USDC payments for Ghanaian merchants. One link, a clear checkout, and payments you can verify on-chain. Running on Stellar Testnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
