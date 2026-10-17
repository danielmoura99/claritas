import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";

export const metadata: Metadata = { title: "Assinaturas · Administração · Claritas Terminal" };

export default function Page() {
  return (
    <Suspense>
      <AdminSubscriptions />
    </Suspense>
  );
}
