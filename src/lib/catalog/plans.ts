export interface PlanDef {
  id: "FREE" | "BASIC" | "PRO" | "MAX";
  name: string;
  tagline: string;
  price: number; // monthly, annual billing
  listPrice?: number;
  credits: number;
  perks: { text: string; on: boolean }[];
  bg?: string;
  badge?: string;
}

export const PLANS: PlanDef[] = [
  {
    id: "FREE", name: "Free", tagline: "For trying things", price: 0, credits: 100,
    perks: [
      { text: "100 welcome credits", on: true },
      { text: "All image models", on: true },
      { text: "Video presets", on: true },
      { text: "Parallel generations", on: false },
      { text: "4K output", on: false },
    ],
  },
  {
    id: "BASIC", name: "Basic", tagline: "For first-time AI creators", price: 9, credits: 120, bg: "linear-gradient(160deg,#171717,#0e0e0e)",
    perks: [
      { text: "120 credits / month", on: true },
      { text: "≈ 60 Nano Banana 2 images", on: true },
      { text: "≈ 7 Seedance 2.0 Fast videos", on: true },
      { text: "Parallel generations: 2 videos, 2 images", on: true },
      { text: "Access to selected models & features", on: true },
      { text: "Early access to advanced AI features", on: false },
      { text: "Lowest cost per credit", on: false },
    ],
  },
  {
    id: "PRO", name: "Pro", tagline: "For everyday AI creation", price: 23, listPrice: 29, credits: 600, badge: "21% OFF", bg: "linear-gradient(160deg,#1f2410,#0e0f08)",
    perks: [
      { text: "600 credits / month", on: true },
      { text: "≈ 300 Nano Banana 2 images", on: true },
      { text: "≈ 27 Seedance 2.0 videos", on: true },
      { text: "Unlimited paid parallel generations", on: true },
      { text: "Access to all Seedance models", on: true },
      { text: "Access to all models & features", on: true },
      { text: "Early access to advanced AI features", on: true },
      { text: "Lowest cost per credit", on: false },
    ],
  },
  {
    id: "MAX", name: "Max", tagline: "For ambitious AI projects", price: 59, listPrice: 79, credits: 1800, badge: "25% OFF", bg: "linear-gradient(160deg,#2a0f1e,#120710)",
    perks: [
      { text: "1,800 credits / month", on: true },
      { text: "≈ 900 Nano Banana 2 images", on: true },
      { text: "≈ 80 Seedance 2.0 videos", on: true },
      { text: "Unlimited paid parallel generations", on: true },
      { text: "Access to all models & features", on: true },
      { text: "Early access to advanced AI features", on: true },
      { text: "Lowest cost per credit — 60% cheaper", on: true },
    ],
  },
];

export function getPlan(id: string) {
  return PLANS.find((p) => p.id === id.toUpperCase()) ?? PLANS[0];
}
