/**
 * Körs en gång per dag (Vercel Cron, se vercel.json). Vercel skickar CRON_SECRET som Bearer-token.
 * Raderar obekräftade ärenden vars länk har gått ut och skickar påminnelser och frågor som har blivit dags.
 */
import { brand } from "@/config/brand";
import { hantera } from "@/lib/arende/motor";
import { hamtaTjanster, idagSverige } from "@/lib/arende/tjanst";

export async function GET(request: Request) {
  const t = hamtaTjanster();
  if (t.lage === "av") return new Response(null, { status: 404 });
  if (t.cronHemlighet && request.headers.get("authorization") !== `Bearer ${t.cronHemlighet}`) {
    return new Response(null, { status: 401 });
  }
  const nu = new Date();
  const idag = idagSverige(nu);
  let raderade = 0;
  let behandlade = 0;
  let fel = 0;

  for (const a of await t.lagring.utgangna(nu.toISOString())) {
    try {
      const filer = (await t.lagring.bilagor(a.id)).map((b) => b.sokvag);
      await t.filer.radera(filer);
      await t.lagring.radera(a.id);
      raderade++;
    } catch (e) {
      fel++;
      console.error(`Kunde inte radera ärende ${a.id}:`, e instanceof Error ? e.message : "okänt fel");
    }
  }
  for (const a of await t.lagring.aktiva()) {
    try {
      await hantera(t, a, { typ: "dagligKontroll", idag }, brand.url);
      behandlade++;
    } catch (e) {
      fel++;
      console.error(`Daglig kontroll misslyckades (ärende ${a.id}):`, e instanceof Error ? e.message : "okänt fel");
    }
  }
  return Response.json({ raderade, behandlade, fel });
}
