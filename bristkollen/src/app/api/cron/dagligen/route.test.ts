import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as bekrafta } from "@/app/api/arende/bekrafta/route";
import { POST as skapa } from "@/app/api/arende/route";
import { POST as sida } from "@/app/api/arende/sida/route";
import { ANMALAN } from "@/lib/arende/testdata";
import { GET } from "./route";

let ip = 0;
const post = (handler: (r: Request) => Promise<Response>, body: unknown) =>
  handler(new Request("http://localhost:3000/x", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++ip}` }, body: JSON.stringify(body) }));
async function nytt() {
  const form = new FormData();
  form.set("data", JSON.stringify({ ...ANMALAN, uppdrag: true }));
  const svar = await skapa(new Request("http://localhost:3000/api/arende", { method: "POST", headers: { "x-forwarded-for": `10.9.1.${++ip}` }, body: form }));
  return ((await svar.json()) as { testlank: string }).testlank.split("#")[1];
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("daglig körning (testläge)", () => {
  it("skickar påminnelse efter 7 dagar och raderar obekräftade ärenden", async () => {
    const skickas = await nytt();
    const { sidaLank } = await (await post(bekrafta, { token: skickas, skicka: true })).json();
    const obekraftad = await nytt();

    vi.useFakeTimers({ now: Date.now() + 8 * 24 * 60 * 60 * 1000, toFake: ["Date"] });
    const svar = await GET(new Request("http://localhost:3000/api/cron/dagligen"));
    expect(svar.status).toBe(200);
    expect(await svar.json()).toMatchObject({ fel: 0 });

    const vy = await (await post(sida, { token: sidaLank.split("#")[1] })).json();
    expect(vy.meddelanden.map((m: { typ: string }) => m.typ)).toEqual(["anmalan", "paminnelse"]);
    expect((await post(bekrafta, { token: obekraftad })).status).toBe(404);
  });
  it("kräver hemligheten i skarpt läge", async () => {
    for (const [k, v] of Object.entries({ RESEND_API_KEY: "r", UTSKICK_FRAN: "a@b.se", SUPABASE_URL: "https://p", SUPABASE_SECRET_KEY: "s", SVAR_DOMAN: "s.b.se", RESEND_WEBHOOK_SECRET: "whsec_x", CRON_SECRET: "hemlig", LANK_HEMLIGHET: "l" })) {
      vi.stubEnv(k, v);
    }
    expect((await GET(new Request("http://localhost/api/cron/dagligen"))).status).toBe(401);
  });
});
