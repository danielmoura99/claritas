import { Suspense } from "react";
import { TerminalShell } from "@/components/terminal/Shell";

/** Layout das três telas do produto: topbar, rail, conteúdo e fita de cotações. */
export default function TerminalLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <TerminalShell>{children}</TerminalShell>
    </Suspense>
  );
}
