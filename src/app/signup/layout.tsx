import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Create a merchant account",
  description: "Open a Credlink Smartpay merchant account and accept USDC on Stellar with a checkout link. Use your own wallet or have one created for you. Stellar Testnet only.",
  path: "/signup",
});

export default function SignupLayout({ children }: LayoutProps<"/signup">) {
  return children;
}
