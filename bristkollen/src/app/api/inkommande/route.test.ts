import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const RA = Buffer.from("webhook-hemlighet-for-test-12345");
const SKARP = {
  RESEND_API_KEY: "re_x", UTSKICK_FRAN: "anmalan@halvhyra.se", SUPABASE_URL: "https://p.supabase.co", SUPABASE_SECRET_KEY: "sb",
  SVAR_DOMAN: "svar.halvhyra.se", RESEND_WEBHOOK_SECRET: `whsec_${RA.toString("base64")}`, CRON_SECRET: "cron", LANK_HEMLIGHET: "lank",
};
function signerat(body: string, giltig = true) {
  const id = "msg_1";
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", giltig ? RA : Buffer.from("fel")).update(`${id}.${ts}.${body}`).digest("base64");
  return new Request("http://localhost/api/inkommande", { method: "POST", headers: { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}` }, body });
}

afterEach(() => vi.unstubAllEnvs());

describe("inkommande mejl", () => {
  it("finns inte utanför skarpt läge", async () => {
    expect((await POST(signerat("{}"))).status).toBe(404);
  });
  describe("i skarpt läge", () => {
    const stubba = () => Object.entries(SKARP).forEach(([k, v]) => vi.stubEnv(k, v));
    it("avvisar fel signatur", async () => {
      stubba();
      expect((await POST(signerat('{"type":"email.received"}', false))).status).toBe(401);
    });
    it("svarar 200 utan åtgärd för andra händelser och okända adresser", async () => {
      stubba();
      const fetchSpion = vi.spyOn(globalThis, "fetch");
      expect((await POST(signerat('{"type":"email.sent","data":{}}'))).status).toBe(200);
      expect((await POST(signerat(JSON.stringify({ type: "email.received", data: { email_id: "e1", to: ["hej@halvhyra.se"] } })))).status).toBe(200);
      expect(fetchSpion).not.toHaveBeenCalled();
      fetchSpion.mockRestore();
    });
  });
});
