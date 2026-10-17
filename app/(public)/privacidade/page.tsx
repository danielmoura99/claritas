import type { Metadata } from "next";
import { LegalScreen } from "@/components/commercial/LegalScreen";
import { PRIVACY } from "@/components/commercial/legal-content";

export const metadata: Metadata = { title: "Política de Privacidade · Claritas Terminal" };

export default function Page() {
  return <LegalScreen doc={PRIVACY} />;
}
