import { describe, expect, it, vi } from "vitest";
import { avsandare, resendEpost } from "./epost";

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
