"use client";

import * as React from "react";

/** Column of a DataTable. `render` receives the row; `mono` sets Geist Mono tabular numbers. */
export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
  /** CSS width (e.g. "28%", "120px"). */
  width?: string;
  /** Hide below this viewport width (px) — keeps tables readable on phones. */
  hideBelow?: number;
  /** Let long text wrap instead of truncating with an ellipsis (reasons, descriptions). */
  wrap?: boolean;
}

/** Dense data table in the terminal grammar: label header, hairline rows, hover, keyboard-activatable rows. */
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Accessible name of the row action, e.g. row => `Abrir ${row.email}`. */
  rowLabel?: (row: T) => string;
  loading?: boolean;
  /** Shown when there are no rows and not loading. */
  empty?: React.ReactNode;
  caption?: string;
  dense?: boolean;
  style?: React.CSSProperties;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, rowLabel, loading = false, empty = "Nada para mostrar.", caption, dense = false, style }: DataTableProps<T>) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [width, setWidth] = React.useState(Number.POSITIVE_INFINITY);
  React.useEffect(() => {
    const f = () => setWidth(window.innerWidth);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  const cols = columns.filter((c) => !c.hideBelow || width >= c.hideBelow);
  const rowH = dense ? "var(--row-h-dense)" : "var(--row-h)";
  const cell = (c: DataTableColumn<T>): React.CSSProperties => ({
    padding: "0 12px",
    textAlign: c.align ?? "left",
    width: c.width,
    whiteSpace: c.wrap ? "normal" : "nowrap",
    overflow: "hidden",
    textOverflow: c.wrap ? undefined : "ellipsis",
    maxWidth: 0,
    paddingBlock: c.wrap ? 6 : undefined,
    font: c.mono ? "var(--weight-medium) var(--num-s-size)/1 var(--font-mono)" : "var(--text-caption)",
    fontVariantNumeric: "tabular-nums",
    color: "var(--text-secondary)",
  });
  return (
    <div style={{ width: "100%", overflowX: "auto", ...style }} aria-busy={loading || undefined}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        {caption && <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{caption}</caption>}
        <thead>
          <tr style={{ height: "var(--row-h-dense)", borderBottom: "1px solid var(--border-default)" }}>
            {cols.map((c) => (
              <th key={c.key} scope="col" style={{ ...cell(c), font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const k = rowKey(row);
            const on = hovered === k && Boolean(onRowClick);
            return (
              <tr
                key={k}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); } } : undefined}
                onMouseEnter={() => setHovered(k)}
                onMouseLeave={() => setHovered(null)}
                style={{ height: rowH, borderBottom: "1px solid var(--border-subtle)", background: on ? "var(--surface-hover)" : "transparent", cursor: onRowClick ? "pointer" : "default", transition: "background var(--dur-tick) var(--ease-out)" }}
              >
                {cols.map((c) => <td key={c.key} style={cell(c)}>{c.render(row)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!loading && rows.length === 0 && <div style={{ padding: "28px 12px", font: "var(--text-caption)", color: "var(--text-tertiary)", textAlign: "center" }}>{empty}</div>}
      {loading && rows.length === 0 && <div role="status" style={{ padding: "28px 12px", font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)", textAlign: "center" }}>Carregando…</div>}
    </div>
  );
}
