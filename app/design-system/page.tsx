import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Claritas — Design system",
  description: "Biblioteca completa do design system Claritas: tokens, componentes, estados e temas.",
};

export default function DesignSystemPage() {
  return <Showcase />;
}
