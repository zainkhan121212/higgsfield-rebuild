// One-off credit packs (top-ups) alongside the subscription plans.
export interface Pack {
  id: string;
  name: string;
  credits: number;
  price: number;
  perk?: string;
}

export const PACKS: Pack[] = [
  { id: "starter", name: "Starter pack", credits: 100, price: 5 },
  { id: "creator", name: "Creator pack", credits: 500, price: 20, perk: "20% cheaper per credit" },
  { id: "studio", name: "Studio pack", credits: 1500, price: 50, perk: "33% cheaper per credit" },
];

export function getPack(id: string) {
  return PACKS.find((p) => p.id === id);
}
