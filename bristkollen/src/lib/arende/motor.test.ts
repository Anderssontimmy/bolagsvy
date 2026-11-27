import { describe, expect, it } from "vitest";
import { reservAi } from "@/lib/ai";
import type { Mejl } from "@/lib/epost";
import { hantera, taEmotSvar } from "./motor";
import { exempelArende, falskEpost, testTjanster } from "./testdata";

const BAS = "https://halvhyra.se";
const BEKRAFTAD = { typ: "bekraftad" as const, nu: "2026-12-01T09:00:00.000Z", idag: "2026-12-01" };

async function medFoto(t: ReturnType<typeof testTjanster>) {
  const a = exempelArende();
  await t.lagring.skapa(a);
  await t.filer.spara(`${a.id}/foto-1.jpg`, Buffer.from("jpg"), "image/jpeg");
  await t.lagring.laggTillBilaga({
    id: "b1", arendeId: a.id, meddelandeId: null, kalla: "kund", filnamn: "foto-1.jpg", mime: "image/jpeg",
    storlek: 3, sha256: "x", sokvag: `${a.id}/foto-1.jpg`, skapad: "2026-12-01T08:00:00.000Z",
  });
  return a;
}

describe("hantera", () => {
  it("skickar anmälan med foto, svarsadress och kopia, och sparar beviset", async () => {
    const skickat: Mejl[] = [];
    const t = testTjanster({ epost: falskEpost(skickat) });
    const a = await medFoto(t);
    const efter = await hantera(t, a, BEKRAFTAD, BAS);
    expect(efter?.status).toBe("skickad");
    const [anmalan, tillKund] = skickat;
    expect(anmalan).toMatchObject({
      fran: '"Anna Andersson via Halvhyra.se" <anmalan@halvhyra.se>',
      till: [a.hyresvardEpost],
      kopia: [a.kundEpost],
      svarTill: ["arende-abcde23456@svar.halvhyra.se"],
      amne: a.amne,
      text: a.brevtext,
      idempotensnyckel: `anmalan-${a.id}`,
    });
    expect(anmalan.bilagor).toEqual([{ filnamn: "foto-1.jpg", innehall: Buffer.from("jpg") }]);
    expect(tillKund.till).toEqual([a.kundEpost]);
    expect(tillKund.text).toContain(`${BAS}/arende#abcde23456.`);
    expect((await t.lagring.hamtaViaKortId(a.kortId))?.status).toBe("skickad");
    expect(await t.lagring.meddelanden(a.id)).toMatchObject([{ riktning: "ut", typ: "anmalan", leverantorId: "e-1" }]);
  });
  it("sparar inget om anmälan inte kunde skickas", async () => {
    const t = testTjanster({ epost: falskEpost([], (m) => m.idempotensnyckel.startsWith("anmalan")) });
    const a = await medFoto(t);
    await expect(hantera(t, a, BEKRAFTAD, BAS)).rejects.toThrow();
    expect((await t.lagring.hamtaViaKortId(a.kortId))?.status).toBe("vantar_bekraftelse");
    expect(await t.lagring.meddelanden(a.id)).toEqual([]);
  });
  it("går vidare även om mejlet till kunden misslyckas", async () => {
    const a0 = exempelArende();
    const t = testTjanster({ epost: falskEpost([], (m) => m.till[0] === a0.kundEpost) });
    await t.lagring.skapa(a0);
    expect((await hantera(t, a0, BEKRAFTAD, BAS))?.status).toBe("skickad");
  });
  it("ger null för en händelse som inte är tillåten", async () => {
    const skickat: Mejl[] = [];
    const t = testTjanster({ epost: falskEpost(skickat) });
    const a = exempelArende();
    await t.lagring.skapa(a);
    expect(await hantera(t, a, { typ: "kundenSvarade", text: "Hej" }, BAS)).toBeNull();
    expect(skickat).toEqual([]);
  });
  it("skickar inget i testläge men sparar meddelandet", async () => {
    const t = testTjanster({ lage: "test", epost: null });
    const a = exempelArende();
    await t.lagring.skapa(a);
    await hantera(t, a, BEKRAFTAD, BAS);
    expect(await t.lagring.meddelanden(a.id)).toMatchObject([{ typ: "anmalan", leverantorId: `test-anmalan-${a.id}` }]);
  });
});

describe("taEmotSvar", () => {
  const ai = { ...reservAi(), tolkaSvar: async () => ({ sammanfattning: "De kommer på torsdag.", kategori: "lovar_atgard" as const, fraga: "" }) };
  const skickatArende = () => exempelArende({ status: "skickad", skickad: BEKRAFTAD.nu, skickadDatum: BEKRAFTAD.idag, nastaPaminnelse: "2026-12-08" });
  const svar = { leverantorId: "r1", fran: "felanmalan@exempelbostader.se", amne: "Sv: Anmälan", text: "Vi kommer på torsdag.", franHyresvard: true };

  it("sparar svaret med tolkning och bilaga, och mejlar kunden", async () => {
    const skickat: Mejl[] = [];
    const t = testTjanster({ epost: falskEpost(skickat), ai });
    const a = skickatArende();
    await t.lagring.skapa(a);
    const r = await taEmotSvar(t, a, { ...svar, bilagor: [{ filnamn: "Tid bokad.pdf", typ: "application/pdf", data: Buffer.from("pdf") }] }, BAS);
    expect(r).toBe("ny");
    expect(await t.lagring.meddelanden(a.id)).toMatchObject([
      { riktning: "in", typ: "hyresvardssvar", aiSammanfattning: "De kommer på torsdag.", aiKategori: "lovar_atgard" },
    ]);
    expect(await t.lagring.bilagor(a.id)).toMatchObject([{ kalla: "hyresvard", filnamn: "Tid bokad.pdf", mime: "application/pdf" }]);
    expect((await t.lagring.hamtaViaKortId(a.kortId))?.status).toBe("besvarad");
    expect(skickat.map((m) => m.till[0])).toEqual([a.kundEpost]);
    expect(skickat[0].text).toContain("De kommer på torsdag.");
  });
  it("stoppar dubbletter", async () => {
    const skickat: Mejl[] = [];
    const t = testTjanster({ epost: falskEpost(skickat), ai });
    const a = skickatArende();
    await t.lagring.skapa(a);
    await taEmotSvar(t, a, { ...svar, bilagor: [] }, BAS);
    expect(await taEmotSvar(t, a, { ...svar, bilagor: [] }, BAS)).toBe("dubblett");
    expect(skickat).toHaveLength(1);
  });
  it("skickar inte vidare mejl från okänd avsändare", async () => {
    const skickat: Mejl[] = [];
    const t = testTjanster({ epost: falskEpost(skickat), ai });
    const a = skickatArende();
    await t.lagring.skapa(a);
    const r = await taEmotSvar(t, a, { ...svar, fran: "x@annan.se", franHyresvard: false, bilagor: [{ filnamn: "a.exe", typ: "x", data: Buffer.from("x") }] }, BAS);
    expect(r).toBe("okand");
    expect(await t.lagring.meddelanden(a.id)).toMatchObject([{ typ: "okand_avsandare", aiSammanfattning: null }]);
    expect(await t.lagring.bilagor(a.id)).toEqual([]);
    expect(skickat).toEqual([]);
    expect((await t.lagring.hamtaViaKortId(a.kortId))?.status).toBe("skickad");
  });
});
