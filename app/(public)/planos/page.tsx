import type { Metadata } from "next";
import { PricingScreen } from "@/components/commercial/PricingScreen";

export const metadata: Metadata = { title: "Planos · Claritas Terminal" };

export default function PricingPage() {
  return <PricingScreen />;
}
