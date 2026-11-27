/**
 * Steg 2 av anmälan. Body: { token, skicka? }.
 * - Utan skicka: visar anmälan så att hyresgästen kan granska den.
 * - Med skicka: true: mejlar anmälan till hyresvärden, med kopia och svarsadress till hyresgästen.
 * Skicka kräver ett knapptryck (POST) – e-postprogram som öppnar länkar automatiskt kan inte skicka något.
 */
import { avsandare } from "@/lib/epost";
import { hamtaTjanster, sha256 } from "@/lib/arende/tjanst";
import { skapaBegransare } from "@/lib/vantelista/begransning";

const tillat = skapaBegransare({ max: 30, fonsterMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  const tjanster = hamtaTjanster();
  if (tjanster.lage === "av") {
    return Response.json({ ok: false, meddelande: "Den här tjänsten är inte igång än." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "okand";
  if (!tillat(ip)) {
    return Response.json({ ok: false, meddelande: "Du har försökt många gånger. Försök igen om en stund." }, { status: 429 });
  }

  let body: { token?: unknown; skicka?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, meddelande: "Kunde inte läsa anropet." }, { status: 400 });
  }
  const token = typeof body.token === "string" && /^[\w-]{20,100}$/.test(body.token) ? body.token : null;
  const post = token ? await tjanster.lagring.hamta(sha256(token)) : null;
  if (!post) {
    return Response.json(
      { ok: false, meddelande: "Länken fungerar inte. Kontrollera att du har kopierat hela länken från mejlet." },
      { status: 404 },
    );
  }

  const utgangen = new Date(post.giltigTill).getTime() < Date.now();

  if (body.skicka !== true) {
    return Response.json({
      ok: true,
      status: post.status,
      utgangen: post.status === "vantar" && utgangen,
      hyresvardNamn: post.hyresvardNamn,
      hyresvardEpost: post.hyresvardEpost,
      hyresgastEpost: post.hyresgastEpost,
      amne: post.amne,
      innehall: post.innehall,
      skickad: post.skickad,
      testlage: tjanster.lage === "test",
    });
  }

  if (post.status === "skickad") return Response.json({ ok: true, redanSkickad: true, skickad: post.skickad });
  if (utgangen) {
    return Response.json(
      { ok: false, meddelande: "Länken har gått ut. Fyll i formuläret igen så får du en ny länk." },
      { status: 410 },
    );
  }

  const skickad = new Date().toISOString();
  try {
    let leverantorId = "testlage";
    if (tjanster.lage === "skarp") {
      const svar = await tjanster.epost.skicka({
        fran: avsandare(post.hyresgastNamn, tjanster.fran),
        till: [post.hyresvardEpost],
        kopia: [post.hyresgastEpost],
        svarTill: [post.hyresgastEpost],
        amne: post.amne,
        text: post.innehall,
        idempotensnyckel: `anmalan-${post.id}`,
      });
      leverantorId = svar.id;
    }
    await tjanster.lagring.markeraSkickad(post.id, skickad, leverantorId);
  } catch (fel) {
    console.error("Kunde inte skicka anmälan:", fel instanceof Error ? fel.message : "okänt fel");
    return Response.json(
      { ok: false, meddelande: "Anmälan kunde inte skickas just nu. Försök igen om en stund." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, skickad, kvitto: post.id, testlage: tjanster.lage === "test" });
}
