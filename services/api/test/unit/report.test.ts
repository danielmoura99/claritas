import { describe, expect, it } from "vitest";
import { dayBounds, drawdownRunup, tzOffsetMs } from "../../src/modules/report/report-service";
import { ReportQuerySchema } from "@claritas/contracts";

describe("janelas do resumo", () => {
  it("offset de fuso via Intl (Brasília = UTC−3, sem horário de verão desde 2019)", () => {
    expect(tzOffsetMs("America/Sao_Paulo", Date.UTC(2026, 9, 14, 12))).toBe(-3 * 3_600_000);
    expect(tzOffsetMs("UTC", Date.UTC(2026, 9, 14, 12))).toBe(0);
  });

  it("dia de calendário em Brasília começa às 03:00 UTC", () => {
    const { startMs, endMs } = dayBounds("2026-10-14", "America/Sao_Paulo");
    expect(new Date(startMs).toISOString()).toBe("2026-10-14T03:00:00.000Z");
    expect(new Date(endMs).toISOString()).toBe("2026-10-15T03:00:00.000Z");
    expect(endMs - startMs).toBe(86_400_000);
  });

  it("dia UTC é meia-noite a meia-noite", () => {
    const { startMs, endMs } = dayBounds("2026-01-01", "UTC");
    expect(new Date(startMs).toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(endMs - startMs).toBe(86_400_000);
  });

  it("maior queda e maior alta respeitam a ordem temporal", () => {
    expect(drawdownRunup([100, 120, 90, 110])).toEqual({ drawdownPct: 25, runupPct: expect.closeTo(22.222, 2) }); // 90→110 (o 120 vem antes do 90)
    expect(drawdownRunup([100, 90, 80])).toEqual({ drawdownPct: 20, runupPct: 0 });
  });

  it("window=day exige data", () => {
    expect(ReportQuerySchema.safeParse({ symbol: "BTCUSDT", window: "day" }).success).toBe(false);
    expect(ReportQuerySchema.parse({ symbol: "btcusdt" })).toMatchObject({ symbol: "BTCUSDT", window: "rolling_24h", tz: "America/Sao_Paulo" });
  });
});
