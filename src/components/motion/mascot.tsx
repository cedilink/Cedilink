"use client";

import { motion, useReducedMotion } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import browLeft from "@/assets/illustrations/mascot-layers/brow-left.png";
import browRight from "@/assets/illustrations/mascot-layers/brow-right.png";
import eyeLeft from "@/assets/illustrations/mascot-layers/eye-left.png";
import eyeRight from "@/assets/illustrations/mascot-layers/eye-right.png";
import nose from "@/assets/illustrations/mascot-layers/nose.png";
import smile from "@/assets/illustrations/mascot-layers/smile.png";

export type MascotMood = "idle" | "busy" | "happy" | "sad";

// Each layer is a full-canvas transparent PNG, so they stack without offsets.
// `origin` is the centre of the artwork within the canvas, used for scaling in place.
function Layer({
  src,
  origin,
  ...motionProps
}: { src: StaticImageData; origin: string } & React.ComponentProps<
  typeof motion.div
>) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ transformOrigin: origin }}
      {...motionProps}
    >
      <Image src={src} alt="" fill sizes="96px" />
    </motion.div>
  );
}

const spring = { type: "spring", stiffness: 300, damping: 18 } as const;

/** The Cedilink face. It blinks when idle and reacts to how the payment is going. */
export function Mascot({
  mood = "idle",
  size = 40,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  const still = useReducedMotion();

  const blink = still
    ? {}
    : {
        scaleY: [1, 1, 0.1, 1],
        transition: {
          duration: 4.2,
          times: [0, 0.94, 0.97, 1],
          repeat: Infinity,
        },
      };
  const glance = still
    ? {}
    : {
        x: ["0%", "1.5%", "-1.5%", "0%"],
        transition: {
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };
  const eyes = mood === "busy" ? glance : blink;

  const browY = mood === "happy" ? "-3%" : mood === "sad" ? "1.5%" : "0%";
  const smileScale = mood === "happy" ? 1.12 : mood === "sad" ? 0.82 : 1;

  return (
    <motion.div
      aria-hidden
      className="relative shrink-0 overflow-hidden rounded-full bg-cream"
      style={{ width: size, height: size }}
      animate={mood === "happy" && !still ? { y: [0, -5, 0] } : { y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Layer
        src={browLeft}
        origin="38% 27%"
        animate={{ y: browY, rotate: mood === "sad" ? -8 : 0 }}
        transition={spring}
      />
      <Layer
        src={browRight}
        origin="59% 27%"
        animate={{ y: browY, rotate: mood === "sad" ? 8 : 0 }}
        transition={spring}
      />
      <Layer key={`l-${mood}`} src={eyeLeft} origin="35% 43%" animate={eyes} />
      <Layer key={`r-${mood}`} src={eyeRight} origin="64% 43%" animate={eyes} />
      <Layer src={nose} origin="50% 60%" />
      <Layer
        src={smile}
        origin="50% 70%"
        animate={{ scaleX: smileScale }}
        transition={spring}
      />
    </motion.div>
  );
}
