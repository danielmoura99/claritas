import { describe, expect, it } from "vitest";
import { safeNext } from "./use-session";

describe("safeNext", () => {
  it("aceita só caminhos internos", () => {
    expect(safeNext("/scanner?size=30")).toBe("/scanner?size=30");
    expect(safeNext("/?symbol=ETHUSDT&interval=15m")).toBe("/?symbol=ETHUSDT&interval=15m");
    for (const bad of [null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/entrar?next=/"]) expect(safeNext(bad)).toBe("/");
  });
});
