import { describe, expect, it } from "vitest";
import { BRISTTYPER, PROCENTSATSER, UTKAST } from "./procentsatser";

describe("procentsatser", () => {
  it("har exakt värdena från projektets procenttabell", () => {
    const varden = Object.fromEntries(
      Object.entries(PROCENTSATSER).map(([id, rad]) => [id, rad.procent]),
    );
    expect(varden).toEqual({
      buller: { min: 10, max: 35 },
      granne: { min: 10, max: 40 },
      renovering: { min: 10, max: 20 },
      kok_badrum: { min: 35, max: 45 },
      kyla_18_20: { min: 0, max: 5 },
      kyla_under_18: { min: 5, max: 25 },
      hiss: { min: 0, max: 5 },
      tvattstuga: { min: 5, max: 10 },
      mogel: { min: 10, max: 35 },
      vattenskada: { min: 0, max: 100 },
    });
  });

  it("räknar bara vattenskada på ytan som inte går att använda", () => {
    const yta = Object.entries(PROCENTSATSER)
      .filter(([, rad]) => "berakning" in rad && rad.berakning === "yta")
      .map(([id]) => id);
    expect(yta).toEqual(["vattenskada"]);
  });

  it("har källa och utkastflagga på varje rad", () => {
    for (const rad of Object.values(PROCENTSATSER)) {
      expect(rad.status).toBe(UTKAST);
      expect(rad.kalla.length).toBeGreaterThan(0);
    }
  });

  it("har unika bristtyper", () => {
    const ids = BRISTTYPER.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
