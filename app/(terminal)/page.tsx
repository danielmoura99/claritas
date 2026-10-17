import type { Metadata } from "next";
import { Suspense } from "react";
import { FeatureGate } from "@/components/commercial/FeatureGate";
import { LiveDeskScreen } from "@/components/terminal/LiveDeskScreen";

export const metadata: Metadata = { title: "Pregão ao vivo · Claritas Terminal" };

export default function LiveDeskPage() {
  return (
    <Suspense>
      <FeatureGate feature="terminal.access">
        <LiveDeskScreen />
      </FeatureGate>
    </Suspense>
  );
}
