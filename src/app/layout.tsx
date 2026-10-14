import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import {
  OPEN_GRAPH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR,
} from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

// Set these to the codes each search console gives you; leave unset to emit nothing.
const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
    ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
    : undefined,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "finance",
  keywords: [
    "Cedilink",
    "Cedilink Smartpay",
    "USDC payments",
    "Stellar USDC",
    "accept USDC",
    "crypto payments Ghana",
    "stablecoin checkout",
    "payment links",
    "Stellar payments for merchants",
  ],
  authors: [{ name: "Cedilink", url: SITE_URL }],
  creator: "Cedilink",
  publisher: "Cedilink",
  // Stops phones turning payment IDs and amounts into phone links.
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    ...OPEN_GRAPH,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: { capable: true, title: "Smartpay", statusBarStyle: "default" },
  verification,
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}
