/**
 * Ärendets logik: vad som händer när något inträffar. Ren funktion – inga anrop och ingen klocka.
 * Anroparen sparar det nya ärendet och utför åtgärderna (se motor.ts).
 */
import type { BristId } from "@/data/procentsatser";

export const PAMINNELSE_EFTER_DAGAR = 7;
/** Dagar efter anmälan då vi frågar kunden om bristen är åtgärdad. */
export const KUNDFRAGA_DAGAR = [14, 30] as const;

export type ArendeStatus = "vantar_bekraftelse" | "skickad" | "besvarad" | "atgardad";

export type Arende = {
  id: string;
  /** Slumpad del av ärendets e-postadress, arende-<kortId>@… Går inte att gissa. */
  kortId: string;
  status: ArendeStatus;
  /** SHA-256 av token i bekräftelselänken. Själva token sparas aldrig. */
  bekraftaHash: string;
  bekraftaGiltigTill: string;
  kundNamn: string;
  kundEpost: string;
  kundTelefon: string | null;
  gatuadress: string;
  postnummer: string;
  ort: string;
  lagenhetsnummer: string;
  hyresvardNamn: string;
  hyresvardEpost: string;
  brist: BristId;
  temperatur: number | null;
  /** ÅÅÅÅ-MM-DD */
  sedan: string;
  beskrivningKund: string;
  beskrivningAi: string | null;
  /** Brevet kunden godkände. Ändras aldrig. */
  amne: string;
  brevtext: string;
  brevSha256: string;
  uppdragVersion: string;
  skapad: string;
  skickad: string | null;
  /** Svensk dag då anmälan skickades, ÅÅÅÅ-MM-DD. */
  skickadDatum: string | null;
  paminnelser: number;
  nastaPaminnelse: string | null;
  ingetSvarMeddelat: boolean;
  kundfragor: number;
  atgardad: string | null;
  manadshyra: number | null;
};

export type KundMejl = "skickad" | "paminnelse1" | "paminnelse2" | "ingetSvar" | "arAtgardad" | "avslutat";

export type Handelse =
  | { typ: "bekraftad"; nu: string; idag: string }
  | { typ: "hyresvardSvarade"; meddelandeId: string }
  | { typ: "kundenSvarade"; text: string }
  | { typ: "kundenAtgardad"; datum: string; manadshyra: number | null }
  | { typ: "dagligKontroll"; idag: string };

export type Atgard =
  | { typ: "skickaAnmalan" }
  | { typ: "skickaPaminnelse"; nummer: 1 | 2 }
  | { typ: "skickaKundsvar"; text: string }
  | { typ: "mejlaKund"; mejl: KundMejl }
  | { typ: "mejlaKundOmSvar"; meddelandeId: string };

export type Steg = { arende: Arende; atgarder: Atgard[] };

const OPPEN: readonly ArendeStatus[] = ["skickad", "besvarad"];

export function plusDagar(datum: string, dagar: number): string {
  const d = new Date(`${datum}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dagar);
  return d.toISOString().slice(0, 10);
}

export function dagarMellan(fran: string, till: string): number {
  return Math.round((Date.parse(`${till}T00:00:00Z`) - Date.parse(`${fran}T00:00:00Z`)) / 86_400_000);
}

/** Null betyder att händelsen inte är tillåten i ärendets läge. */
export function nastaSteg(a: Arende, h: Handelse): Steg | null {
  switch (h.typ) {
    case "bekraftad":
      if (a.status !== "vantar_bekraftelse") return null;
      return {
        arende: {
          ...a,
          status: "skickad",
          skickad: h.nu,
          skickadDatum: h.idag,
          nastaPaminnelse: plusDagar(h.idag, PAMINNELSE_EFTER_DAGAR),
        },
        atgarder: [{ typ: "skickaAnmalan" }, { typ: "mejlaKund", mejl: "skickad" }],
      };
    case "hyresvardSvarade":
      if (a.status === "vantar_bekraftelse") return null;
      return {
        arende: a.status === "atgardad" ? a : { ...a, status: "besvarad", nastaPaminnelse: null },
        atgarder: [{ typ: "mejlaKundOmSvar", meddelandeId: h.meddelandeId }],
      };
    case "kundenSvarade":
      if (!OPPEN.includes(a.status)) return null;
      return { arende: a, atgarder: [{ typ: "skickaKundsvar", text: h.text }] };
    case "kundenAtgardad":
      if (!OPPEN.includes(a.status)) return null;
      return {
        arende: { ...a, status: "atgardad", atgardad: h.datum, manadshyra: h.manadshyra, nastaPaminnelse: null },
        atgarder: [{ typ: "mejlaKund", mejl: "avslutat" }],
      };
    case "dagligKontroll":
      return dagligKontroll(a, h.idag);
  }
}

function dagligKontroll(a: Arende, idag: string): Steg {
  const skickadDatum = a.skickadDatum;
  if (!OPPEN.includes(a.status) || !skickadDatum) return { arende: a, atgarder: [] };
  let arende = a;
  const atgarder: Atgard[] = [];

  if (arende.status === "skickad" && arende.nastaPaminnelse && idag >= arende.nastaPaminnelse) {
    if (arende.paminnelser < 2) {
      const nummer = (arende.paminnelser + 1) as 1 | 2;
      arende = { ...arende, paminnelser: nummer, nastaPaminnelse: plusDagar(idag, PAMINNELSE_EFTER_DAGAR) };
      atgarder.push(
        { typ: "skickaPaminnelse", nummer },
        { typ: "mejlaKund", mejl: nummer === 1 ? "paminnelse1" : "paminnelse2" },
      );
    } else if (!arende.ingetSvarMeddelat) {
      arende = { ...arende, ingetSvarMeddelat: true, nastaPaminnelse: null };
      atgarder.push({ typ: "mejlaKund", mejl: "ingetSvar" });
    }
  }

  const fragaDag = KUNDFRAGA_DAGAR[arende.kundfragor];
  if (fragaDag !== undefined && dagarMellan(skickadDatum, idag) >= fragaDag) {
    arende = { ...arende, kundfragor: arende.kundfragor + 1 };
    atgarder.push({ typ: "mejlaKund", mejl: "arAtgardad" });
  }
  return { arende, atgarder };
}
