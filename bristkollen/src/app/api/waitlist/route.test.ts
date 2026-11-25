import { describe, expect, it } from "vitest";
import { POST } from "./route";

let ipRaknare = 0;
function anrop(body: unknown, ip = `10.0.0.${++ipRaknare}`) {
  return POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/waitlist", () => {
  it("tar emot en giltig anmälan", async () => {
    const svar = await anrop({ epost: "a@b.se", samtycke: true });
    expect(svar.status).toBe(200);
    expect(await svar.json()).toEqual({ ok: true });
  });

  it("svarar 400 med fel per fält vid ogiltiga uppgifter", async () => {
    const svar = await anrop({ epost: "inte-en-adress" });
    expect(svar.status).toBe(400);
    const json = await svar.json();
    expect(json.fel.epost).toBeDefined();
    expect(json.fel.samtycke).toBeDefined();
  });

  it("svarar 400 på trasig JSON", async () => {
    expect((await anrop("{inte json")).status).toBe(400);
  });

  it("svarar 413 på för stora anrop", async () => {
    expect((await anrop({ epost: "a@b.se", samtycke: true, fyll: "x".repeat(5000) })).status).toBe(413);
  });

  it("låtsas lyckas när honeypot-fältet är ifyllt", async () => {
    const svar = await anrop({ epost: "a@b.se", samtycke: true, webbplats: "spam" });
    expect(svar.status).toBe(200);
  });

  it("begränsar antalet anrop från samma adress", async () => {
    const statusar: number[] = [];
    for (let i = 0; i < 6; i++) statusar.push((await anrop({ epost: `x${i}@b.se`, samtycke: true }, "10.9.9.9")).status);
    expect(statusar).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
