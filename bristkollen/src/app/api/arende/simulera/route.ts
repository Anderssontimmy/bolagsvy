/** Bara i testläge: låtsas att hyresvärden svarar, så att hela flödet går att prova lokalt. */
import { randomUUID } from "node:crypto";
import { basAdress, fel, lasJson, olasligt } from "@/lib/arende/http";
import { taEmotSvar } from "@/lib/arende/motor";
import { hamtaTjanster, lasSidaToken } from "@/lib/arende/tjanst";

const STANDARDSVAR = "Hej! Tack för anmälan. Vi skickar en tekniker på torsdag. Kan du vara hemma mellan 8 och 12?";

export async function POST(request: Request) {
  const t = hamtaTjanster();
  if (t.lage !== "test") return new Response(null, { status: 404 });
  const body = await lasJson(request, 10_000);
  if (!body || typeof body.token !== "string") return olasligt();
  const kortId = lasSidaToken(body.token, t.lankHemlighet);
  const a = kortId ? await t.lagring.hamtaViaKortId(kortId) : null;
  if (!a) return fel("Ärendet hittades inte.", 404);
  const text = typeof body.text === "string" && body.text.trim() ? body.text.trim().slice(0, 4000) : STANDARDSVAR;
  await taEmotSvar(
    t,
    a,
    { leverantorId: `simulerad-${randomUUID()}`, fran: a.hyresvardEpost, amne: `Sv: ${a.amne}`, text, bilagor: [], franHyresvard: true },
    basAdress(t, request),
  );
  return Response.json({ ok: true });
}
