import { describe, expect, it } from "vitest";
import { minnesLagring, supabaseLagring, tomtMinne, type Meddelande } from "./lagring";
import { exempelArende } from "./testdata";

const meddelande = (over: Partial<Meddelande> = {}): Meddelande => ({
  id: "m1",
  arendeId: exempelArende().id,
  riktning: "in",
  typ: "hyresvardssvar",
  fran: "hv@x.se",
  till: "arende-abcde23456@svar.halvhyra.se",
  kopia: null,
  amne: "Sv",
  text: "Hej",
  sha256: "s",
  leverantorId: "resend-1",
  aiSammanfattning: null,
  aiKategori: null,
  aiFraga: null,
  skapad: "2026-12-02T10:00:00.000Z",
  ...over,
});

describe("minnesLagring", () => {
  it("sparar, hittar, uppdaterar och raderar", async () => {
    const l = minnesLagring(tomtMinne());
    const a = exempelArende();
    await l.skapa(a);
    expect(await l.hamtaViaBekrafta(a.bekraftaHash)).toEqual(a);
    await l.uppdatera(a.id, { status: "skickad" });
    expect((await l.hamtaViaKortId(a.kortId))?.status).toBe("skickad");
    expect(await l.aktiva()).toHaveLength(1);
    await l.laggTillMeddelande(meddelande());
    await l.radera(a.id);
    expect(await l.hamtaViaKortId(a.kortId)).toBeNull();
    expect(await l.meddelanden(a.id)).toEqual([]);
  });
  it("stoppar dubbletter med samma leverantörs-id", async () => {
    const l = minnesLagring(tomtMinne());
    expect(await l.laggTillMeddelande(meddelande())).toBe("ny");
    expect(await l.laggTillMeddelande(meddelande({ id: "m2" }))).toBe("dubblett");
  });
  it("hittar obekräftade ärenden vars länk har gått ut", async () => {
    const l = minnesLagring(tomtMinne());
    await l.skapa(exempelArende({ bekraftaGiltigTill: "2026-12-02T12:00:00.000Z" }));
    expect(await l.utgangna("2026-12-02T11:00:00.000Z")).toHaveLength(0);
    expect(await l.utgangna("2026-12-02T13:00:00.000Z")).toHaveLength(1);
  });
});

describe("supabaseLagring", () => {
  type Anrop = { url: string; method: string; body: unknown; prefer?: string };
  function falsk(svar: unknown = []) {
    const anrop: Anrop[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => {
      const h = init.headers as Record<string, string>;
      anrop.push({ url, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null, prefer: h.Prefer });
      return new Response(JSON.stringify(svar), { status: 200 });
    }) as unknown as typeof fetch;
    return { anrop, l: supabaseLagring("https://p.supabase.co", "sb_secret", fetchFn) };
  }
  it("sparar ärendet med snake_case", async () => {
    const { anrop, l } = falsk(null);
    await l.skapa(exempelArende());
    expect(anrop[0].url).toBe("https://p.supabase.co/rest/v1/arende");
    expect(anrop[0].body).toMatchObject({ kort_id: "abcde23456", brev_sha256: "brev-sha", inget_svar_meddelat: false });
  });
  it("hämtar via kortId och gör om till camelCase", async () => {
    const { anrop, l } = falsk([{ id: "1", kort_id: "abcde23456", skickad_datum: "2026-12-01" }]);
    const a = await l.hamtaViaKortId("abcde23456");
    expect(anrop[0].url).toBe("https://p.supabase.co/rest/v1/arende?kort_id=eq.abcde23456&select=*&limit=1");
    expect(a).toMatchObject({ kortId: "abcde23456", skickadDatum: "2026-12-01" });
  });
  it("känner igen dubbletter när inget kommer tillbaka", async () => {
    const { anrop, l } = falsk([]);
    expect(await l.laggTillMeddelande(meddelande())).toBe("dubblett");
    expect(anrop[0].url).toContain("/meddelande?on_conflict=leverantor_id");
    expect(anrop[0].prefer).toBe("resolution=ignore-duplicates,return=representation");
  });
  it("uppdaterar med PATCH och kastar vid fel", async () => {
    const { anrop, l } = falsk(null);
    await l.uppdatera("id-1", { status: "besvarad" });
    expect(anrop[0]).toMatchObject({ method: "PATCH", url: "https://p.supabase.co/rest/v1/arende?id=eq.id-1", body: { status: "besvarad" } });
    const trasig = supabaseLagring("https://p.supabase.co", "k", (async () => new Response("", { status: 500 })) as unknown as typeof fetch);
    await expect(trasig.aktiva()).rejects.toThrow(/500/);
  });
});
