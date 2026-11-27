/**
 * Texten i anmälan till hyresvärden och i bekräftelsemejlet till hyresgästen.
 * Ren logik – används både i webbläsaren (förhandsvisning) och på servern (utskick),
 * så att hyresgästen ser exakt det som skickas. Utkast – se docs/JURIST-TODO.md.
 */
import { brand } from "@/config/brand";
import { BRISTTYPER } from "@/data/procentsatser";
import { datumText } from "@/lib/format";
import type { Arende } from "./status";
import type { AnmalanData } from "./validering";

export type Mejltext = { amne: string; text: string };

export function skapaBrev(d: AnmalanData): Mejltext {
  const brist = BRISTTYPER.find((b) => b.id === d.brist)?.namn ?? d.brist;
  const temperatur =
    d.brist === "kyla" && d.temperatur !== null
      ? `Uppmätt temperatur inomhus: ${String(d.temperatur).replace(".", ",")} °C\n`
      : "";
  const besok = d.telefon ? ` Vid besök i lägenheten når ni mig också på ${d.telefon}.` : "";

  return {
    amne: `Anmälan om brist: ${brist} – ${d.gatuadress}, lgh ${d.lagenhetsnummer}`,
    text: `Till ${d.hyresvardNamn}

Jag vill anmäla en brist i min lägenhet.

Hyresgäst: ${d.namn}
Adress: ${d.gatuadress}, ${d.postnummer.slice(0, 3)} ${d.postnummer.slice(3)} ${d.ort}
Lägenhetsnummer: ${d.lagenhetsnummer}

Brist: ${brist}
${temperatur}Bristen har funnits sedan: ${datumText(d.sedan)}

Beskrivning:
${d.beskrivning}

Jag ber er att åtgärda bristen så snart som möjligt.

Jag begär nedsättning av hyran från och med den dag ni tar emot den här anmälan, tills bristen är åtgärdad.

Svara på det här mejlet, så når svaret mig.${besok}

Vänliga hälsningar
${d.namn}

--
${sidfot(d.namn)}`,
  };
}

/** Sidfoten i allt vi skickar till hyresvärden. Utkast – se docs/JURIST-TODO.md. */
export function sidfot(namn: string): string {
  return `Anmälan skickas via ${brand.namn} (${brand.domän}) på uppdrag av ${namn}. ${namn} får en kopia av all e-post i ärendet. Svar på det här mejlet går till ${brand.namn}, som för det vidare till ${namn}.`;
}

type BrevArende = Pick<Arende, "amne" | "brevtext" | "hyresvardNamn" | "kundNamn" | "skickadDatum">;

export function skapaPaminnelse(a: BrevArende, nummer: 1 | 2): Mejltext {
  const datum = a.skickadDatum ? datumText(a.skickadDatum) : "";
  return {
    amne: `Påminnelse${nummer === 2 ? " 2" : ""}: ${a.amne}`,
    text: `Till ${a.hyresvardNamn}

Jag skickade en anmälan om brist till er den ${datum} och har inte fått något svar.${nummer === 2 ? " Det här är min andra påminnelse." : ""}

Jag ber er att bekräfta att ni har tagit emot anmälan och berätta när bristen kommer att åtgärdas. Svara på det här mejlet, så når svaret mig.

Vänliga hälsningar
${a.kundNamn}

--
${sidfot(a.kundNamn)}

---------- Anmälan som skickades ${datum} ----------
Ämne: ${a.amne}

${a.brevtext}`,
  };
}

export function skapaKundsvar(a: Pick<Arende, "amne" | "kundNamn">, text: string): Mejltext {
  return {
    amne: `Sv: ${a.amne}`,
    text: `${text}

Vänliga hälsningar
${a.kundNamn}

--
${sidfot(a.kundNamn)}`,
  };
}

export function skapaBekraftelse(d: AnmalanData, brev: Mejltext, lank: string): Mejltext {
  return {
    amne: `Bekräfta din anmälan till ${d.hyresvardNamn}`,
    text: `Hej ${d.namn}!

Du har bett ${brand.namn} att skicka en anmälan om brist till ${d.hyresvardNamn} (${d.hyresvardEpost}).

Ingenting har skickats än. Öppna länken för att granska och skicka anmälan:
${lank}

Länken gäller i 24 timmar. Har du inte bett om det här? Då kan du strunta i mejlet.

Så här ser anmälan ut:
------------------------------------------------------------

Ämne: ${brev.amne}

${brev.text}`,
  };
}
