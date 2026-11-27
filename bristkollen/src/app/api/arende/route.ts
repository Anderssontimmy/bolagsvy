/**
 * Steg 1: spara ärendet med foton och mejla en bekräftelselänk till kunden.
 * Ingenting skickas till hyresvärden förrän kunden har bekräftat (se ./bekrafta).
 */
import { randomUUID } from "node:crypto";
import { skapaBekraftelse, skapaBrev } from "@/lib/arende/brev";
import { behandlaFoto, valideraFoton } from "@/lib/arende/foto";
import { avstangd, basAdress, fel, forManga, ipFran, olasligt } from "@/lib/arende/http";
import type { Arende } from "@/lib/arende/status";
import { hamtaTjanster, idagSverige, sha256, skapaKortId, skapaToken } from "@/lib/arende/tjanst";
import { UPPDRAG_VERSION, valideraAnmalan } from "@/lib/arende/validering";
import { skapaBegransare } from "@/lib/vantelista/begransning";

const GILTIG_MS = 24 * 60 * 60 * 1000;
const tillat = skapaBegransare({ max: 5, fonsterMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  const t = hamtaTjanster();
  if (t.lage === "av") return avstangd();
  if (!tillat(ipFran(request))) return forManga();
  if (Number(request.headers.get("content-length") ?? 0) > 4_500_000) {
    return fel("Fotona är för stora. Ta bort något foto och försök igen.", 413);
  }

  let form: FormData;
  let body: Record<string, unknown>;
  try {
    form = await request.formData();
    body = JSON.parse(String(form.get("data") ?? "")) as Record<string, unknown>;
  } catch {
    return olasligt();
  }

  const resultat = valideraAnmalan(body, idagSverige());
  if (!resultat.ok) return Response.json({ ok: false, fel: resultat.fel }, { status: 400 });
  if (resultat.spam) return Response.json({ ok: true });
  const d = resultat.data;

  const filer = form.getAll("foto").filter((f): f is File => f instanceof File);
  const fotoFel = valideraFoton(filer);
  if (fotoFel) return Response.json({ ok: false, fel: { foto: fotoFel } }, { status: 400 });
  let foton: { data: Buffer; sha256: string }[];
  try {
    foton = await Promise.all(filer.map(async (f) => behandlaFoto(Buffer.from(await f.arrayBuffer()))));
  } catch {
    return Response.json({ ok: false, fel: { foto: "Ett av fotona kunde inte läsas. Prova ett annat foto." } }, { status: 400 });
  }

  const brev = skapaBrev(d);
  const token = skapaToken();
  const id = randomUUID();
  const nu = Date.now();
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const arende: Arende = {
    id,
    kortId: skapaKortId(),
    status: "vantar_bekraftelse",
    bekraftaHash: sha256(token),
    bekraftaGiltigTill: new Date(nu + GILTIG_MS).toISOString(),
    kundNamn: d.namn,
    kundEpost: d.epost,
    kundTelefon: d.telefon,
    gatuadress: d.gatuadress,
    postnummer: d.postnummer,
    ort: d.ort,
    lagenhetsnummer: d.lagenhetsnummer,
    hyresvardNamn: d.hyresvardNamn,
    hyresvardEpost: d.hyresvardEpost,
    brist: d.brist,
    temperatur: d.temperatur,
    sedan: d.sedan,
    beskrivningKund: text(body.beskrivningKund, 2000) ?? d.beskrivning,
    beskrivningAi: text(body.beskrivningAi, 2000),
    amne: brev.amne,
    brevtext: brev.text,
    brevSha256: sha256(`${brev.amne}\n\n${brev.text}`),
    uppdragVersion: UPPDRAG_VERSION,
    skapad: new Date(nu).toISOString(),
    skickad: null,
    skickadDatum: null,
    paminnelser: 0,
    nastaPaminnelse: null,
    ingetSvarMeddelat: false,
    kundfragor: 0,
    atgardad: null,
    manadshyra: null,
  };
  const lank = `${basAdress(t, request)}/anmal/bekrafta#${token}`;

  try {
    await t.lagring.skapa(arende);
    for (const [i, foto] of foton.entries()) {
      const filnamn = `foto-${i + 1}.jpg`;
      const sokvag = `${id}/${filnamn}`;
      await t.filer.spara(sokvag, foto.data, "image/jpeg");
      await t.lagring.laggTillBilaga({
        id: randomUUID(),
        arendeId: id,
        meddelandeId: null,
        kalla: "kund",
        filnamn,
        mime: "image/jpeg",
        storlek: foto.data.length,
        sha256: foto.sha256,
        sokvag,
        skapad: new Date(nu).toISOString(),
      });
    }
    if (t.epost) {
      const mejl = skapaBekraftelse(d, brev, lank);
      await t.epost.skicka({ fran: t.fran, till: [d.epost], amne: mejl.amne, text: mejl.text, idempotensnyckel: `bekrafta-${id}` });
    }
  } catch (e) {
    console.error("Kunde inte skapa ärende:", e instanceof Error ? e.message : "okänt fel");
    return fel("Något gick fel hos oss. Försök igen om en stund.", 500);
  }

  // I testläge skickas inget mejl, så länken visas direkt. Aldrig i skarpt läge.
  return Response.json({ ok: true, ...(t.lage === "test" ? { testlank: lank } : {}) });
}
