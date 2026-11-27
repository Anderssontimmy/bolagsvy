import { describe, expect, it } from "vitest";
import { skapaBekraftelse, skapaBrev, skapaKundsvar, skapaPaminnelse } from "./brev";
import { ANMALAN, exempelArende } from "./testdata";

describe("skapaBrev", () => {
  const brev = skapaBrev(ANMALAN);

  it("har ett ämne med brist, adress och lägenhetsnummer", () => {
    expect(brev.amne).toBe("Anmälan om brist: Kallt i lägenheten – Storgatan 12, lgh 1102");
  });

  it("innehåller hyresgästens uppgifter, bristen och kravet", () => {
    for (const rad of [
      "Till Exempelbostäder AB",
      "Hyresgäst: Anna Andersson",
      "Adress: Storgatan 12, 123 45 Exempelstad",
      "Lägenhetsnummer: 1102",
      "Brist: Kallt i lägenheten",
      "Uppmätt temperatur inomhus: 16,5 °C",
      "Bristen har funnits sedan: 1 november 2026",
      "Elementen i vardagsrummet och sovrummet är kalla.",
      "Jag ber er att åtgärda bristen så snart som möjligt.",
      "Jag begär nedsättning av hyran från och med den dag ni tar emot den här anmälan",
    ]) {
      expect(brev.text).toContain(rad);
    }
  });

  it("säger att svar går till oss och vidare till hyresgästen", () => {
    expect(brev.text).toContain("Svara på det här mejlet, så når svaret mig.");
    expect(brev.text).toContain("Vid besök i lägenheten når ni mig också på 070-123 45 67.");
    expect(brev.text).toMatch(/skickas via Halvhyra\.se \(halvhyra\.se\) på uppdrag av Anna Andersson/);
    expect(brev.text).toContain("Svar på det här mejlet går till Halvhyra.se, som för det vidare till Anna Andersson.");
  });

  it("har ingen temperaturrad för andra brister och nämner inte telefon när den saknas", () => {
    const annan = skapaBrev({ ...ANMALAN, brist: "hiss", temperatur: null, telefon: null });
    expect(annan.text).not.toContain("temperatur");
    expect(annan.text).not.toContain("Vid besök");
  });
});

describe("skapaBekraftelse", () => {
  it("innehåller länken, mottagaren och hela anmälan", () => {
    const brev = skapaBrev(ANMALAN);
    const mejl = skapaBekraftelse(ANMALAN, brev, "https://exempel.se/anmal/bekrafta#abc");
    expect(mejl.amne).toBe("Bekräfta din anmälan till Exempelbostäder AB");
    expect(mejl.text).toContain("https://exempel.se/anmal/bekrafta#abc");
    expect(mejl.text).toContain("felanmalan@exempelbostader.se");
    expect(mejl.text).toContain("Ingenting har skickats än");
    expect(mejl.text).toContain(brev.text);
  });
});

describe("påminnelse", () => {
  const a = exempelArende({ status: "skickad", skickadDatum: "2026-12-01" });
  it("hänvisar till anmälan och bifogar den", () => {
    const p = skapaPaminnelse(a, 1);
    expect(p.amne).toBe(`Påminnelse: ${a.amne}`);
    expect(p.text).toContain("den 1 december 2026 och har inte fått något svar.");
    expect(p.text).not.toContain("andra påminnelse");
    expect(p.text).toContain(a.brevtext);
  });
  it("säger att det är andra påminnelsen", () => {
    const p = skapaPaminnelse(a, 2);
    expect(p.amne).toBe(`Påminnelse 2: ${a.amne}`);
    expect(p.text).toContain("Det här är min andra påminnelse.");
  });
});

it("skickar kundens svar oförändrat med namn och sidfot", () => {
  const a = exempelArende({ status: "besvarad" });
  const s = skapaKundsvar(a, "Torsdag mellan 8 och 12 går bra.");
  expect(s.amne).toBe(`Sv: ${a.amne}`);
  expect(s.text.startsWith("Torsdag mellan 8 och 12 går bra.\n\nVänliga hälsningar\nAnna Andersson")).toBe(true);
  expect(s.text).toContain("på uppdrag av Anna Andersson");
});
