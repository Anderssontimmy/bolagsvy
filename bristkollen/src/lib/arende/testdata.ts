import { reservAi } from "@/lib/ai";
import type { Epost, Mejl } from "@/lib/epost";
import { minnesFiler } from "./filer";
import { minnesLagring, tomtMinne } from "./lagring";
import type { AktivaTjanster } from "./tjanst";
import type { Arende } from "./status";
import type { AnmalanData } from "./validering";

/** Giltiga uppgifter för tester. */
export const ANMALAN: AnmalanData = {
  namn: "Anna Andersson",
  epost: "anna@exempel.se",
  telefon: "070-123 45 67",
  gatuadress: "Storgatan 12",
  postnummer: "12345",
  ort: "Exempelstad",
  lagenhetsnummer: "1102",
  hyresvardNamn: "Exempelbostäder AB",
  hyresvardEpost: "felanmalan@exempelbostader.se",
  brist: "kyla",
  temperatur: 16.5,
  sedan: "2026-11-01",
  beskrivning: "Elementen i vardagsrummet och sovrummet är kalla.\nDet har varit 16–17 grader i flera veckor.",
};

/** Ett ärende för tester. Skriv över de fält som testet handlar om. */
export function exempelArende(over: Partial<Arende> = {}): Arende {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kortId: "abcde23456",
    status: "vantar_bekraftelse",
    bekraftaHash: "bekrafta-hash",
    bekraftaGiltigTill: "2026-12-02T12:00:00.000Z",
    kundNamn: ANMALAN.namn,
    kundEpost: ANMALAN.epost,
    kundTelefon: ANMALAN.telefon,
    gatuadress: ANMALAN.gatuadress,
    postnummer: ANMALAN.postnummer,
    ort: ANMALAN.ort,
    lagenhetsnummer: ANMALAN.lagenhetsnummer,
    hyresvardNamn: ANMALAN.hyresvardNamn,
    hyresvardEpost: ANMALAN.hyresvardEpost,
    brist: ANMALAN.brist,
    temperatur: ANMALAN.temperatur,
    sedan: ANMALAN.sedan,
    beskrivningKund: ANMALAN.beskrivning,
    beskrivningAi: null,
    amne: "Anmälan om brist: Kallt i lägenheten – Storgatan 12, lgh 1102",
    brevtext: "Till Exempelbostäder AB\n\nJag vill anmäla en brist i min lägenhet.",
    brevSha256: "brev-sha",
    uppdragVersion: "2026-11-27-utkast",
    skapad: "2026-12-01T12:00:00.000Z",
    skickad: null,
    skickadDatum: null,
    paminnelser: 0,
    nastaPaminnelse: null,
    ingetSvarMeddelat: false,
    kundfragor: 0,
    atgardad: null,
    manadshyra: null,
    ...over,
  };
}

/** Låtsas-e-post som sparar det som "skickas". felPa gör att vissa mejl misslyckas. */
export function falskEpost(skickat: Mejl[] = [], felPa?: (m: Mejl) => boolean): Epost {
  return {
    async skicka(m) {
      if (felPa?.(m)) throw new Error("Resend svarade 500");
      skickat.push(m);
      return { id: `e-${skickat.length}` };
    },
  };
}

/** Skarpa tjänster med lagring i minnet och låtsas-e-post. */
export function testTjanster(over: Partial<AktivaTjanster> = {}): AktivaTjanster {
  return {
    lage: "skarp",
    lagring: minnesLagring(tomtMinne()),
    filer: minnesFiler(new Map()),
    epost: falskEpost(),
    mottagning: null,
    ai: reservAi(),
    fran: "Halvhyra.se <anmalan@halvhyra.se>",
    svarDoman: "svar.halvhyra.se",
    lankHemlighet: "hemlis",
    webhookHemlighet: null,
    cronHemlighet: null,
    ...over,
  };
}
