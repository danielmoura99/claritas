import type * as React from "react";
import { Badge, Panel } from "@/design-system";

/**
 * Estado honesto para módulos do protótipo que ainda não têm fonte de dados ou metodologia real.
 * Nunca preencher com números de demonstração.
 */
export function UnavailableNote({ title = "Indisponível", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="cl-dotgrid flex h-full min-h-24 flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-line-subtle p-4">
      <Badge tone="neutral" size="sm" icon="lock">{title}</Badge>
      <p className="m-0 max-w-sm font-mono text-xs leading-relaxed text-fg-tertiary">{children}</p>
    </div>
  );
}

export function UnavailablePanel({ eyebrow, title, reason }: { eyebrow: string; title?: string; reason: React.ReactNode }) {
  return (
    <Panel eyebrow={eyebrow} title={title} padding="var(--space-2) var(--space-6) var(--space-6)" style={{ flex: 1, minWidth: 0, minHeight: 0 }} bodyStyle={{ display: "flex", flexDirection: "column" }}>
      <UnavailableNote>{reason}</UnavailableNote>
    </Panel>
  );
}
