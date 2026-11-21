import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Cedilink Smartpay account.",
  robots: { index: false, follow: false },
  // The address carries a one-time token; never pass it on to another site.
  referrer: "no-referrer",
};

export default function ResetPasswordLayout({ children }: LayoutProps<"/reset-password">) {
  return children;
}
