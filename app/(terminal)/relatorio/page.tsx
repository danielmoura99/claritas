import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportScreen } from "@/components/terminal/ReportScreen";

export const metadata: Metadata = { title: "Resumo do período · Claritas Terminal" };

export default function ReportPage() {
  return (
    <Suspense>
      <ReportScreen />
    </Suspense>
  );
}
