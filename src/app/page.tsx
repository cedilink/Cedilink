import type { Metadata } from "next";
import { CheckoutScene } from "@/components/landing/checkout-scene";
import { LandingMotion } from "@/components/landing/landing-motion";
import { DashboardScene, FAQS, FaqSection, FinalCta, Footer, Hero, Nav, Statement, Steps, TestnetBand, UseCases, VerifyScene, WalletScene } from "@/components/landing/sections";
import { LandingJsonLd } from "@/components/seo/json-ld";
import { MOTION_BOOTSTRAP } from "@/lib/motion/media";
import { OPEN_GRAPH, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

// The title and description are the site defaults from the root layout.
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { ...OPEN_GRAPH, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" } };

export default function Home() {
  return (
    <>
      {/* Must run before first paint; see MOTION_BOOTSTRAP. */}
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOTSTRAP }} />
      <LandingJsonLd faqs={FAQS} />
      <LandingMotion>
        <Nav />
        <main>
          <Hero />
          <Statement />
          <Steps />
          <CheckoutScene />
          <DashboardScene />
          <VerifyScene />
          <WalletScene />
          <UseCases />
          <TestnetBand />
          <FaqSection />
          <FinalCta />
        </main>
        <Footer />
      </LandingMotion>
    </>
  );
}
