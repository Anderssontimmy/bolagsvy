import { describe, expect, it } from "vitest";
import { raknaUt, type KalkylIndata } from "./kalkylator";

const IDAG = "2026-11-25";

function indata(andringar: Partial<KalkylIndata> = {}): KalkylIndata {
  return {
    brist: "kyla",
    manadshyra: 9000,
    temperatur: 16,
    anmaldSkriftligt: true,
    anmalanDatum: "2026-11-01",
    atgardad: true,
    atgardDatum: "2026-11-16",
    idag: IDAG,
    ...andringar,
  };
}

describe("raknaUt – uppskattning", () => {
  it("räknar månadshyra × procent × dagar ÷ 30 för kyla under 18 °C", () => {
    const r = raknaUt(indata());
    expect(r.typ).toBe("uppskattning");
    if (r.typ !== "uppskattning") return;
    expect(r.radId).toBe("kyla_under_18");
    expect(r.dagar).toBe(15);
    // 9000 × 5 % × 15 / 30 = 225 → avrundas nedåt till 220
    // 9000 × 25 % × 15 / 30 = 1125 → avrundas uppåt till 1130
    expect(r.belopp).toEqual({ min: 220, max: 1130 });
    expect(r.pagaende).toBe(false);
  });

  it("ger exakt formelns värden när ingen avrundning behövs", () => {
    const r = raknaUt(
      indata({ brist: "buller", temperatur: null, anmalanDatum: "2026-10-01", atgardDatum: "2026-10-31" }),
    );
    if (r.typ !== "uppskattning") throw new Error(r.typ);
    expect(r.dagar).toBe(30);
    expect(r.belopp).toEqual({ min: 900, max: 3150 });
  });

  it("räknar dagarna fram till i dag när bristen inte är åtgärdad", () => {
    const r = raknaUt(indata({ atgardad: false, atgardDatum: "" }));
    if (r.typ !== "uppskattning") throw new Error(r.typ);
    expect(r.dagar).toBe(24);
    expect(r.till).toBe(IDAG);
    expect(r.pagaende).toBe(true);
    expect(r.belopp).toEqual({ min: 360, max: 1800 });
  });

  it("räknar aldrig dagar före anmälan", () => {
    const r = raknaUt(indata({ anmalanDatum: "2026-11-20", atgardad: false, atgardDatum: "" }));
    if (r.typ !== "uppskattning") throw new Error(r.typ);
    expect(r.dagar).toBe(5);
    expect(r.fran).toBe("2026-11-20");
  });

  it("använder 0–5 % mellan 18 och 20 °C", () => {
    const r = raknaUt(
      indata({ temperatur: 19, anmalanDatum: "2026-10-26", atgardad: false, atgardDatum: "" }),
    );
    if (r.typ !== "uppskattning") throw new Error(r.typ);
    expect(r.radId).toBe("kyla_18_20");
    expect(r.dagar).toBe(30);
    expect(r.belopp).toEqual({ min: 0, max: 450 });
  });

  it("räknar exakt 18 °C som 18–20 och 17,9 °C som under 18", () => {
    const arton = raknaUt(indata({ temperatur: 18 }));
    const under = raknaUt(indata({ temperatur: 17.9 }));
    expect(arton.typ === "uppskattning" && arton.radId).toBe("kyla_18_20");
    expect(under.typ === "uppskattning" && under.radId).toBe("kyla_under_18");
  });

  it("ger 0 dagar och 0 kr när bristen åtgärdades samma dag", () => {
    const r = raknaUt(indata({ atgardDatum: "2026-11-01" }));
    if (r.typ !== "uppskattning") throw new Error(r.typ);
    expect(r.dagar).toBe(0);
    expect(r.belopp).toEqual({ min: 0, max: 0 });
  });

  it("räknar rätt antal dagar över omställningen till vintertid", () => {
    const r = raknaUt(indata({ anmalanDatum: "2026-10-20", atgardDatum: "2026-11-03" }));
    if (r.typ !== "uppskattning") throw new Error(r.typ);
    expect(r.dagar).toBe(14);
  });
});

