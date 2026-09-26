// One theme for the whole reel: Pied's own print-shop identity.
// Two inks, and one hero colour (vermilion, from the press's ink tray).
import { Easing } from "remotion";

export const theme = {
  colors: {
    paper: "#f4f3ee",
    paper2: "#ebe9e2",
    ink: "#0c0c0b",
    ink2: "#3b3a36",
    ink3: "#77756d",
    rule: "rgba(12,12,11,0.14)",
    night: "#0c0c0b",
    hero: "#c8341e",
  },
  fonts: {
    display: "Libre Caslon Display",
    text: "Libre Caslon Text",
    mono: "Courier Prime",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

export const FPS = 30;
