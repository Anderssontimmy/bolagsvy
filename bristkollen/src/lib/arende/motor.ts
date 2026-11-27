/**
 * Motorn: kör statusmaskinen och utför åtgärderna.
 * Utskick till hyresvärden måste lyckas innan ärendet sparas. Mejl till kunden får misslyckas utan att stoppa ärendet.
 */
import { randomUUID } from "node:crypto";
import { RESERV_TOLKNING } from "@/lib/ai/typer";
import { avsandare } from "@/lib/epost";
import { skapaKundsvar, skapaPaminnelse, type Mejltext } from "./brev";
import { kundMejl, mejlSvar } from "./kundmejl";
import type { Meddelande } from "./lagring";
import { nastaSteg, type Arende, type Atgard, type Handelse } from "./status";
import { idagSverige, sha256, sidaToken, type AktivaTjanster } from "./tjanst";

export const svarAdress = (t: AktivaTjanster, a: Arende) => `arende-${a.kortId}@${t.svarDoman}`;
export const sidaLank = (t: AktivaTjanster, a: Arende, bas: string) => `${bas}/arende#${sidaToken(a.kortId, t.lankHemlighet)}`;

export async function hantera(t: AktivaTjanster, a: Arende, h: Handelse, bas: string): Promise<Arende | null> {
  const steg = nastaSteg(a, h);
  if (!steg) return null;
  const tillHyresvard = steg.atgarder.filter((x) => x.typ.startsWith("skicka"));
  const tillKund = steg.atgarder.filter((x) => x.typ.startsWith("mejla"));

  for (const atgard of tillHyresvard) await skickaTillHyresvard(t, steg.arende, atgard);
  const andring = Object.fromEntries(
    Object.entries(steg.arende).filter(([k, v]) => a[k as keyof Arende] !== v),
  ) as Partial<Arende>;
  if (Object.keys(andring).length > 0) await t.lagring.uppdatera(a.id, andring);

  for (const atgard of tillKund) {
    try {
      await mejlaKund(t, steg.arende, atgard, bas);
    } catch (fel) {
      console.error(`Mejl till kunden misslyckades (ärende ${a.id}):`, fel instanceof Error ? fel.message : "okänt fel");
    }
  }
  return steg.arende;
}

async function skickaTillHyresvard(t: AktivaTjanster, a: Arende, atgard: Atgard) {
  let mejl: Mejltext;
  let typ: Meddelande["typ"];
  let nyckel: string;
  let bilagor: { filnamn: string; innehall: Buffer }[] = [];
  if (atgard.typ === "skickaAnmalan") {
    mejl = { amne: a.amne, text: a.brevtext };
    typ = "anmalan";
    nyckel = `anmalan-${a.id}`;
    const foton = (await t.lagring.bilagor(a.id)).filter((b) => b.kalla === "kund");
    bilagor = await Promise.all(foton.map(async (b) => ({ filnamn: b.filnamn, innehall: await t.filer.hamta(b.sokvag) })));
  } else if (atgard.typ === "skickaPaminnelse") {
    mejl = skapaPaminnelse(a, atgard.nummer);
    typ = "paminnelse";
    nyckel = `paminnelse-${atgard.nummer}-${a.id}`;
  } else if (atgard.typ === "skickaKundsvar") {
    mejl = skapaKundsvar(a, atgard.text);
    typ = "kundsvar";
    // Samma text inom 24 timmar (till exempel ett dubbelklick) skickas bara en gång.
    nyckel = `kundsvar-${a.id}-${sha256(atgard.text).slice(0, 16)}`;
  } else {
    return;
  }

  const fran = avsandare(a.kundNamn, t.fran);
  const leverantorId = t.epost
    ? (
        await t.epost.skicka({
          fran,
          till: [a.hyresvardEpost],
          kopia: [a.kundEpost],
          svarTill: [svarAdress(t, a)],
          amne: mejl.amne,
          text: mejl.text,
          bilagor,
          idempotensnyckel: nyckel,
        })
      ).id
    : `test-${nyckel}`;

  await t.lagring.laggTillMeddelande({
    id: randomUUID(),
    arendeId: a.id,
    riktning: "ut",
    typ,
    fran,
    till: a.hyresvardEpost,
    kopia: a.kundEpost,
    amne: mejl.amne,
    text: mejl.text,
    sha256: sha256(`${mejl.amne}\n\n${mejl.text}`),
    leverantorId,
    aiSammanfattning: null,
    aiKategori: null,
    aiFraga: null,
    skapad: new Date().toISOString(),
  });
}

