import type { Metadata } from "next";
import { AuthLayout } from "../../../components/layouts/AuthLayout";
import { ResourceEmbed } from "../../../components/resources/ResourceEmbed";
import AboutPage from "../../about/page";

export const metadata: Metadata = { title: "About | Parola" };

export default function InAppAboutPage() {
  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto w-full">
        <ResourceEmbed>
          <AboutPage />
        </ResourceEmbed>
      </div>
    </AuthLayout>
  );
}
