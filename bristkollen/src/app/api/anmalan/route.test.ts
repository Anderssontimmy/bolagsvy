import { afterEach, describe, expect, it, vi } from "vitest";
import { ANMALAN } from "@/lib/anmalan/testdata";
import { POST as bekrafta } from "./bekrafta/route";
import { POST as skapa } from "./route";

let ip = 0;
function anrop(handler: (r: Request) => Promise<Response>, body: unknown) {
  return handler(
    new Request("http://localhost:3000/api/anmalan", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.1.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );
}

/** Skapar en anmälan i testläge och returnerar token från bekräftelselänken. */
async function skapaAnmalan() {
  const svar = await anrop(skapa, { ...ANMALAN, uppdrag: true });
  expect(svar.status).toBe(200);
  const json = await svar.json();
  expect(json.testlank).toMatch(/^http:\/\/localhost:3000\/anmal\/bekrafta#/);
  return json.testlank.split("#")[1] as string;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("anmälan till hyresvärden (testläge)", () => {
  it("visar anmälan och skickar den bara när hyresgästen bekräftar", async () => {
    const token = await skapaAnmalan();

    const visa = await (await anrop(bekrafta, { token })).json();
    expect(visa).toMatchObject({
      status: "vantar",
      hyresvardEpost: ANMALAN.hyresvardEpost,
      hyresgastEpost: ANMALAN.epost,
    });
    expect(visa.innehall).toContain("Hyresgäst: Anna Andersson");

    const skickad = await (await anrop(bekrafta, { token, skicka: true })).json();
    expect(skickad).toMatchObject({ ok: true, testlage: true });
    expect(skickad.skickad).toBeTruthy();

    const igen = await (await anrop(bekrafta, { token, skicka: true })).json();
    expect(igen).toMatchObject({ ok: true, redanSkickad: true, skickad: skickad.skickad });
  });

  it("svarar 400 med fel per fält vid ogiltiga uppgifter", async () => {
    const svar = await anrop(skapa, { ...ANMALAN, epost: "nej", uppdrag: false });
    expect(svar.status).toBe(400);
    expect(Object.keys((await svar.json()).fel).sort()).toEqual(["epost", "uppdrag"]);
  });

  it("svarar 404 på en okänd länk", async () => {
    expect((await anrop(bekrafta, { token: "x".repeat(43) })).status).toBe(404);
  });

  it("skickar inte när länken har gått ut", async () => {
    const token = await skapaAnmalan();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    expect((await anrop(bekrafta, { token, skicka: true })).status).toBe(410);
  });

  it("är avstängd i produktion när e-post och databas inte är inställda", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await anrop(skapa, { ...ANMALAN, uppdrag: true })).status).toBe(503);
    expect((await anrop(bekrafta, { token: "x".repeat(43) })).status).toBe(503);
  });
});
