import { describe, expect, it } from "vitest";
import { lasSidaToken, sidaToken, skapaKortId, utskickLage } from "./tjanst";

const SKARP = {
  RESEND_API_KEY: "re", UTSKICK_FRAN: "a@b.se", SUPABASE_URL: "https://x", SUPABASE_SECRET_KEY: "s",
  SVAR_DOMAN: "svar.b.se", RESEND_WEBHOOK_SECRET: "whsec_x", CRON_SECRET: "c", LANK_HEMLIGHET: "l",
};

describe("läge", () => {
  it("är skarpt bara när alla nycklar finns", () => {
    expect(utskickLage(SKARP)).toBe("skarp");
    expect(utskickLage({ ...SKARP, LANK_HEMLIGHET: undefined, NODE_ENV: "production" })).toBe("av");
  });
  it("är test lokalt och med HALVHYRA_TESTLAGE=ja", () => {
    expect(utskickLage({ NODE_ENV: "development" })).toBe("test");
    expect(utskickLage({ NODE_ENV: "production", HALVHYRA_TESTLAGE: "ja" })).toBe("test");
    expect(utskickLage({ NODE_ENV: "production" })).toBe("av");
  });
});

describe("token och kortId", () => {
  it("kortId har 10 tecken utan lättförväxlade tecken", () => {
    for (let i = 0; i < 50; i++) expect(skapaKortId()).toMatch(/^[a-km-np-z2-9]{10}$/);
  });
  it("sidtoken går att läsa med rätt hemlighet men inte ändras", () => {
    const token = sidaToken("abcde23456", "hemlis");
    expect(lasSidaToken(token, "hemlis")).toBe("abcde23456");
    expect(lasSidaToken(token, "annan")).toBeNull();
    expect(lasSidaToken(token.replace("abcde23456", "abcde23457"), "hemlis")).toBeNull();
    expect(lasSidaToken("skräp", "hemlis")).toBeNull();
  });
});
