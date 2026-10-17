import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountScreen } from "@/components/commercial/AccountScreen";

export const metadata: Metadata = { title: "Minha conta · Claritas Terminal" };

export default function AccountPage() {
  return (
    <Suspense>
      <AccountScreen />
    </Suspense>
  );
}
