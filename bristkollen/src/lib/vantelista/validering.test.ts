import { describe, expect, it } from "vitest";
import { valideraVantelista } from "./validering";

describe("valideraVantelista", () => {
  it("godkänner en minimal anmälan och normaliserar e-posten", () => {
    expect(valideraVantelista({ epost: "  Anna@Exempel.SE ", samtycke: true })).toEqual({
      ok: true,
      spam: false,
      data: { epost: "anna@exempel.se", brist: null, postnummer: null },
    });
  });

  it("tar med frivillig brist och postnummer", () => {
    const r = valideraVantelista({ epost: "a@b.se", brist: "kyla", postnummer: "123 45", samtycke: true });
    expect(r).toEqual({ ok: true, spam: false, data: { epost: "a@b.se", brist: "kyla", postnummer: "12345" } });
  });

  it("behandlar tomma frivilliga fält som inget svar", () => {
    const r = valideraVantelista({ epost: "a@b.se", brist: "", postnummer: " ", samtycke: true });
    expect(r.ok && !r.spam && r.data).toEqual({ epost: "a@b.se", brist: null, postnummer: null });
  });

  it("kräver en giltig e-postadress", () => {
    for (const epost of [undefined, "", "anna", "anna@", "@exempel.se", "anna@exempel", "a b@c.se", 42]) {
      const r = valideraVantelista({ epost, samtycke: true });
      expect(r.ok, String(epost)).toBe(false);
      if (!r.ok) expect(r.fel.epost).toBeDefined();
    }
  });

  it("avvisar för långa e-postadresser", () => {
    const r = valideraVantelista({ epost: `${"a".repeat(250)}@b.se`, samtycke: true });
    expect(r.ok).toBe(false);
  });

  it("kräver samtycke som är exakt true", () => {
    for (const samtycke of [undefined, false, "true", "on", 1]) {
      const r = valideraVantelista({ epost: "a@b.se", samtycke });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.fel.samtycke).toBeDefined();
    }
  });

  it("avvisar okänd brist och felaktigt postnummer", () => {
    const r = valideraVantelista({ epost: "a@b.se", brist: "drake", postnummer: "01234", samtycke: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fel).sort()).toEqual(["brist", "postnummer"]);
  });

  it("markerar ifyllt honeypot-fält som spam utan att avslöja det", () => {
    expect(valideraVantelista({ epost: "a@b.se", samtycke: true, webbplats: "http://spam" })).toEqual({
      ok: true,
      spam: true,
    });
  });

  it("avvisar annat än ett objekt", () => {
    expect(valideraVantelista(null).ok).toBe(false);
    expect(valideraVantelista("a@b.se").ok).toBe(false);
    expect(valideraVantelista([]).ok).toBe(false);
  });
});
