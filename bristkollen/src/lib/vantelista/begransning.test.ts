import { describe, expect, it } from "vitest";
import { skapaBegransare } from "./begransning";

describe("skapaBegransare", () => {
  it("släpper igenom upp till max anrop per fönster", () => {
    const tillat = skapaBegransare({ max: 3, fonsterMs: 1000 });
    expect([tillat("a", 0), tillat("a", 10), tillat("a", 20), tillat("a", 30)]).toEqual([true, true, true, false]);
  });

  it("räknar varje nyckel för sig", () => {
    const tillat = skapaBegransare({ max: 1, fonsterMs: 1000 });
    expect(tillat("a", 0)).toBe(true);
    expect(tillat("b", 0)).toBe(true);
    expect(tillat("a", 1)).toBe(false);
  });

  it("släpper igenom igen när fönstret har gått", () => {
    const tillat = skapaBegransare({ max: 1, fonsterMs: 1000 });
    expect(tillat("a", 0)).toBe(true);
    expect(tillat("a", 999)).toBe(false);
    expect(tillat("a", 1001)).toBe(true);
  });
});
