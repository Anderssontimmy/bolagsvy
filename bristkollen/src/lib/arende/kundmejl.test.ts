import { describe, expect, it } from "vitest";
import { kronorSpann } from "@/lib/format";
import { kundMejl, mejlSvar, uppskattningText } from "./kundmejl";
import { exempelArende } from "./testdata";

const LANK = "https://halvhyra.se/arende#abc";
const a = exempelArende({ status: "skickad", skickad: "2026-12-01T09:00:00.000Z", skickadDatum: "2026-12-01" });

describe("mejl till kunden", () => {
  it.each(["skickad", "paminnelse1", "paminnelse2", "ingetSvar", "arAtgardad", "avslutat"] as const)(
    "%s har ämne, länk och hälsning",
    (typ) => {
      const m = kundMejl(typ, a, LANK, "2026-12-20");
      expect(m.amne.length).toBeGreaterThan(5);
      expect(m.text).toContain(LANK);
      expect(m.text.startsWith("Hej Anna Andersson!")).toBe(true);
    },
  );
  it("påminner om att betala hyran när anmälan är skickad", () => {
    expect(kundMejl("skickad", a, LANK, "2026-12-01").text).toContain("Håll aldrig inne hyran");
  });
  it("visar AI-sammanfattningen och hyresvärdens fråga", () => {
    const m = mejlSvar(a, { sammanfattning: "De kommer på torsdag.", kategori: "fragar", fraga: "Är du hemma?" }, LANK);
    expect(m.amne).toBe("Exempelbostäder AB har svarat på din anmälan");
    expect(m.text).toContain("De kommer på torsdag.");
    expect(m.text).toContain("gjord av AI");
    expect(m.text).toContain("Hyresvärden frågar: Är du hemma?");
  });
});

describe("uppskattning", () => {
  const avslutat = exempelArende({
    status: "atgardad",
    brist: "kyla",
    temperatur: 16,
    skickadDatum: "2026-12-01",
    atgardad: "2026-12-31",
    manadshyra: 9000,
  });
  it("räknar som kalkylatorn: 9 000 kr × 5–25 % × 30 dagar ÷ 30", () => {
    expect(uppskattningText(avslutat, "2027-01-02")).toBe(
      `Uppskattning – ingen garanti: hyran kan sänkas med ungefär ${kronorSpann({ min: 450, max: 2250 })} för 30 dagar (5–25 % av månadshyran).`,
    );
  });
  it("ger null utan månadshyra eller när kalkylatorn inte kan räkna", () => {
    expect(uppskattningText({ ...avslutat, manadshyra: null }, "2027-01-02")).toBeNull();
    expect(uppskattningText({ ...avslutat, temperatur: null }, "2027-01-02")).toBeNull();
  });
});
