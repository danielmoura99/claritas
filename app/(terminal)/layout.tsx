import { Suspense } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { TerminalShell } from "@/components/terminal/Shell";

/** Layout das três telas do produto: portão de sessão, topbar, rail, conteúdo e fita de cotações. */
export default function TerminalLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <AuthGate>
        <TerminalShell>{children}</TerminalShell>
      </AuthGate>
    </Suspense>
  );
}
