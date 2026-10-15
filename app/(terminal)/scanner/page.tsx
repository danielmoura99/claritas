import type { Metadata } from "next";
import { Suspense } from "react";
import { ScannerScreen } from "@/components/terminal/ScannerScreen";

export const metadata: Metadata = { title: "Scanner · Claritas Terminal" };

export default function ScannerPage() {
  return (
    <Suspense>
      <ScannerScreen />
    </Suspense>
  );
}
