import type { Metadata } from "next";
import { LegalScreen } from "@/components/commercial/LegalScreen";
import { TERMS } from "@/components/commercial/legal-content";

export const metadata: Metadata = { title: "Termos de Uso · Claritas Terminal" };

export default function Page() {
  return <LegalScreen doc={TERMS} />;
}
