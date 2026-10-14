import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to Cedilink Smartpay to create payment links, follow each checkout and verify Stellar USDC payments.",
  path: "/login",
});

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
