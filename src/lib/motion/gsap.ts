import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Registered once, on the client. Only the landing page imports this module, so the
// checkout and dashboard do not carry GSAP.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { DESKTOP, MOTION_OK } from "./media";
export { gsap, ScrollTrigger, SplitText, useGSAP };
