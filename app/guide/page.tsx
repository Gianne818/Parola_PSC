import type { Metadata } from "next";
import { GuideContent } from "@/components/information/GuideContent";
export const metadata: Metadata = {
  title: "System Guide | Parola",
  description:
    "Nine practical lessons for using Parola: vessel registration, SMS advisories, fish hotspots, and safety alerts.",
};
export default function GuidePage() {
  return <GuideContent />;
}
