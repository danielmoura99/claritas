import { Suspense } from "react";
import { PublicShell } from "@/components/commercial/PublicShell";

/** Páginas públicas (sem login): planos e ajuda. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <PublicShell>{children}</PublicShell>
    </Suspense>
  );
}
