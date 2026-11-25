import { describe, expect, it, vi } from "vitest";
import { minnesLagring, supabaseLagring, type AnmalanPost } from "./lagring";

const POST: AnmalanPost = {
  id: "11111111-1111-4111-8111-111111111111",
  tokenHash: "hash",
  giltigTill: "2026-11-26T12:00:00.000Z",
  status: "vantar",
  hyresgastNamn: "Anna",
  hyresgastEpost: "anna@exempel.se",
  hyresvardNamn: "Värd AB",
  hyresvardEpost: "varden@exempel.se",
  amne: "Ämne",
  innehall: "Text",
  innehallSha256: "abc",
  skapad: "2026-11-25T12:00:00.000Z",
  skickad: null,
  leverantorId: null,
};

describe("minnesLagring", () => {
  it("sparar, hämtar på token och markerar som skickad", async () => {
    const l = minnesLagring(new Map());
    await l.skapa(POST);
    expect(await l.hamta("hash")).toEqual(POST);
    expect(await l.hamta("annan")).toBeNull();
    await l.markeraSkickad(POST.id, "2026-11-25T13:00:00.000Z", "re_1");
    expect(await l.hamta("hash")).toMatchObject({ status: "skickad", skickad: "2026-11-25T13:00:00.000Z", leverantorId: "re_1" });
  });
});

describe("supabaseLagring", () => {
  const anrop = (fetchFn: ReturnType<typeof vi.fn>, i = 0) => fetchFn.mock.calls[i] as unknown as [string, RequestInit];

  it("sparar med snake_case-kolumner", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 201 }));
    await supabaseLagring("https://x.supabase.co", "k", fetchFn).skapa(POST);
    const [url, init] = anrop(fetchFn);
    expect(url).toBe("https://x.supabase.co/rest/v1/anmalan");
    expect(JSON.parse(String(init.body))).toMatchObject({ token_hash: "hash", hyresvard_epost: "varden@exempel.se" });
  });

  it("hämtar på token-hash och översätter tillbaka", async () => {
    const rad = {
      id: POST.id,
      token_hash: "hash",
      giltig_till: POST.giltigTill,
      status: "vantar",
      hyresgast_namn: "Anna",
      hyresgast_epost: "anna@exempel.se",
      hyresvard_namn: "Värd AB",
      hyresvard_epost: "varden@exempel.se",
      amne: "Ämne",
      innehall: "Text",
      innehall_sha256: "abc",
      skapad: POST.skapad,
      skickad: null,
      leverantor_id: null,
    };
    const fetchFn = vi.fn(async () => Response.json([rad]));
    expect(await supabaseLagring("https://x.supabase.co", "k", fetchFn).hamta("hash")).toEqual(POST);
    expect(anrop(fetchFn)[0]).toBe("https://x.supabase.co/rest/v1/anmalan?token_hash=eq.hash&select=*&limit=1");
  });

  it("uppdaterar bara en anmälan som väntar", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    await supabaseLagring("https://x.supabase.co", "k", fetchFn).markeraSkickad(POST.id, "t", "re_1");
    const [url, init] = anrop(fetchFn);
    expect(url).toBe(`https://x.supabase.co/rest/v1/anmalan?id=eq.${POST.id}&status=eq.vantar`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ status: "skickad", skickad: "t", leverantor_id: "re_1" });
  });
});
