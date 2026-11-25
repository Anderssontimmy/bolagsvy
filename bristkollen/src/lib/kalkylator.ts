/**
 * Kalkylator för hyresnedsättning. Ren logik utan React – testas i
 * kalkylator.test.ts.
 *
 * Formel: månadshyra × procentsats × dagar från skriftlig anmälan till
 * åtgärd (eller i dag) ÷ 30. Dagar före anmälan räknas aldrig.
 */
import {
  KYLA_GRANS,
  PROCENTSATSER,
  arBristId,
  type BristId,
  type ProcentRad,
  type RadId,
  type Spann,
} from "@/data/procentsatser";

export type KalkylIndata = {
  brist: string;
  manadshyra: number | null;
  /** Uppmätt inomhustemperatur i °C. Krävs bara för kyla. */
  temperatur: number | null;
  /** Lägenhetens yta i kvm. Krävs bara för brister som räknas på yta (vattenskada). */
  ytaTotal: number | null;
  /** Yta i kvm som inte går att använda. Krävs bara för brister som räknas på yta. */
  ytaObrukbar: number | null;
  anmaldSkriftligt: boolean | null;
  /** Dagen hyresvärden fick den skriftliga anmälan, ÅÅÅÅ-MM-DD. */
  anmalanDatum: string;
  atgardad: boolean | null;
  atgardDatum: string;
  /** Dagens datum, ÅÅÅÅ-MM-DD. Skickas in så att logiken går att testa. */
  idag: string;
};

export type Falt = Exclude<keyof KalkylIndata, "idag">;

export type KalkylResultat =
  | { typ: "fel"; fel: Partial<Record<Falt, string>> }
  | { typ: "inte_kallt"; temperatur: number }
  | { typ: "ej_anmald"; radId: RadId; rad: ProcentRad; perDag: Spann | null }
  | { typ: "inget_varde"; radId: RadId; rad: ProcentRad }
  | {
      typ: "uppskattning";
      radId: RadId;
      rad: ProcentRad;
      /** Procent av hela månadshyran. För brister som räknas på yta är den redan omräknad. */
      procent: Spann;
      /** Bara för brister som räknas på yta. */
      yta: { obrukbar: number; total: number } | null;
      dagar: number;
      belopp: Spann;
      fran: string;
      till: string;
      pagaende: boolean;
    };

const TEMP_MIN = 0;
const TEMP_MAX = 40;
const YTA_MAX = 1000; // kvm

type Tabell = Record<RadId, ProcentRad>;

export function raknaUt(in_: KalkylIndata, tabell: Tabell = PROCENTSATSER): KalkylResultat {
  const fel = validera(in_, tabell);
  if (Object.keys(fel).length > 0) return { typ: "fel", fel };

  // validera() har garanterat att dessa värden finns.
  const brist = in_.brist as BristId;
  const hyra = in_.manadshyra as number;

  if (brist === "kyla" && (in_.temperatur as number) >= KYLA_GRANS.varmGrans) {
    return { typ: "inte_kallt", temperatur: in_.temperatur as number };
  }

  const radId = valjRad(brist, in_.temperatur);
  const rad = tabell[radId];
  const yta = rad.berakning === "yta" ? { obrukbar: in_.ytaObrukbar as number, total: in_.ytaTotal as number } : null;
  // Brister som räknas på yta: procenten gäller bara den del av lägenheten som inte går att använda.
  const andel = yta ? yta.obrukbar / yta.total : 1;
  const procent = rad.procent ? { min: rad.procent.min * andel, max: rad.procent.max * andel } : null;

  if (!in_.anmaldSkriftligt) {
    const perDag = procent
      ? {
          min: Math.floor(avrunda(belopp(hyra, procent.min, 1))),
          max: Math.ceil(avrunda(belopp(hyra, procent.max, 1))),
        }
      : null;
    return { typ: "ej_anmald", radId, rad, perDag };
  }

  if (!procent) return { typ: "inget_varde", radId, rad };

  const fran = in_.anmalanDatum;
  const till = in_.atgardad ? in_.atgardDatum : in_.idag;
  const dagar = dagarMellan(fran, till);

  return {
    typ: "uppskattning",
    radId,
    rad,
    procent,
    yta,
    dagar,
    belopp: {
      min: Math.floor(avrunda(belopp(hyra, procent.min, dagar)) / 10) * 10,
      max: Math.ceil(avrunda(belopp(hyra, procent.max, dagar)) / 10) * 10,
    },
    fran,
    till,
    pagaende: !in_.atgardad,
  };
}

