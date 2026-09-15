import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = { title: "Pricing plans" };

export default function Pricing() {
  return (
    <Suspense>
      <PricingPage />
    </Suspense>
  );
}