describe("raknaUt – inte anmält skriftligt", () => {
  it("ger ingen nedsättning men visar vad varje dag kan kosta", () => {
    const r = raknaUt(indata({ anmaldSkriftligt: false, anmalanDatum: "", atgardad: null, atgardDatum: "" }));
    expect(r.typ).toBe("ej_anmald");
    if (r.typ !== "ej_anmald") return;
    // 9000 × 5 % / 30 = 15 kr och 9000 × 25 % / 30 = 75 kr per dag
    expect(r.perDag).toEqual({ min: 15, max: 75 });
  });

  it("struntar i datumen när bristen inte är anmäld", () => {
    const r = raknaUt(
      indata({ anmaldSkriftligt: false, anmalanDatum: "2099-01-01", atgardad: true, atgardDatum: "1999-01-01" }),
    );
    expect(r.typ).toBe("ej_anmald");
  });

  it("har inget belopp per dag för brister utan procentsats", () => {
    const r = raknaUt(indata({ brist: "hiss", temperatur: null, anmaldSkriftligt: false }));
    if (r.typ !== "ej_anmald") throw new Error(r.typ);
    expect(r.perDag).toBeNull();
  });
});

describe("raknaUt – brister utan värde och varma lägenheter", () => {
  it.each(["hiss", "tvattstuga", "mogel", "vattenskada"])("%s ger inget_varde", (brist) => {
    const r = raknaUt(indata({ brist, temperatur: null }));
    expect(r.typ).toBe("inget_varde");
  });

  it("räknar inte 20 °C eller mer som kallt", () => {
    expect(raknaUt(indata({ temperatur: 20 })).typ).toBe("inte_kallt");
    expect(raknaUt(indata({ temperatur: 22.5 })).typ).toBe("inte_kallt");
  });
});

describe("raknaUt – felaktiga uppgifter", () => {
  function fel(andringar: Partial<KalkylIndata>) {
    const r = raknaUt(indata(andringar));
    if (r.typ !== "fel") throw new Error(`väntade fel, fick ${r.typ}`);
    return r.fel;
  }

  it("kräver en bristtyp", () => {
    expect(fel({ brist: "" }).brist).toBeDefined();
    expect(fel({ brist: "påhittad" }).brist).toBeDefined();
  });

  it("avvisar hyra som är 0, negativ eller saknas", () => {
    expect(fel({ manadshyra: 0 }).manadshyra).toBeDefined();
    expect(fel({ manadshyra: -500 }).manadshyra).toBeDefined();
    expect(fel({ manadshyra: null }).manadshyra).toBeDefined();
    expect(fel({ manadshyra: Number.NaN }).manadshyra).toBeDefined();
  });

  it("kräver temperatur för kyla", () => {
    expect(fel({ temperatur: null }).temperatur).toBeDefined();
  });

  it("avvisar orimliga temperaturer", () => {
    expect(fel({ temperatur: 55 }).temperatur).toBeDefined();
    expect(fel({ temperatur: -5 }).temperatur).toBeDefined();
  });

  it("kräver inte temperatur för andra brister", () => {
    expect(raknaUt(indata({ brist: "buller", temperatur: null })).typ).toBe("uppskattning");
  });

  it("kräver svar på om bristen är anmäld", () => {
    expect(fel({ anmaldSkriftligt: null }).anmaldSkriftligt).toBeDefined();
  });

  it("kräver ett giltigt anmälningsdatum", () => {
    expect(fel({ anmalanDatum: "" }).anmalanDatum).toBeDefined();
    expect(fel({ anmalanDatum: "2026-02-30" }).anmalanDatum).toBeDefined();
    expect(fel({ anmalanDatum: "1/11/2026" }).anmalanDatum).toBeDefined();
  });

  it("avvisar anmälningsdatum i framtiden", () => {
    expect(fel({ anmalanDatum: "2026-11-26", atgardad: false }).anmalanDatum).toBeDefined();
  });

  it("avvisar åtgärdsdatum i framtiden", () => {
    expect(fel({ atgardDatum: "2027-01-01" }).atgardDatum).toBeDefined();
  });

  it("avvisar åtgärdsdatum före anmälningsdatum", () => {
    expect(fel({ anmalanDatum: "2026-11-10", atgardDatum: "2026-11-05" }).atgardDatum).toBeDefined();
  });

  it("kräver svar på om bristen är åtgärdad när den är anmäld", () => {
    expect(fel({ atgardad: null }).atgardad).toBeDefined();
  });

  it("kräver åtgärdsdatum när bristen är åtgärdad", () => {
    expect(fel({ atgardDatum: "" }).atgardDatum).toBeDefined();
  });

  it("samlar alla fel på en gång", () => {
    const f = fel({ brist: "", manadshyra: 0, anmaldSkriftligt: null });
    expect(Object.keys(f).sort()).toEqual(["anmaldSkriftligt", "brist", "manadshyra"]);
  });
});
