/**
 * Steg 1 av anmälan: spara den och mejla en bekräftelselänk till hyresgästen.
 * Ingenting skickas till hyresvärden förrän hyresgästen har bekräftat (se ./bekrafta).
 * Det hindrar att någon skickar anmälningar i någon annans namn.
 */
import { randomUUID } from "node:crypto";
import { brand } from "@/config/brand";
import { skapaBekraftelse, skapaBrev } from "@/lib/arende/brev";
import { hamtaTjanster, idagSverige, sha256, skapaToken } from "@/lib/arende/tjanst";
import { valideraAnmalan } from "@/lib/arende/validering";
import { skapaBegransare } from "@/lib/vantelista/begransning";

const GILTIG_MS = 24 * 60 * 60 * 1000;
const tillat = skapaBegransare({ max: 5, fonsterMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  const tjanster = hamtaTjanster();
  if (tjanster.lage === "av") {
    return Response.json({ ok: false, meddelande: "Den här tjänsten är inte igång än." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "okand";
  if (!tillat(ip)) {
    return Response.json({ ok: false, meddelande: "Du har försökt många gånger. Försök igen om en stund." }, { status: 429 });
  }

  const text = await request.text();
  if (text.length > 10_000) return Response.json({ ok: false, meddelande: "För mycket text." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, meddelande: "Formuläret kunde inte läsas. Försök igen." }, { status: 400 });
  }

  const resultat = valideraAnmalan(body, idagSverige());
  if (!resultat.ok) return Response.json({ ok: false, fel: resultat.fel }, { status: 400 });
  if (resultat.spam) return Response.json({ ok: true });
  const d = resultat.data;

  const brev = skapaBrev(d);
  const token = skapaToken();
  const id = randomUUID();
  const nu = Date.now();
  // Lokalt pekar länken på den egna servern, i drift på sajtens adress.
  const bas = tjanster.lage === "test" ? new URL(request.url).origin : brand.url;
  const lank = `${bas}/anmal/bekrafta#${token}`;

  try {
    await tjanster.lagring.skapa({
      id,
      tokenHash: sha256(token),
      giltigTill: new Date(nu + GILTIG_MS).toISOString(),
      status: "vantar",
      hyresgastNamn: d.namn,
      hyresgastEpost: d.epost,
      hyresvardNamn: d.hyresvardNamn,
      hyresvardEpost: d.hyresvardEpost,
      amne: brev.amne,
      innehall: brev.text,
      innehallSha256: sha256(`${brev.amne}\n\n${brev.text}`),
      skapad: new Date(nu).toISOString(),
      skickad: null,
      leverantorId: null,
    });

    if (tjanster.lage === "skarp") {
      const mejl = skapaBekraftelse(d, brev, lank);
      await tjanster.epost.skicka({
        fran: tjanster.fran,
        till: [d.epost],
        amne: mejl.amne,
        text: mejl.text,
        idempotensnyckel: `bekrafta-${id}`,
      });
    }
  } catch (fel) {
    console.error("Kunde inte skapa anmälan:", fel instanceof Error ? fel.message : "okänt fel");
    return Response.json({ ok: false, meddelande: "Något gick fel hos oss. Försök igen om en stund." }, { status: 500 });
  }

  // I testläge skickas inget mejl, så länken visas direkt. Aldrig i skarpt läge.
  return Response.json({ ok: true, ...(tjanster.lage === "test" ? { testlank: lank } : {}) });
}
