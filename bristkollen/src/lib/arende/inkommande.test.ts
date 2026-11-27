import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { arFranHyresvard, hittaKortId, textFranMejl, verifieraSignatur } from "./inkommande";

const HEMLIGHET_RA = Buffer.from("testhemlighet-32-tecken-lang-xx!");
const HEMLIGHET = `whsec_${HEMLIGHET_RA.toString("base64")}`;
const signera = (id: string, ts: string, body: string) =>
  `v1,${createHmac("sha256", HEMLIGHET_RA).update(`${id}.${ts}.${body}`).digest("base64")}`;

describe("webhook-signatur", () => {
  const body = '{"type":"email.received"}';
  const ts = "1764000000";
  const bas = { body, id: "msg_1", tidsstampel: ts, hemlighet: HEMLIGHET, nuSekunder: 1764000100 };
  it("godtar rätt signatur", () => {
    expect(verifieraSignatur({ ...bas, signatur: signera("msg_1", ts, body) })).toBe(true);
  });
  it("godtar när en av flera signaturer stämmer", () => {
    expect(verifieraSignatur({ ...bas, signatur: `v1,fel ${signera("msg_1", ts, body)}` })).toBe(true);
  });
  it("stoppar ändrad body, fel hemlighet, saknade huvuden och gammal tidsstämpel", () => {
    expect(verifieraSignatur({ ...bas, body: '{"type":"x"}', signatur: signera("msg_1", ts, body) })).toBe(false);
    expect(verifieraSignatur({ ...bas, hemlighet: "whsec_aGVq", signatur: signera("msg_1", ts, body) })).toBe(false);
    expect(verifieraSignatur({ ...bas, signatur: null })).toBe(false);
    expect(verifieraSignatur({ ...bas, nuSekunder: 1764000000 + 301, signatur: signera("msg_1", ts, body) })).toBe(false);
  });
});

describe("hitta ärendet", () => {
  it("hittar kortId i to, cc eller received_for", () => {
    expect(hittaKortId(["annan@x.se", "Arende-abcde23456@svar.halvhyra.se"], "svar.halvhyra.se")).toBe("abcde23456");
    expect(hittaKortId(["Anna <arende-abcde23456@svar.halvhyra.se>"], "svar.halvhyra.se")).toBe("abcde23456");
  });
  it("ignorerar andra domäner och fel format", () => {
    expect(hittaKortId(["arende-abcde23456@svar.annan.se"], "svar.halvhyra.se")).toBeNull();
    expect(hittaKortId(["arende-kort@svar.halvhyra.se"], "svar.halvhyra.se")).toBeNull();
  });
});

describe("avsändaren", () => {
  const hv = "felanmalan@exempelbostader.se";
  it("godtar hyresvärdens adress och samma domän", () => {
    expect(arFranHyresvard("FELANMALAN@exempelbostader.se", hv, null)).toBe(true);
    expect(arFranHyresvard("forvaltare@exempelbostader.se", hv, { spf: "pass", dkim: "pass", dmarc: "pass" })).toBe(true);
  });
  it("godtar bara exakt adress på gratisdomäner", () => {
    expect(arFranHyresvard("nagon@gmail.com", "hyresvard@gmail.com", null)).toBe(false);
    expect(arFranHyresvard("hyresvard@gmail.com", "hyresvard@gmail.com", null)).toBe(true);
  });
  it("stoppar andra domäner och förfalskad avsändare", () => {
    expect(arFranHyresvard("bedragare@annan.se", hv, null)).toBe(false);
    expect(arFranHyresvard(hv, hv, { spf: "fail", dkim: "pass", dmarc: "fail" })).toBe(false);
    expect(arFranHyresvard(hv, hv, { spf: "fail", dkim: "fail", dmarc: "gray" })).toBe(false);
  });
});

describe("text ur mejlet", () => {
  it("använder text om den finns", () => {
    expect(textFranMejl({ text: "Hej!\r\nVi kommer.", html: "<p>x</p>" })).toBe("Hej!\nVi kommer.");
  });
  it("gör om html till text", () => {
    expect(
      textFranMejl({ text: null, html: "<p>Hej!</p><p>Vi kommer&nbsp;på torsdag &amp; fredag.<br>/Anna</p><style>p{}</style>" }),
    ).toBe("Hej!\n\nVi kommer på torsdag & fredag.\n/Anna");
  });
});
