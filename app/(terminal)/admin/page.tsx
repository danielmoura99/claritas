import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOverview } from "@/components/admin/AdminOverview";

export const metadata: Metadata = { title: "Administração · Claritas Terminal" };

export default function Page() {
  return (
    <Suspense>
      <AdminOverview />
    </Suspense>
  );
}
