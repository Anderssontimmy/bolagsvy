/** Steg 2: kunden öppnar länken i mejlet, ser anmälan och trycker Skicka. Först då går den till hyresvärden. */
import { avstangd, basAdress, fel, forManga, ipFran, lasJson, olasligt } from "@/lib/arende/http";
import { hantera, sidaLank } from "@/lib/arende/motor";
import { hamtaTjanster, idagSverige, sha256 } from "@/lib/arende/tjanst";
import { skapaBegransare } from "@/lib/vantelista/begransning";

const tillat = skapaBegransare({ max: 30, fonsterMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  const t = hamtaTjanster();
  if (t.lage === "av") return avstangd();
  if (!tillat(ipFran(request))) return forManga();
  const body = await lasJson(request, 2000);
  if (!body || typeof body.token !== "string") return olasligt();

  const a = await t.lagring.hamtaViaBekrafta(sha256(body.token));
  if (!a) return fel("Länken är fel eller har gått ut. Fyll i formuläret igen.", 404);
  const bas = basAdress(t, request);
  const lank = sidaLank(t, a, bas);
  const utgangen = a.status === "vantar_bekraftelse" && Date.parse(a.bekraftaGiltigTill) < Date.now();

  if (body.skicka !== true) {
    const bilagor = (await t.lagring.bilagor(a.id)).filter((b) => b.kalla === "kund").map((b) => b.filnamn);
    return Response.json({
      status: a.status,
      utgangen,
      hyresvardNamn: a.hyresvardNamn,
      hyresvardEpost: a.hyresvardEpost,
      kundEpost: a.kundEpost,
      amne: a.amne,
      brevtext: a.brevtext,
      bilagor,
      skickad: a.skickad,
      sidaLank: a.status === "vantar_bekraftelse" ? null : lank,
      testlage: t.lage === "test",
    });
  }

  if (a.status !== "vantar_bekraftelse") return Response.json({ redanSkickad: true, skickad: a.skickad, sidaLank: lank });
  if (utgangen) return fel("Länken har gått ut. Fyll i formuläret igen så får du en ny länk.", 410);
  try {
    const efter = await hantera(t, a, { typ: "bekraftad", nu: new Date().toISOString(), idag: idagSverige() }, bas);
    return Response.json({ skickad: efter?.skickad ?? null, sidaLank: lank, testlage: t.lage === "test" });
  } catch (e) {
    console.error(`Anmälan kunde inte skickas (ärende ${a.id}):`, e instanceof Error ? e.message : "okänt fel");
    return fel("Anmälan kunde inte skickas just nu. Försök igen om en stund.", 502);
  }
}
