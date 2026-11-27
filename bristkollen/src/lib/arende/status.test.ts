import { describe, expect, it } from "vitest";
import { dagarMellan, nastaSteg, plusDagar, type Arende } from "./status";
import { exempelArende } from "./testdata";

const SKICKAD = "2026-12-01";
function skickat(over: Partial<Arende> = {}): Arende {
  return exempelArende({
    status: "skickad",
    skickad: `${SKICKAD}T09:00:00.000Z`,
    skickadDatum: SKICKAD,
    nastaPaminnelse: "2026-12-08",
    ...over,
  });
}
const kontroll = (a: Arende, idag: string) => nastaSteg(a, { typ: "dagligKontroll", idag });

describe("datum", () => {
  it("lägger till dagar över månadsskifte", () => {
    expect(plusDagar("2026-12-28", 7)).toBe("2027-01-04");
  });
  it("räknar dagar mellan två datum", () => {
    expect(dagarMellan("2026-12-01", "2026-12-15")).toBe(14);
  });
});

describe("bekräftad", () => {
  it("skickar anmälan, mejlar kunden och planerar påminnelsen", () => {
    const steg = nastaSteg(exempelArende(), { typ: "bekraftad", nu: "2026-12-01T09:00:00.000Z", idag: SKICKAD });
    expect(steg?.arende).toMatchObject({
      status: "skickad",
      skickad: "2026-12-01T09:00:00.000Z",
      skickadDatum: SKICKAD,
      nastaPaminnelse: "2026-12-08",
    });
    expect(steg?.atgarder).toEqual([{ typ: "skickaAnmalan" }, { typ: "mejlaKund", mejl: "skickad" }]);
  });
  it("går inte att bekräfta två gånger", () => {
    expect(nastaSteg(skickat(), { typ: "bekraftad", nu: "x", idag: SKICKAD })).toBeNull();
  });
});

describe("påminnelser", () => {
  it("gör inget före påminnelsedagen", () => {
    expect(kontroll(skickat(), "2026-12-07")?.atgarder).toEqual([]);
  });
  it("skickar påminnelse 1 efter 7 dagar", () => {
    const steg = kontroll(skickat(), "2026-12-08");
    expect(steg?.arende).toMatchObject({ paminnelser: 1, nastaPaminnelse: "2026-12-15" });
    expect(steg?.atgarder).toEqual([
      { typ: "skickaPaminnelse", nummer: 1 },
      { typ: "mejlaKund", mejl: "paminnelse1" },
    ]);
  });
  it("skickar påminnelse 2 och frågar kunden efter 14 dagar", () => {
    const steg = kontroll(skickat({ paminnelser: 1, nastaPaminnelse: "2026-12-15" }), "2026-12-15");
    expect(steg?.arende).toMatchObject({ paminnelser: 2, nastaPaminnelse: "2026-12-22", kundfragor: 1 });
    expect(steg?.atgarder).toEqual([
      { typ: "skickaPaminnelse", nummer: 2 },
      { typ: "mejlaKund", mejl: "paminnelse2" },
      { typ: "mejlaKund", mejl: "arAtgardad" },
    ]);
  });
  it("berättar om nästa steg efter två påminnelser utan svar, och sedan inget mer", () => {
    const a = skickat({ paminnelser: 2, nastaPaminnelse: "2026-12-22", kundfragor: 1 });
    const steg = kontroll(a, "2026-12-22");
    expect(steg?.arende).toMatchObject({ ingetSvarMeddelat: true, nastaPaminnelse: null });
    expect(steg?.atgarder).toEqual([{ typ: "mejlaKund", mejl: "ingetSvar" }]);
    expect(kontroll(steg!.arende, "2026-12-29")?.atgarder).toEqual([]);
  });
});

describe("hyresvärden svarar", () => {
  it("blir besvarat, stoppar påminnelser och mejlar kunden", () => {
    const steg = nastaSteg(skickat(), { typ: "hyresvardSvarade", meddelandeId: "m1" });
    expect(steg?.arende).toMatchObject({ status: "besvarad", nastaPaminnelse: null });
    expect(steg?.atgarder).toEqual([{ typ: "mejlaKundOmSvar", meddelandeId: "m1" }]);
    expect(kontroll(steg!.arende, "2026-12-09")?.atgarder).toEqual([]);
  });
  it("mejlar kunden även när ärendet redan är avslutat", () => {
    const a = skickat({ status: "atgardad", atgardad: "2026-12-05" });
    const steg = nastaSteg(a, { typ: "hyresvardSvarade", meddelandeId: "m2" });
    expect(steg?.arende.status).toBe("atgardad");
    expect(steg?.atgarder).toEqual([{ typ: "mejlaKundOmSvar", meddelandeId: "m2" }]);
  });
  it("ignoreras innan anmälan är skickad", () => {
    expect(nastaSteg(exempelArende(), { typ: "hyresvardSvarade", meddelandeId: "m" })).toBeNull();
  });
});

describe("frågor till kunden", () => {
  it("frågar dag 14 och dag 30, sedan inte mer", () => {
    const a = skickat({ status: "besvarad", nastaPaminnelse: null });
    const dag14 = kontroll(a, "2026-12-15")!;
    expect(dag14.atgarder).toEqual([{ typ: "mejlaKund", mejl: "arAtgardad" }]);
    expect(kontroll(dag14.arende, "2026-12-20")?.atgarder).toEqual([]);
    const dag30 = kontroll(dag14.arende, "2026-12-31")!;
    expect(dag30.arende.kundfragor).toBe(2);
    expect(kontroll(dag30.arende, "2027-02-01")?.atgarder).toEqual([]);
  });
});

describe("kunden", () => {
  it("kan svara hyresvärden när ärendet är öppet", () => {
    expect(nastaSteg(skickat({ status: "besvarad" }), { typ: "kundenSvarade", text: "Torsdag går bra." })?.atgarder).toEqual([
      { typ: "skickaKundsvar", text: "Torsdag går bra." },
    ]);
  });
  it("kan inte svara när ärendet är avslutat", () => {
    expect(nastaSteg(skickat({ status: "atgardad" }), { typ: "kundenSvarade", text: "Hej" })).toBeNull();
  });
  it("avslutar ärendet när bristen är åtgärdad", () => {
    const steg = nastaSteg(skickat(), { typ: "kundenAtgardad", datum: "2026-12-10", manadshyra: 9000 });
    expect(steg?.arende).toMatchObject({ status: "atgardad", atgardad: "2026-12-10", manadshyra: 9000, nastaPaminnelse: null });
    expect(steg?.atgarder).toEqual([{ typ: "mejlaKund", mejl: "avslutat" }]);
    expect(kontroll(steg!.arende, "2027-01-30")?.atgarder).toEqual([]);
  });
  it("kan inte avsluta innan anmälan är skickad", () => {
    expect(nastaSteg(exempelArende(), { typ: "kundenAtgardad", datum: "2026-12-10", manadshyra: null })).toBeNull();
  });
});
