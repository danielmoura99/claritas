import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveDeskScreen } from "@/components/terminal/LiveDeskScreen";

export const metadata: Metadata = { title: "Pregão ao vivo · Claritas Terminal" };

export default function LiveDeskPage() {
  return (
    <Suspense>
      <LiveDeskScreen />
    </Suspense>
  );
}
