import { describe, expect, it, vi } from "vitest";
import { hamtaLagring, minnesLagring, supabaseLagring, type VantelistaPost } from "./lagring";

const POST: VantelistaPost = {
  epost: "a@b.se",
  brist: "kyla",
  postnummer: "12345",
  integritetVersion: "v1",
};

describe("minnesLagring", () => {
  it("sparar varje e-postadress bara en gång", async () => {
    const lagring = minnesLagring(new Map());
    await lagring.spara(POST);
    await lagring.spara({ ...POST, brist: null });
    expect(lagring.antal()).toBe(1);
  });
});

describe("supabaseLagring", () => {
  it("skickar en insert som ignorerar dubbletter till REST-API:et", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 201 }));
    await supabaseLagring("https://xyz.supabase.co/", "hemlig", fetchFn).spara(POST);

    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://xyz.supabase.co/rest/v1/vantelista?on_conflict=epost");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      apikey: "hemlig",
      Authorization: "Bearer hemlig",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      epost: "a@b.se",
      brist: "kyla",
      postnummer: "12345",
      integritet_version: "v1",
    });
  });

  it("kastar ett fel när Supabase svarar med fel", async () => {
    const fetchFn = vi.fn(async () => new Response("nej", { status: 500 }));
    await expect(supabaseLagring("https://xyz.supabase.co", "k", fetchFn).spara(POST)).rejects.toThrow("500");
  });
});

describe("hamtaLagring", () => {
  it("använder Supabase när båda miljövariablerna finns", () => {
    const l = hamtaLagring({ SUPABASE_URL: "https://xyz.supabase.co", SUPABASE_SECRET_KEY: "k" });
    expect(l.namn).toBe("supabase");
  });

  it("använder minnet annars", () => {
    expect(hamtaLagring({}).namn).toBe("minne");
    expect(hamtaLagring({ SUPABASE_URL: "https://xyz.supabase.co" }).namn).toBe("minne");
  });
});
