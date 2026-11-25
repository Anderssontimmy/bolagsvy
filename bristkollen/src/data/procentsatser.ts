/**
 * Procentsatser för hyresnedsättning.
 *
 * UTKAST – INTE JURIDISKT GRANSKAT. Värdena kommer exakt från projektets
 * procenttabell. Ändra dem inte utan att uppdatera källan och låta en jurist
 * granska (se docs/JURIST-TODO.md).
 */

export const UTKAST = "utkast – ska granskas av jurist" as const;

export type Spann = { min: number; max: number };

export type ProcentRad = {
  namn: string;
  /** Procent av månadshyran. null = vi har inget värde än. */
  procent: Spann | null;
  kalla: string;
  kallaUrl: string | null;
  status: typeof UTKAST;
};

const HEM_HYRA = "https://www.hemhyra.se/nyheter/sa-mycket-kan-din-hyra-sankas/";
const FASTIGHETER = "https://fastigheter.se/artiklar/renovering-hyresratt-regler-guide";

export const PROCENTSATSER = {
  buller: {
    namn: "Störande buller",
    procent: { min: 10, max: 35 },
    kalla: "Hyresgästföreningens referenstabell, enligt Hem & Hyra",
    kallaUrl: HEM_HYRA,
    status: UTKAST,
  },
  granne: {
    namn: "Störande granne",
    procent: { min: 10, max: 40 },
    kalla: "Hyresgästföreningens referenstabell, enligt Hem & Hyra",
    kallaUrl: HEM_HYRA,
    status: UTKAST,
  },
  renovering: {
    namn: "Buller, damm och obehag under renovering",
    procent: { min: 10, max: 20 },
    kalla: "fastigheter.se",
    kallaUrl: FASTIGHETER,
    status: UTKAST,
  },
  kok_badrum: {
    namn: "Kök eller badrum går inte att använda",
    procent: { min: 35, max: 45 },
    kalla: "fastigheter.se anger cirka 40 %. Spannet är ett utkast",
    kallaUrl: FASTIGHETER,
    status: UTKAST,
  },
  kyla_18_20: {
    namn: "Kyla, 18–20 °C",
    procent: { min: 0, max: 5 },
    kalla:
      "Utkast. Enligt Hyresgästföreningen kan hyresgästen under 20 °C kräva att hyresvärden utreder och mäter",
    kallaUrl:
      "https://via.tt.se/pressmeddelande/4600875/kallt-i-lagenheten-det-har-kan-du-krava-av-din-hyresvard?lang=sv",
    status: UTKAST,
  },
  kyla_under_18: {
    namn: "Kyla, under 18 °C",
    procent: { min: 5, max: 25 },
    kalla:
      "Utkast. Folkhälsomyndighetens lägsta riktvärde är 18 °C. Ett enskilt svar på Lawline nämner 25 % vid 15 °C, men det är ingen norm",
    kallaUrl: "https://lawline.se/answers/kallt-i-lagenheten",
    status: UTKAST,
  },
  hiss: { namn: "Trasig hiss", procent: null, kalla: "–", kallaUrl: null, status: UTKAST },
  tvattstuga: { namn: "Trasig tvättstuga", procent: null, kalla: "–", kallaUrl: null, status: UTKAST },
  mogel: { namn: "Mögel", procent: null, kalla: "–", kallaUrl: null, status: UTKAST },
  vattenskada: { namn: "Vattenskada", procent: null, kalla: "–", kallaUrl: null, status: UTKAST },
} as const satisfies Record<string, ProcentRad>;

export type RadId = keyof typeof PROCENTSATSER;

/**
 * Temperaturgränser för kyla (°C). Under 18 → kyla_under_18.
 * 18 till (men inte med) 20 → kyla_18_20. 20 eller mer räknas inte som kallt.
 * Gränsen vid exakt 20,0 °C är ett antagande – se docs/JURIST-TODO.md.
 */
export const KYLA_GRANS = { lagstaRiktvarde: 18, varmGrans: 20 } as const;

/** Bristtyperna man väljer mellan i kalkylatorn och på väntelistan. */
export const BRISTTYPER = [
  { id: "kyla", namn: "Kallt i lägenheten" },
  { id: "renovering", namn: "Buller, damm och obehag under renovering eller stambyte" },
  { id: "kok_badrum", namn: "Kök eller badrum går inte att använda" },
  { id: "buller", namn: "Störande buller" },
  { id: "granne", namn: "Störande granne" },
  { id: "hiss", namn: "Trasig hiss" },
  { id: "tvattstuga", namn: "Trasig tvättstuga" },
  { id: "mogel", namn: "Mögel" },
  { id: "vattenskada", namn: "Vattenskada" },
] as const;

export type BristId = (typeof BRISTTYPER)[number]["id"];

export function arBristId(varde: unknown): varde is BristId {
  return typeof varde === "string" && BRISTTYPER.some((b) => b.id === varde);
}
