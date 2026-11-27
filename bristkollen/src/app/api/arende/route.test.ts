import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RESERV_TOLKNING } from "@/lib/ai/typer";
import { ANMALAN } from "@/lib/arende/testdata";
import { idagSverige } from "@/lib/arende/tjanst";
import { POST as bekrafta } from "./bekrafta/route";
import { POST as skapa } from "./route";
import { POST as sida } from "./sida/route";
import { POST as simulera } from "./simulera/route";
import { POST as utkast } from "./utkast/route";

let ip = 0;
const nastaIp = () => `10.2.${Math.floor(++ip / 250)}.${ip % 250}`;
function json(handler: (r: Request) => Promise<Response>, body: unknown) {
  return handler(
    new Request("http://localhost:3000/api/arende/x", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": nastaIp() },
      body: JSON.stringify(body),
    }),
  );
}
const jpeg = async () => new Blob([new Uint8Array(await sharp({ create: { width: 20, height: 20, channels: 3, background: "#999" } }).jpeg().toBuffer())], { type: "image/jpeg" });
function skapaMed(data: Record<string, unknown>, foton: Blob[] = []) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  foton.forEach((f, i) => form.append("foto", f, `foto-${i + 1}.jpg`));
  return skapa(new Request("http://localhost:3000/api/arende", { method: "POST", headers: { "x-forwarded-for": nastaIp() }, body: form }));
}
async function nyttArende(foton: Blob[] = []) {
  const svar = await skapaMed({ ...ANMALAN, uppdrag: true, beskrivningKund: ANMALAN.beskrivning }, foton);
  expect(svar.status).toBe(200);
  const { testlank } = (await svar.json()) as { testlank: string };
  expect(testlank).toMatch(/^http:\/\/localhost:3000\/anmal\/bekrafta#/);
  return testlank.split("#")[1];
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("ärende i testläge", () => {
  it("hela vägen: skapa, bekräfta, svar, kundens svar och avslut", async () => {
    const token = await nyttArende([await jpeg()]);
    const visa = await (await json(bekrafta, { token })).json();
    expect(visa).toMatchObject({ status: "vantar_bekraftelse", utgangen: false, hyresvardEpost: ANMALAN.hyresvardEpost, kundEpost: ANMALAN.epost, bilagor: ["foto-1.jpg"], testlage: true });
    expect(visa.brevtext).toContain("Svara på det här mejlet");

    const skickad = await (await json(bekrafta, { token, skicka: true })).json();
    expect(skickad.sidaLank).toMatch(/^http:\/\/localhost:3000\/arende#[a-z0-9]{10}\./);
    expect((await (await json(bekrafta, { token, skicka: true })).json()).redanSkickad).toBe(true);
    const sidtoken = skickad.sidaLank.split("#")[1];

    let vy = await (await json(sida, { token: sidtoken })).json();
    expect(vy.status).toBe("skickad");
    expect(vy.meddelanden.map((m: { typ: string }) => m.typ)).toEqual(["anmalan"]);
    expect(vy.bilagor[0].lank).toMatch(/^data:image\/jpeg;base64,/);

    expect((await json(simulera, { token: sidtoken, text: "Vi kommer på torsdag. Är du hemma?" })).status).toBe(200);
    vy = await (await json(sida, { token: sidtoken })).json();
    expect(vy.status).toBe("besvarad");
    expect(vy.meddelanden.at(-1)).toMatchObject({ typ: "hyresvardssvar", aiSammanfattning: RESERV_TOLKNING.sammanfattning });

    const svarat = await json(sida, { token: sidtoken, handling: "svara", text: "Ja, mellan 8 och 12." });
    expect(svarat.status).toBe(200);
    expect((await svarat.json()).meddelanden.at(-1).typ).toBe("kundsvar");

    const avslut = await (await json(sida, { token: sidtoken, handling: "atgardad", datum: idagSverige(), manadshyra: "9000" })).json();
    expect(avslut.status).toBe("atgardad");
    expect((await json(sida, { token: sidtoken, handling: "svara", text: "Hej igen" })).status).toBe(409);
  });

  it("visar fel för ofullständiga uppgifter", async () => {
    const svar = await skapaMed({ ...ANMALAN, namn: "", uppdrag: true });
    expect(svar.status).toBe(400);
    expect((await svar.json()).fel.namn).toBeTruthy();
  });

  it("stoppar för många foton och sådant som inte är bilder", async () => {
    const bild = await jpeg();
    expect((await (await skapaMed({ ...ANMALAN, uppdrag: true }, Array(6).fill(bild))).json()).fel.foto).toMatch(/högst 5/);
    const falsk = new Blob(["inte en bild"], { type: "image/jpeg" });
    expect((await (await skapaMed({ ...ANMALAN, uppdrag: true }, [falsk])).json()).fel.foto).toMatch(/kunde inte läsas/);
  });

  it("ger 404 för okänd token och 410 för gammal bekräftelselänk", async () => {
    expect((await json(bekrafta, { token: "finns-inte" })).status).toBe(404);
    expect((await json(sida, { token: "abcde23456.fel" })).status).toBe(404);
    const token = await nyttArende();
    vi.useFakeTimers({ now: Date.now() + 25 * 60 * 60 * 1000, toFake: ["Date"] });
    expect((await json(bekrafta, { token })).status).toBe(200);
    expect((await json(bekrafta, { token, skicka: true })).status).toBe(410);
  });

  it("utkast ger tillbaka texten (reserv utan AI-nyckel) och stoppar fel", async () => {
    const svar = await (await json(utkast, { brist: "kyla", beskrivning: ANMALAN.beskrivning, temperatur: 16.5 })).json();
    expect(svar).toEqual({ ok: true, text: ANMALAN.beskrivning, ai: false });
    expect((await json(utkast, { brist: "kyla", beskrivning: "kort" })).status).toBe(400);
  });
});

describe("avstängd i drift utan nycklar", () => {
  it("svarar 503 och simulering finns inte", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await skapaMed({ ...ANMALAN, uppdrag: true })).status).toBe(503);
    expect((await json(utkast, { brist: "kyla", beskrivning: ANMALAN.beskrivning })).status).toBe(503);
    expect((await json(simulera, { token: "x" })).status).toBe(404);
  });
});
