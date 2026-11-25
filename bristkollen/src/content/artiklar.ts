import { KALLOR, type Kalla } from "./kallor";

/**
 * Artiklarnas metadata. Själva texten ligger i content/artiklar/<slug>.mdx.
 * Alla artiklar är utkast som en jurist ska granska (docs/JURIST-TODO.md).
 */
export type Artikel = {
  slug: string;
  titel: string;
  beskrivning: string;
  /** ÅÅÅÅ-MM-DD. Uppdatera när texten har granskats. */
  senastGranskad: string;
  /** false tills en jurist har granskat texten. */
  juristGranskad: boolean;
  kallor: Kalla[];
};

export const ARTIKLAR: Artikel[] = [
  {
    slug: "kallt-i-lagenheten",
    titel: "Kallt i lägenheten – har du rätt till sänkt hyra?",
    beskrivning:
      "När är det för kallt inomhus, hur mycket kan hyran sänkas och vad ska du göra? Riktvärden, räkneexempel och steg för steg.",
    senastGranskad: "2026-11-25",
    juristGranskad: false,
    kallor: [KALLOR.jb12, KALLOR.hgfKallt, KALLOR.hgfHyresreduktion, KALLOR.lawlineKallt],
  },
  {
    slug: "stambyte-och-renovering",
    titel: "Hyresreduktion vid stambyte och renovering",
    beskrivning:
      "Buller, damm eller inget kök under ett stambyte? Så fungerar hyresnedsättning vid renovering – och vad ditt hyresavtal kan betyda.",
    senastGranskad: "2026-11-25",
    juristGranskad: false,
    kallor: [
      KALLOR.jb12,
      KALLOR.nja2002,
      KALLOR.lawlineSedvanligt,
      KALLOR.fastigheterRenovering,
      KALLOR.hgfHyresreduktion,
    ],
  },
  {
    slug: "sa-anmaler-du-en-brist",
    titel: "Så anmäler du en brist till hyresvärden – och varför datumet är så viktigt",
    beskrivning:
      "Hyran kan sänkas först från dagen hyresvärden får veta om bristen. Så anmäler du skriftligt, med exempel på vad du kan skriva.",
    senastGranskad: "2026-11-25",
    juristGranskad: false,
    kallor: [KALLOR.jb12, KALLOR.hgfHyresreduktion, KALLOR.fastighetsagarnaBrister],
  },
  {
    slug: "buller-och-storande-grannar",
    titel: "Störande buller eller grannar – vad gäller?",
    beskrivning:
      "Buller eller en störande granne kan ge rätt till sänkt hyra, även när hyresvärden inte har orsakat störningen.",
    senastGranskad: "2026-11-25",
    juristGranskad: false,
    kallor: [KALLOR.jb12, KALLOR.hemHyra, KALLOR.fastighetsagarnaBrister, KALLOR.hgfHyresreduktion],
  },
  {
    slug: "far-jag-halla-inne-hyran",
    titel: "Får jag hålla inne hyran?",
    beskrivning:
      "Nej – då riskerar du att förlora lägenheten. Så deponerar du i stället den omtvistade delen av hyran hos länsstyrelsen.",
    senastGranskad: "2026-11-25",
    juristGranskad: false,
    kallor: [KALLOR.lansstyrelsenDeponera, KALLOR.hgfHyresreduktion, KALLOR.lawlineForenklat, KALLOR.jb12],
  },
];

export function hamtaArtikel(slug: string): Artikel | undefined {
  return ARTIKLAR.find((a) => a.slug === slug);
}
