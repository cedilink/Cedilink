import { CheckoutScene } from "@/components/landing/checkout-scene";
import { LandingMotion } from "@/components/landing/landing-motion";
import { DashboardScene, FaqSection, FinalCta, Footer, Hero, Nav, Statement, Steps, TestnetBand, UseCases, VerifyScene, WalletScene } from "@/components/landing/sections";
import { MOTION_BOOTSTRAP } from "@/lib/motion/media";

export default function Home() {
  return (
    <>
      {/* Must run before first paint; see MOTION_BOOTSTRAP. */}
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOTSTRAP }} />
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
