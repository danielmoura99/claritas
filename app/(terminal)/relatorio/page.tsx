import type { Metadata } from "next";
import { UnavailablePanel } from "@/components/terminal/Unavailable";

export const metadata: Metadata = { title: "Resumo do período · Claritas Terminal" };

export default function ReportPage() {
  return <div className="flex-1"><UnavailablePanel eyebrow="Resumo do período" title="Em construção" reason="O resumo com janela explícita sobre dados reais está em implementação." /></div>;
}
