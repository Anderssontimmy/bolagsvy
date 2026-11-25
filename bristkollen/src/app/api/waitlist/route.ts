import { brand } from "@/config/brand";
import { skapaBegransare } from "@/lib/vantelista/begransning";
import { hamtaLagring } from "@/lib/vantelista/lagring";
import { valideraVantelista } from "@/lib/vantelista/validering";

const MAX_STORLEK = 4000; // tecken
const tillat = skapaBegransare({ max: 5, fonsterMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "okand";

  if (!tillat(ip)) {
    return Response.json(
      { ok: false, meddelande: "Du har försökt många gånger. Vänta en stund och försök igen." },
      { status: 429 },
    );
  }

  const text = await request.text();
  if (text.length > MAX_STORLEK) {
    return Response.json({ ok: false, meddelande: "För mycket text i formuläret." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, meddelande: "Formuläret kunde inte läsas. Försök igen." }, { status: 400 });
  }

  const resultat = valideraVantelista(body);
  if (!resultat.ok) return Response.json({ ok: false, fel: resultat.fel }, { status: 400 });
  if (resultat.spam) return Response.json({ ok: true });

  try {
    await hamtaLagring().spara({ ...resultat.data, integritetVersion: brand.integritetVersion });
  } catch (fel) {
    // Logga aldrig e-postadressen.
    console.error("Kunde inte spara till väntelistan:", fel instanceof Error ? fel.message : "okänt fel");
    return Response.json(
      { ok: false, meddelande: "Något gick fel hos oss. Försök igen om en stund." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