async function mejlaKund(t: AktivaTjanster, a: Arende, atgard: Atgard, bas: string) {
  if (!t.epost) return; // testläge: inga mejl
  const lank = sidaLank(t, a, bas);
  let mejl: Mejltext;
  let nyckel: string;
  if (atgard.typ === "mejlaKundOmSvar") {
    const m = (await t.lagring.meddelanden(a.id)).find((x) => x.id === atgard.meddelandeId);
    if (!m) return;
    mejl = mejlSvar(
      a,
      {
        sammanfattning: m.aiSammanfattning ?? RESERV_TOLKNING.sammanfattning,
        kategori: m.aiKategori ?? "ovrigt",
        fraga: m.aiFraga ?? "",
      },
      lank,
    );
    nyckel = `kund-svar-${m.id}`;
  } else if (atgard.typ === "mejlaKund") {
    mejl = kundMejl(atgard.mejl, a, lank, idagSverige());
    nyckel = `kund-${atgard.mejl}-${a.id}-${a.kundfragor}`;
  } else {
    return;
  }
  await t.epost.skicka({ fran: t.fran, till: [a.kundEpost], amne: mejl.amne, text: mejl.text, idempotensnyckel: nyckel });
}

export type Inkommande = {
  leverantorId: string;
  fran: string;
  amne: string;
  text: string;
  bilagor: { filnamn: string; typ: string; data: Buffer }[];
  franHyresvard: boolean;
};

const saktFilnamn = (namn: string) => namn.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80) || "fil";

/** Ett mejl till ärendets adress. Bara mejl från hyresvärden tolkas, sparas med bilagor och skickas vidare. */
export async function taEmotSvar(
  t: AktivaTjanster,
  a: Arende,
  in_: Inkommande,
  bas: string,
): Promise<"ny" | "dubblett" | "okand"> {
  const tolkning = in_.franHyresvard ? await t.ai.tolkaSvar({ anmalan: a.brevtext, svar: in_.text }) : null;
  const id = randomUUID();
  const resultat = await t.lagring.laggTillMeddelande({
    id,
    arendeId: a.id,
    riktning: "in",
    typ: in_.franHyresvard ? "hyresvardssvar" : "okand_avsandare",
    fran: in_.fran,
    till: svarAdress(t, a),
    kopia: null,
    amne: in_.amne,
    text: in_.text,
    sha256: sha256(`${in_.amne}\n\n${in_.text}`),
    leverantorId: in_.leverantorId,
    aiSammanfattning: tolkning?.sammanfattning ?? null,
    aiKategori: tolkning?.kategori ?? null,
    aiFraga: tolkning?.fraga ?? null,
    skapad: new Date().toISOString(),
  });
  if (resultat === "dubblett") return "dubblett";
  if (!in_.franHyresvard) return "okand";

  for (const [i, b] of in_.bilagor.entries()) {
    const sokvag = `${a.id}/hv-${id}-${i + 1}-${saktFilnamn(b.filnamn)}`;
    await t.filer.spara(sokvag, b.data, b.typ);
    await t.lagring.laggTillBilaga({
      id: randomUUID(),
      arendeId: a.id,
      meddelandeId: id,
      kalla: "hyresvard",
      filnamn: b.filnamn.slice(0, 200),
      mime: b.typ,
      storlek: b.data.length,
      sha256: sha256(b.data),
      sokvag,
      skapad: new Date().toISOString(),
    });
  }
  await hantera(t, a, { typ: "hyresvardSvarade", meddelandeId: id }, bas);
  return "ny";
}
