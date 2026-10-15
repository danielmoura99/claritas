import type { Metadata } from "next";
import { TerminalApp } from "@/design-system";

export const metadata: Metadata = {
  title: "Claritas Terminal — template",
  description: "Template de composição: Pregão ao vivo, Scanner e Relatório de fechamento.",
};

export default function TerminalTemplatePage() {
  return <TerminalApp />;
}
