/**
 * Texten i anmälan till hyresvärden och i bekräftelsemejlet till hyresgästen.
 * Ren logik – används både i webbläsaren (förhandsvisning) och på servern (utskick),
 * så att hyresgästen ser exakt det som skickas. Utkast – se docs/JURIST-TODO.md.
 */
import { brand } from "@/config/brand";
import { BRISTTYPER } from "@/data/procentsatser";
import { datumText } from "@/lib/format";
import type { AnmalanData } from "./validering";

export type Mejltext = { amne: string; text: string };

export function skapaBrev(d: AnmalanData): Mejltext {
  const brist = BRISTTYPER.find((b) => b.id === d.brist)?.namn ?? d.brist;
  const temperatur =
    d.brist === "kyla" && d.temperatur !== null
      ? `Uppmätt temperatur inomhus: ${String(d.temperatur).replace(".", ",")} °C\n`
      : "";
  const kontakt = d.telefon ? `${d.epost} eller ${d.telefon}` : d.epost;

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

Ni når mig på ${kontakt}.

Vänliga hälsningar
${d.namn}

--
Anmälan skickades via ${brand.namn} (${brand.domän}) på uppdrag av ${d.namn}. ${d.namn} har fått en kopia, och svar på det här mejlet går direkt till ${d.namn}.`,
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
