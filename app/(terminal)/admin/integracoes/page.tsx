import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPayments } from "@/components/admin/AdminAudit";

export const metadata: Metadata = { title: "Pagamentos · Administração · Claritas Terminal" };

export default function Page() {
  return (
    <Suspense>
      <AdminPayments />
    </Suspense>
  );
}
