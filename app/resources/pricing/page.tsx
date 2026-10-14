import type { Metadata } from "next";
import { AuthLayout } from "../../../components/layouts/AuthLayout";
import { ResourceEmbed } from "../../../components/resources/ResourceEmbed";
import PricingPage from "../../pricing/page";

export const metadata: Metadata = { title: "Pricing | Parola" };

export default function InAppPricingPage() {
  return (
    <AuthLayout variant="application">
      <div className="max-w-6xl mx-auto w-full">
        <ResourceEmbed>
          <PricingPage />
        </ResourceEmbed>
      </div>
    </AuthLayout>
  );
}
