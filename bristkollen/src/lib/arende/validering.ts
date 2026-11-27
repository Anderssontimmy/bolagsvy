import { arBristId, type BristId } from "@/data/procentsatser";
import { arGiltigtDatum } from "@/lib/kalkylator";
import { HONEYPOT_FALT } from "@/lib/vantelista/validering";

export type AnmalanData = {
  namn: string;
  epost: string;
  telefon: string | null;
  gatuadress: string;
  postnummer: string;
  ort: string;
  lagenhetsnummer: string;
  hyresvardNamn: string;
  hyresvardEpost: string;
  brist: BristId;
  /** Bara för kyla, frivillig. */
  temperatur: number | null;
  /** ÅÅÅÅ-MM-DD */
  sedan: string;
  beskrivning: string;
};

export type AnmalanFalt = keyof AnmalanData | "uppdrag";

export type AnmalanValidering =
  | { ok: true; spam: false; data: AnmalanData }
  | { ok: true; spam: true }
  | { ok: false; fel: Partial<Record<AnmalanFalt, string>> };

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** En rad text: inga radbrytningar eller andra styrtecken (skydd mot injektion i mejlrubriker). */
function enRad(v: unknown): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim() : "";
}

export function valideraAnmalan(body: unknown, idag: string): AnmalanValidering {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, fel: { namn: "Något gick fel med formuläret. Ladda om sidan och försök igen." } };
  }
  const b = body as Record<string, unknown>;
  if (enRad(b[HONEYPOT_FALT]) !== "") return { ok: true, spam: true };

  const fel: Partial<Record<AnmalanFalt, string>> = {};
  const text = (falt: AnmalanFalt, min: number, max: number, meddelande: string) => {
    const v = enRad(b[falt]);
    if (v.length < min || v.length > max) fel[falt] = meddelande;
    return v;
  };

  const namn = text("namn", 2, 100, "Skriv ditt för- och efternamn.");
  const epost = enRad(b.epost).toLowerCase();
  if (epost.length > 254 || !EPOST.test(epost)) fel.epost = "Skriv en giltig e-postadress, till exempel namn@exempel.se.";

  const telefonText = enRad(b.telefon);
  if (telefonText !== "" && !/^\+?[\d\s-]{6,20}$/.test(telefonText)) {
    fel.telefon = "Skriv telefonnumret med siffror, eller lämna fältet tomt.";
  }

  const gatuadress = text("gatuadress", 3, 100, "Skriv gatuadressen, till exempel Storgatan 12.");
  const postnummer = enRad(b.postnummer).replace(/\s/g, "");
  if (!/^[1-9]\d{4}$/.test(postnummer)) fel.postnummer = "Skriv postnumret med fem siffror, till exempel 123 45.";
  const ort = text("ort", 2, 60, "Skriv orten.");
  const lagenhetsnummer = text("lagenhetsnummer", 1, 20, "Skriv lägenhetsnumret. Det står ofta i hyresavtalet.");

  const hyresvardNamn = text("hyresvardNamn", 2, 100, "Skriv hyresvärdens namn, till exempel bolagets namn.");
  const hyresvardEpost = enRad(b.hyresvardEpost).toLowerCase();
  if (hyresvardEpost.length > 254 || !EPOST.test(hyresvardEpost)) {
    fel.hyresvardEpost = "Skriv hyresvärdens e-postadress för felanmälan.";
  } else if (hyresvardEpost === epost) {
    fel.hyresvardEpost = "Hyresvärdens e-postadress kan inte vara samma som din.";
  }

  const brist = b.brist;
  if (!arBristId(brist)) fel.brist = "Välj vilken typ av brist du har.";

  let temperatur: number | null = null;
  if (brist === "kyla" && b.temperatur !== null && b.temperatur !== undefined && b.temperatur !== "") {
    const t = typeof b.temperatur === "number" ? b.temperatur : Number(String(b.temperatur).replace(",", "."));
    if (!Number.isFinite(t) || t < 0 || t > 40) fel.temperatur = "Skriv en temperatur mellan 0 och 40 grader, eller lämna fältet tomt.";
    else temperatur = t;
  }

  const sedan = enRad(b.sedan);
  if (!arGiltigtDatum(sedan)) fel.sedan = "Skriv sedan vilket datum bristen finns.";
  else if (sedan > idag) fel.sedan = "Datumet kan inte vara i framtiden.";

  const beskrivning =
    typeof b.beskrivning === "string"
      ? b.beskrivning
          .replace(/\r\n?/g, "\n")
          .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
          .trim()
      : "";
  if (beskrivning.length < 10 || beskrivning.length > 2000) {
    fel.beskrivning = "Beskriv bristen med några meningar (högst 2 000 tecken).";
  }

  if (b.uppdrag !== true) fel.uppdrag = "Du behöver ge oss i uppdrag att skicka anmälan i ditt namn.";

  if (Object.keys(fel).length > 0) return { ok: false, fel };
  return {
    ok: true,
    spam: false,
    data: {
      namn,
      epost,
      telefon: telefonText === "" ? null : telefonText,
      gatuadress,
      postnummer,
      ort,
      lagenhetsnummer,
      hyresvardNamn,
      hyresvardEpost,
      brist: brist as BristId,
      temperatur,
      sedan,
      beskrivning,
    },
  };
}
