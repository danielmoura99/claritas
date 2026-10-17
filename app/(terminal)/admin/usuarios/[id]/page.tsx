import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUserRoute } from "@/components/admin/AdminUserRoute";

export const metadata: Metadata = { title: "Usuário · Administração · Claritas Terminal" };

export default function Page() {
  return (
    <Suspense>
      <AdminUserRoute />
    </Suspense>
  );
}
