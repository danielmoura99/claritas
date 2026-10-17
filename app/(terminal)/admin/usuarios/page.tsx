import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const metadata: Metadata = { title: "Usuários · Administração · Claritas Terminal" };

export default function Page() {
  return (
    <Suspense>
      <AdminUsers />
    </Suspense>
  );
}
