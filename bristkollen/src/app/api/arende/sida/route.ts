/** Kundens ärendesida: visa ärendet, svara hyresvärden eller markera bristen som åtgärdad. */
import { avstangd, basAdress, fel, forManga, ipFran, lasJson, olasligt } from "@/lib/arende/http";
import { uppskattningText } from "@/lib/arende/kundmejl";
import { hantera } from "@/lib/arende/motor";
import { hamtaTjanster, idagSverige, lasSidaToken, type AktivaTjanster } from "@/lib/arende/tjanst";
import { valideraAtgardad, valideraKundsvar } from "@/lib/arende/validering";
import { skapaBegransare } from "@/lib/vantelista/begransning";

const tillat = skapaBegransare({ max: 30, fonsterMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  const t = hamtaTjanster();
  if (t.lage === "av") return avstangd();
  if (!tillat(ipFran(request))) return forManga();
  const body = await lasJson(request, 10_000);
  if (!body || typeof body.token !== "string") return olasligt();
  const kortId = lasSidaToken(body.token, t.lankHemlighet);
  const a = kortId ? await t.lagring.hamtaViaKortId(kortId) : null;
  if (!kortId || !a) return fel("Ärendet hittades inte. Öppna länken från mejlet igen.", 404);

  const handling = body.handling ?? "visa";
  const bas = basAdress(t, request);
  try {
    if (handling === "svara") {
      const v = valideraKundsvar(body.text);
      if (!v.ok) return fel(v.fel, 400);
      if (!(await hantera(t, a, { typ: "kundenSvarade", text: v.text }, bas))) return fel("Ärendet är avslutat.", 409);
    } else if (handling === "atgardad") {
      const idag = idagSverige();
      const v = valideraAtgardad(body, a.skickadDatum ?? idag, idag);
      if (!v.ok) return fel(v.fel, 400);
      const efter = await hantera(t, a, { typ: "kundenAtgardad", datum: v.datum, manadshyra: v.manadshyra }, bas);
      if (!efter) return fel("Ärendet är redan avslutat.", 409);
    } else if (handling !== "visa") {
      return olasligt();
    }
  } catch (e) {
    console.error(`Ärendesidan misslyckades (ärende ${a.id}):`, e instanceof Error ? e.message : "okänt fel");
    return fel("Det gick inte att skicka just nu. Försök igen om en stund.", 502);
  }
  return Response.json(await vy(t, kortId));
}

async function vy(t: AktivaTjanster, kortId: string) {
  const a = await t.lagring.hamtaViaKortId(kortId);
  if (!a) throw new Error("Ärendet försvann");
  const meddelanden = await t.lagring.meddelanden(a.id);
  const bilagor = await t.lagring.bilagor(a.id);
  return {
    status: a.status,
    hyresvardNamn: a.hyresvardNamn,
    hyresvardEpost: a.hyresvardEpost,
    kundNamn: a.kundNamn,
    amne: a.amne,
    skickad: a.skickad,
    skickadDatum: a.skickadDatum,
    atgardad: a.atgardad,
    paminnelser: a.paminnelser,
    uppskattning: a.status === "atgardad" ? uppskattningText(a, idagSverige()) : null,
    testlage: t.lage === "test",
    meddelanden: meddelanden.map((m) => ({
      id: m.id,
      riktning: m.riktning,
      typ: m.typ,
      fran: m.fran,
      amne: m.amne,
      text: m.text,
      aiSammanfattning: m.aiSammanfattning,
      aiKategori: m.aiKategori,
      aiFraga: m.aiFraga,
      skapad: m.skapad,
    })),
    bilagor: await Promise.all(
      bilagor.map(async (b) => ({ id: b.id, meddelandeId: b.meddelandeId, kalla: b.kalla, filnamn: b.filnamn, mime: b.mime, lank: await t.filer.lank(b.sokvag) })),
    ),
  };
}
