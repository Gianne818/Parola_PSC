import type { Metadata } from "next";
import { GuideContent } from "@/components/information/GuideContent";
export const metadata: Metadata = {
  title: "System Guide | Parola",
  description:
    "Nine lessons on account and home-port setup, current advisory controls, sample screens and planned voluntary reporting.",
};
export default function GuidePage() {
  return <GuideContent />;
}
