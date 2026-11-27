/**
 * Resend skickar hit varje mejl till svar-domänen (händelsen email.received, bara metadata).
 * Vi kontrollerar signaturen, hittar ärendet via adressen, hämtar mejlet och låter motorn ta hand om det.
 */
import { brand } from "@/config/brand";
import { arFranHyresvard, hittaKortId, textFranMejl, verifieraSignatur } from "@/lib/arende/inkommande";
import { taEmotSvar } from "@/lib/arende/motor";
import { hamtaTjanster } from "@/lib/arende/tjanst";
import type { Mottagning } from "@/lib/epost";

const MAX_BILAGA = 10 * 1024 * 1024;
const ok = () => new Response(null, { status: 200 });

export async function POST(request: Request) {
  const t = hamtaTjanster();
  if (t.lage !== "skarp" || !t.mottagning || !t.webhookHemlighet) return new Response(null, { status: 404 });
  const body = await request.text();
  const giltig = verifieraSignatur({
    body,
    id: request.headers.get("svix-id"),
    tidsstampel: request.headers.get("svix-timestamp"),
    signatur: request.headers.get("svix-signature"),
    hemlighet: t.webhookHemlighet,
    nuSekunder: Math.floor(Date.now() / 1000),
  });
  if (!giltig) return new Response(null, { status: 401 });

  let handelse: { type?: string; data?: { email_id?: string; to?: string[]; cc?: string[]; received_for?: string[] } };
  try {
    handelse = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (handelse.type !== "email.received" || !handelse.data?.email_id) return ok();
  const d = handelse.data;
  const kortId = hittaKortId([...(d.to ?? []), ...(d.cc ?? []), ...(d.received_for ?? [])], t.svarDoman);
  if (!kortId) return ok();
  const a = await t.lagring.hamtaViaKortId(kortId);
  if (!a) return ok();

  try {
    const mejl = await t.mottagning.hamtaMejl(d.email_id as string);
    const franHyresvard = arFranHyresvard(mejl.fran, a.hyresvardEpost, mejl.autentisering);
    const bilagor = franHyresvard ? await hamtaBilagor(t.mottagning, mejl.id) : [];
    await taEmotSvar(
      t,
      a,
      { leverantorId: mejl.id, fran: mejl.fran, amne: mejl.amne.slice(0, 300), text: textFranMejl(mejl), bilagor, franHyresvard },
      brand.url,
    );
    return ok();
  } catch (e) {
    // 500 gör att Resend försöker igen. Dubbletter stoppas av leverantörens id.
    console.error(`Inkommande mejl kunde inte hanteras (ärende ${a.id}):`, e instanceof Error ? e.message : "okänt fel");
    return new Response(null, { status: 500 });
  }
}

async function hamtaBilagor(m: Mottagning, emailId: string) {
  const lista = (await m.hamtaBilagor(emailId)).filter((b) => b.storlek <= MAX_BILAGA && b.nedladdning).slice(0, 5);
  return Promise.all(lista.map(async (b) => ({ filnamn: b.filnamn, typ: b.typ, data: await m.laddaNer(b.nedladdning) })));
}
