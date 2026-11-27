import { describe, expect, it, vi } from "vitest";
import { avsandare, resendEpost, resendMottagning } from "./epost";

describe("resendEpost", () => {
  it("skickar ett textmejl med kopia, svarsadress och idempotensnyckel", async () => {
    const fetchFn = vi.fn(async () => Response.json({ id: "abc-123" }));
    const svar = await resendEpost("re_nyckel", fetchFn).skicka({
      fran: '"Anna via Halvhyra.se" <anmalan@halvhyra.se>',
      till: ["hyresvard@exempel.se"],
      kopia: ["anna@exempel.se"],
      svarTill: ["anna@exempel.se"],
      amne: "Ämne",
      text: "Text",
      idempotensnyckel: "anmalan-1",
    });

    expect(svar).toEqual({ id: "abc-123" });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_nyckel", "Idempotency-Key": "anmalan-1" });
    expect(JSON.parse(String(init.body))).toEqual({
      from: '"Anna via Halvhyra.se" <anmalan@halvhyra.se>',
      to: ["hyresvard@exempel.se"],
      cc: ["anna@exempel.se"],
      reply_to: ["anna@exempel.se"],
      subject: "Ämne",
      text: "Text",
    });
  });

  it("kastar ett fel när Resend svarar med fel", async () => {
    const fetchFn = vi.fn(async () => new Response("nej", { status: 422 }));
    await expect(
      resendEpost("k", fetchFn).skicka({ fran: "a@b.se", till: ["c@d.se"], amne: "x", text: "y", idempotensnyckel: "1" }),
    ).rejects.toThrow("422");
  });
});

describe("avsandare", () => {
  it("visar hyresgästens namn via tjänsten men skickar från vår adress", () => {
    expect(avsandare("Anna Andersson", "Halvhyra.se <anmalan@halvhyra.se>")).toBe(
      '"Anna Andersson via Halvhyra.se" <anmalan@halvhyra.se>',
    );
    expect(avsandare('An"na <x>', "anmalan@halvhyra.se")).toBe('"Anna x via Halvhyra.se" <anmalan@halvhyra.se>');
  });
});

it("skickar bilagor som base64", async () => {
  let body: Record<string, unknown> = {};
  const fetchFn = (async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ id: "e1" }), { status: 200 });
  }) as unknown as typeof fetch;
  await resendEpost("re_x", fetchFn).skicka({
    fran: "a@b.se",
    till: ["c@d.se"],
    amne: "Ä",
    text: "T",
    idempotensnyckel: "k",
    bilagor: [{ filnamn: "foto-1.jpg", innehall: Buffer.from("abc") }],
  });
  expect(body.attachments).toEqual([{ filename: "foto-1.jpg", content: "YWJj" }]);
});

describe("mottagning", () => {
  const svar = (json: unknown, status = 200) => new Response(JSON.stringify(json), { status });
  it("hämtar ett mottaget mejl", async () => {
    const anrop: string[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => {
      anrop.push(`${url} ${(init.headers as Record<string, string>).Authorization}`);
      return svar({
        id: "m1",
        from: "hv@x.se",
        to: ["arende-abcde23456@svar.halvhyra.se"],
        cc: [],
        received_for: [],
        subject: "Sv: Anmälan",
        text: "Hej",
        html: null,
        authentication: { spf: "pass", dkim: "pass", dmarc: "pass" },
      });
    }) as unknown as typeof fetch;
    const m = await resendMottagning("re_x", fetchFn).hamtaMejl("m1");
    expect(anrop).toEqual(["https://api.resend.com/emails/receiving/m1 Bearer re_x"]);
    expect(m).toMatchObject({ id: "m1", fran: "hv@x.se", amne: "Sv: Anmälan", text: "Hej", autentisering: { dmarc: "pass" } });
  });
  it("listar bilagor och kastar fel vid felstatus", async () => {
    const fetchFn = (async (url: string) =>
      url.endsWith("/attachments")
        ? svar({ data: [{ filename: "a.pdf", content_type: "application/pdf", size: 10, download_url: "https://cdn/a" }] })
        : svar({}, 500)) as unknown as typeof fetch;
    const m = resendMottagning("re_x", fetchFn);
    expect(await m.hamtaBilagor("m1")).toEqual([{ filnamn: "a.pdf", typ: "application/pdf", storlek: 10, nedladdning: "https://cdn/a" }]);
    await expect(m.hamtaMejl("m1")).rejects.toThrow(/500/);
  });
});