export function valjRad(brist: BristId, temperatur: number | null): RadId {
  if (brist !== "kyla") return brist;
  return temperatur !== null && temperatur < KYLA_GRANS.lagstaRiktvarde ? "kyla_under_18" : "kyla_18_20";
}

function validera(in_: KalkylIndata, tabell: Tabell): Partial<Record<Falt, string>> {
  const fel: Partial<Record<Falt, string>> = {};

  if (!arBristId(in_.brist)) fel.brist = "Välj vilken typ av brist du har.";

  if (arBristId(in_.brist) && in_.brist !== "kyla" && tabell[in_.brist].berakning === "yta") {
    const total = in_.ytaTotal;
    const obrukbar = in_.ytaObrukbar;
    const totalOk = total !== null && Number.isFinite(total) && total > 0 && total <= YTA_MAX;
    if (!totalOk) fel.ytaTotal = "Skriv hur många kvadratmeter lägenheten är.";
    if (obrukbar === null || !Number.isFinite(obrukbar) || obrukbar <= 0) {
      fel.ytaObrukbar = "Skriv hur många kvadratmeter du inte kan använda.";
    } else if (totalOk && obrukbar > total) {
      fel.ytaObrukbar = "Ytan du inte kan använda kan inte vara större än hela lägenheten.";
    }
  }

  if (in_.manadshyra === null || !Number.isFinite(in_.manadshyra)) {
    fel.manadshyra = "Skriv din månadshyra i kronor.";
  } else if (in_.manadshyra <= 0) {
    fel.manadshyra = "Månadshyran måste vara mer än 0 kronor.";
  }

  if (in_.brist === "kyla") {
    if (in_.temperatur === null || !Number.isFinite(in_.temperatur)) {
      fel.temperatur = "Skriv vilken temperatur du har mätt upp inomhus.";
    } else if (in_.temperatur < TEMP_MIN || in_.temperatur > TEMP_MAX) {
      fel.temperatur = `Skriv en temperatur mellan ${TEMP_MIN} och ${TEMP_MAX} grader.`;
    }
  }

  if (in_.anmaldSkriftligt === null) {
    fel.anmaldSkriftligt = "Svara om du har anmält bristen skriftligt.";
  }

  if (in_.anmaldSkriftligt === true) {
    const anmalanOk = arGiltigtDatum(in_.anmalanDatum);
    if (!anmalanOk) {
      fel.anmalanDatum = "Skriv vilket datum hyresvärden fick din anmälan.";
    } else if (in_.anmalanDatum > in_.idag) {
      fel.anmalanDatum = "Datumet för anmälan kan inte vara i framtiden.";
    }

    if (in_.atgardad === null) {
      fel.atgardad = "Svara om bristen är åtgärdad.";
    } else if (in_.atgardad) {
      if (!arGiltigtDatum(in_.atgardDatum)) {
        fel.atgardDatum = "Skriv vilket datum bristen blev åtgärdad.";
      } else if (in_.atgardDatum > in_.idag) {
        fel.atgardDatum = "Datumet kan inte vara i framtiden. Om bristen inte är åtgärdad än, välj Nej.";
      } else if (anmalanOk && in_.atgardDatum < in_.anmalanDatum) {
        fel.atgardDatum = "Datumet för åtgärd kan inte vara före datumet för anmälan. Kontrollera datumen.";
      }
    }
  }

  return fel;
}

/** Kronor för ett antal dagar: hyra × procent × dagar ÷ 30. */
function belopp(hyra: number, procent: number, dagar: number): number {
  return (hyra * procent * dagar) / (100 * 30);
}

/** Tar bort flyttalsbrus (t.ex. 449,99999) innan vi avrundar nedåt eller uppåt. */
function avrunda(x: number): number {
  return Math.round(x * 100) / 100;
}

export function arGiltigtDatum(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, d] = s.split("-").map(Number);
  const datum = new Date(Date.UTC(a, m - 1, d));
  return datum.getUTCFullYear() === a && datum.getUTCMonth() === m - 1 && datum.getUTCDate() === d;
}

function dagarMellan(fran: string, till: string): number {
  const utc = (s: string) => {
    const [a, m, d] = s.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((utc(till) - utc(fran)) / 86_400_000);
}
