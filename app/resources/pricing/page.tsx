import { AuthLayout } from "../../../components/layouts/AuthLayout";
import { ResourceEmbed } from "../../../components/resources/ResourceEmbed";
import PricingPage from "../../pricing/page";

export default function InAppPricingPage() {
  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto w-full">
        <ResourceEmbed>
          <PricingPage />
        </ResourceEmbed>
      </div>
    </AuthLayout>
  );
}
