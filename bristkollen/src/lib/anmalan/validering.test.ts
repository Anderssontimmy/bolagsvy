import { describe, expect, it } from "vitest";
import { ANMALAN } from "./testdata";
import { valideraAnmalan } from "./validering";

const IDAG = "2026-11-25";
const indata = (andringar: Record<string, unknown> = {}) => ({ ...ANMALAN, uppdrag: true, ...andringar });

describe("valideraAnmalan", () => {
  it("godkänner giltiga uppgifter och normaliserar dem", () => {
    const r = valideraAnmalan(indata({ epost: " Anna@Exempel.SE ", postnummer: "123 45" }), IDAG);
    expect(r).toEqual({ ok: true, spam: false, data: { ...ANMALAN, epost: "anna@exempel.se" } });
  });

  it("tar bort radbrytningar i fält som ska vara en rad", () => {
    const r = valideraAnmalan(indata({ namn: "Anna\r\nBcc: x@y.se" }), IDAG);
    expect(r.ok && !r.spam && r.data.namn).toBe("Anna Bcc: x@y.se");
  });

  it("behåller radbrytningar i beskrivningen", () => {
    const r = valideraAnmalan(indata({ beskrivning: "Rad ett\r\nRad två är också här" }), IDAG);
    expect(r.ok && !r.spam && r.data.beskrivning).toBe("Rad ett\nRad två är också här");
  });

  it("gör telefon frivillig och struntar i temperatur för andra brister", () => {
    const r = valideraAnmalan(indata({ telefon: "", brist: "hiss", temperatur: 12 }), IDAG);
    expect(r.ok && !r.spam && [r.data.telefon, r.data.temperatur]).toEqual([null, null]);
  });

  it("kräver alla obligatoriska fält", () => {
    const r = valideraAnmalan({ uppdrag: true }, IDAG);
    if (r.ok) throw new Error("väntade fel");
    expect(Object.keys(r.fel).sort()).toEqual(
      [
        "beskrivning",
        "brist",
        "epost",
        "gatuadress",
        "hyresvardEpost",
        "hyresvardNamn",
        "lagenhetsnummer",
        "namn",
        "ort",
        "postnummer",
        "sedan",
      ].sort(),
    );
  });

  it("kräver att hyresgästen ger oss uppdraget", () => {
    const r = valideraAnmalan(indata({ uppdrag: false }), IDAG);
    expect(!r.ok && r.fel.uppdrag).toBeTruthy();
  });

  it("avvisar samma e-post för hyresgäst och hyresvärd", () => {
    const r = valideraAnmalan(indata({ hyresvardEpost: "ANNA@exempel.se" }), IDAG);
    expect(!r.ok && r.fel.hyresvardEpost).toBeTruthy();
  });

  it("avvisar datum i framtiden och orimliga temperaturer", () => {
    const r = valideraAnmalan(indata({ sedan: "2026-11-26", temperatur: 60 }), IDAG);
    if (r.ok) throw new Error("väntade fel");
    expect(Object.keys(r.fel).sort()).toEqual(["sedan", "temperatur"]);
  });

  it("kräver en beskrivning på minst 10 tecken", () => {
    const r = valideraAnmalan(indata({ beskrivning: "Kallt" }), IDAG);
    expect(!r.ok && r.fel.beskrivning).toBeTruthy();
  });

  it("markerar ifyllt honeypot-fält som spam", () => {
    expect(valideraAnmalan(indata({ webbplats: "spam" }), IDAG)).toEqual({ ok: true, spam: true });
  });
});
