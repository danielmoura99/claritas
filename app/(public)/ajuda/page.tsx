import type { Metadata } from "next";
import { HelpScreen } from "@/components/commercial/HelpScreen";

export const metadata: Metadata = { title: "Ajuda · Claritas Terminal" };

export default function HelpPage() {
  return <HelpScreen />;
}
