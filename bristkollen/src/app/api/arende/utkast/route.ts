/** AI skriver om kundens beskrivning till saklig text. Kunden kan ändra den innan något sparas. */
import { arBristId, BRISTTYPER } from "@/data/procentsatser";
import { avstangd, fel, forManga, ipFran, lasJson, olasligt } from "@/lib/arende/http";
import { hamtaTjanster } from "@/lib/arende/tjanst";
import { skapaBegransare } from "@/lib/vantelista/begransning";

const tillat = skapaBegransare({ max: 10, fonsterMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  const t = hamtaTjanster();
  if (t.lage === "av") return avstangd();
  if (!tillat(ipFran(request))) return forManga();
  const body = await lasJson(request, 6000);
  if (!body) return olasligt();
  const { brist, beskrivning, temperatur } = body;
  if (typeof brist !== "string" || !arBristId(brist)) return fel("Välj vilken typ av brist du har.", 400);
  const text = typeof beskrivning === "string" ? beskrivning.trim() : "";
  if (text.length < 10 || text.length > 2000) return fel("Beskrivningen ska vara 10–2 000 tecken.", 400);
  const temp = typeof temperatur === "number" && Number.isFinite(temperatur) ? temperatur : null;
  const namn = BRISTTYPER.find((b) => b.id === brist)?.namn ?? brist;
  const omskriven = await t.ai.skrivOmBeskrivning({ brist: namn, beskrivning: text, temperatur: temp });
  return Response.json({ ok: true, text: omskriven, ai: omskriven !== text });
}
