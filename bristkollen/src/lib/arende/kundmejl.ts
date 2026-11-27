/** Mejlen vi skickar till kunden under ärendet. Alltid med länk till ärendesidan. */
import { brand } from "@/config/brand";
import type { Tolkning } from "@/lib/ai/typer";
import { datumText, kronorSpann, procentSpann, tidText } from "@/lib/format";
import { raknaUt } from "@/lib/kalkylator";
import type { Mejltext } from "./brev";
import type { Arende, KundMejl } from "./status";

type K = Pick<
  Arende,
  "kundNamn" | "hyresvardNamn" | "hyresvardEpost" | "skickad" | "skickadDatum" | "atgardad" | "brist" | "temperatur" | "manadshyra"
>;

const HYRAN = "Betala hyran som vanligt. Håll aldrig inne hyran – då riskerar du att förlora lägenheten.";
const avslut = (lank: string) => `Följ ditt ärende här:\n${lank}\n\nVänliga hälsningar\n${brand.namn}`;
const hej = (a: K) => `Hej ${a.kundNamn}!`;
const ARTIKEL = `${brand.url}/artiklar/sa-anmaler-du-en-brist`;

export function mejlSkickad(a: K, lank: string): Mejltext {
  return {
    amne: `Din anmälan är skickad till ${a.hyresvardNamn}`,
    text: `${hej(a)}

Vi skickade din anmälan till ${a.hyresvardNamn} (${a.hyresvardEpost})${a.skickad ? ` ${tidText(a.skickad)}` : ""}. Du har fått en kopia. Spara den – den visar vilken dag hyresvärden fick veta om bristen.

När hyresvärden svarar får du ett mejl från oss. Svarar hyresvärden inte inom 7 dagar skickar vi en påminnelse.

${HYRAN}

${avslut(lank)}`,
  };
}

export function mejlSvar(a: K, t: Tolkning, lank: string): Mejltext {
  return {
    amne: `${a.hyresvardNamn} har svarat på din anmälan`,
    text: `${hej(a)}

${a.hyresvardNamn} har svarat. Så här sammanfattar vi svaret (sammanfattningen är gjord av AI – läs hela svaret på ärendesidan):

${t.sammanfattning}
${t.fraga ? `\nHyresvärden frågar: ${t.fraga}\nDu kan svara på ärendesidan.\n` : ""}
${avslut(lank)}`,
  };
}

function mejlPaminnelse(a: K, nummer: 1 | 2, lank: string): Mejltext {
  return {
    amne: `Vi har påmint ${a.hyresvardNamn}`,
    text: `${hej(a)}

${a.hyresvardNamn} har inte svarat på din anmälan. Vi har skickat ${nummer === 1 ? "en påminnelse" : "en andra påminnelse"} i ditt namn. Du fick en kopia.

${HYRAN}

${avslut(lank)}`,
  };
}

function mejlIngetSvar(a: K, lank: string): Mejltext {
  return {
    amne: `${a.hyresvardNamn} har inte svarat`,
    text: `${hej(a)}

${a.hyresvardNamn} har inte svarat på din anmälan eller på våra två påminnelser. Vi skickar inga fler påminnelser.

Det här kan du göra nu:
- Ring hyresvärden och hänvisa till anmälan du skickade${a.skickadDatum ? ` den ${datumText(a.skickadDatum)}` : ""}.
- Vänd dig till hyresnämnden. Nämnden kan förelägga hyresvärden att åtgärda bristen. Läs mer: ${ARTIKEL}

${HYRAN}

${avslut(lank)}`,
  };
}

function mejlArAtgardad(a: K, lank: string): Mejltext {
  return {
    amne: "Är bristen åtgärdad?",
    text: `${hej(a)}

Har ${a.hyresvardNamn} åtgärdat bristen? Öppna ärendesidan och tryck på "Bristen är åtgärdad" när den är det. Då avslutar vi ärendet och visar ungefär hur mycket hyran kan sänkas för tiden bristen fanns.

Är bristen kvar behöver du inte göra något.

${avslut(lank)}`,
  };
}

function mejlAvslutat(a: K, lank: string, idag: string): Mejltext {
  const uppskattning = uppskattningText(a, idag);
  return {
    amne: "Ditt ärende är avslutat",
    text: `${hej(a)}

Du har markerat att bristen är åtgärdad${a.atgardad ? ` den ${datumText(a.atgardad)}` : ""}. Ärendet är avslutat.

${uppskattning ?? `Räkna ut ungefär hur mycket hyran kan sänkas: ${brand.url}/kalkylator`}

Hyran sänks inte av sig själv. Du behöver själv begära nedsättningen hos hyresvärden. Så gör du: ${ARTIKEL}

${avslut(lank)}`,
  };
}

export function kundMejl(typ: KundMejl, a: K, lank: string, idag: string): Mejltext {
  switch (typ) {
    case "skickad":
      return mejlSkickad(a, lank);
    case "paminnelse1":
      return mejlPaminnelse(a, 1, lank);
    case "paminnelse2":
      return mejlPaminnelse(a, 2, lank);
    case "ingetSvar":
      return mejlIngetSvar(a, lank);
    case "arAtgardad":
      return mejlArAtgardad(a, lank);
    case "avslutat":
      return mejlAvslutat(a, lank, idag);
  }
}

/** Samma uträkning som kalkylatorn, från dagen anmälan skickades till åtgärdsdagen. Null om den inte går. */
export function uppskattningText(
  a: Pick<Arende, "brist" | "temperatur" | "manadshyra" | "skickadDatum" | "atgardad">,
  idag: string,
): string | null {
  if (!a.manadshyra || !a.skickadDatum || !a.atgardad) return null;
  const r = raknaUt({
    brist: a.brist,
    manadshyra: a.manadshyra,
    temperatur: a.temperatur,
    ytaTotal: null,
    ytaObrukbar: null,
    anmaldSkriftligt: true,
    anmalanDatum: a.skickadDatum,
    atgardad: true,
    atgardDatum: a.atgardad,
    idag,
  });
  if (r.typ !== "uppskattning") return null;
  return `Uppskattning – ingen garanti: hyran kan sänkas med ungefär ${kronorSpann(r.belopp)} för ${r.dagar} dagar (${procentSpann(r.procent)} av månadshyran).`;
}
