import type { Metadata } from "next";
import { PricingContent } from "@/components/information/PricingContent";
export const metadata: Metadata = {
  title: "Pricing | Parola",
  description:
    "Free Standard municipal access, proposed commercial pricing, sample exports and planned fleet capabilities.",
};
export default function PricingPage() {
  return <PricingContent />;
}
