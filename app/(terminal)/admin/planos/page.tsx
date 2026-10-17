import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPlans } from "@/components/admin/AdminPlans";

export const metadata: Metadata = { title: "Planos · Administração · Claritas Terminal" };

export default function Page() {
  return (
    <Suspense>
      <AdminPlans />
    </Suspense>
  );
}
