import type { Metadata } from "next";
import { Suspense } from "react";
import { FeatureGate } from "@/components/commercial/FeatureGate";
import { ScannerScreen } from "@/components/terminal/ScannerScreen";

export const metadata: Metadata = { title: "Scanner · Claritas Terminal" };

export default function ScannerPage() {
  return (
    <Suspense>
      <FeatureGate feature="scanner.access">
        <ScannerScreen />
      </FeatureGate>
    </Suspense>
  );
}
