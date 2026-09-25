import { AuthLayout } from "../../../components/layouts/AuthLayout";
import { ResourceEmbed } from "../../../components/resources/ResourceEmbed";
import GuidePage from "../../guide/page";

export default function InAppGuidePage() {
  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto w-full">
        <ResourceEmbed>
          <GuidePage />
        </ResourceEmbed>
      </div>
    </AuthLayout>
  );
}
