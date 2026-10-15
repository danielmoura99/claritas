import type { Metadata } from "next";
import { UnavailablePanel } from "@/components/terminal/Unavailable";

export const metadata: Metadata = { title: "Scanner · Claritas Terminal" };

export default function ScannerPage() {
  return <div className="flex-1"><UnavailablePanel eyebrow="Scanner" title="Em construção" reason="O scanner com dados reais da Binance Spot está em implementação." /></div>;
}
