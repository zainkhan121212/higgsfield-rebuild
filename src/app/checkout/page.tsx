import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "@/components/checkout/checkout-page";

export const metadata: Metadata = { title: "Checkout" };
export default function Checkout() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}
