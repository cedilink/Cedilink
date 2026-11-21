import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Reset your password",
    description: "Get a link to choose a new password for your Cedilink Smartpay account.",
    path: "/forgot-password",
  }),
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: LayoutProps<"/forgot-password">) {
  return children;
}
