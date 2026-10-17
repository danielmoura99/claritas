import { Suspense } from "react";
import { AdminFrame } from "@/components/admin/shared";

/** Área administrativa (Plano 02 §7): o portão é conveniência; cada chamada da API exige ADMIN no servidor. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
