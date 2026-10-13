import type { Metadata } from "next";
import { PricingContent } from "@/components/information/PricingContent";
export const metadata: Metadata = {
  title: "Pricing | Parola",
  description:
    "Municipal free access and commercial vessel subscriptions, with coverage, daily download quotas, and fleet agreements.",
};
export default function PricingPage() {
  return <PricingContent />;
}
