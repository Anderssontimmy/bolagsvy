import { describe, expect, it } from "vitest";
import { skapaBekraftelse, skapaBrev } from "./brev";
import { ANMALAN } from "./testdata";

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
      "Ni når mig på anna@exempel.se eller 070-123 45 67.",
    ]) {
      expect(brev.text).toContain(rad);
    }
  });

  it("säger att anmälan skickats via tjänsten och att svar går till hyresgästen", () => {
    expect(brev.text).toMatch(/skickades via Bristkollen .* på uppdrag av Anna Andersson/);
    expect(brev.text).toContain("svar på det här mejlet går direkt till Anna Andersson");
  });

  it("har ingen temperaturrad för andra brister", () => {
    const annan = skapaBrev({ ...ANMALAN, brist: "hiss", temperatur: null, telefon: null });
    expect(annan.text).not.toContain("temperatur");
    expect(annan.text).toContain("Ni når mig på anna@exempel.se.");
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
