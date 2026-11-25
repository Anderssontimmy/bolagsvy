import { arBristId, type BristId } from "@/data/procentsatser";

export type VantelistaData = {
  epost: string;
  brist: BristId | null;
  postnummer: string | null;
};

export type VantelistaFalt = "epost" | "brist" | "postnummer" | "samtycke";

export type Validering =
  | { ok: true; spam: false; data: VantelistaData }
  /** Honeypot-fältet var ifyllt. Svara som om allt gick bra, men spara inget. */
  | { ok: true; spam: true }
  | { ok: false; fel: Partial<Record<VantelistaFalt, string>> };

/** Namnet på det dolda fältet som bara robotar fyller i. */
export const HONEYPOT_FALT = "webbplats";

const EPOST_MONSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function valideraVantelista(body: unknown): Validering {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, fel: { epost: "Något gick fel med formuläret. Ladda om sidan och försök igen." } };
  }
  const b = body as Record<string, unknown>;

  const honeypot = b[HONEYPOT_FALT];
  if (typeof honeypot === "string" && honeypot.trim() !== "") return { ok: true, spam: true };

  const fel: Partial<Record<VantelistaFalt, string>> = {};

  const epost = typeof b.epost === "string" ? b.epost.trim().toLowerCase() : "";
  if (epost.length > 254 || !EPOST_MONSTER.test(epost)) {
    fel.epost = "Skriv en giltig e-postadress, till exempel namn@exempel.se.";
  }

  let brist: BristId | null = null;
  if (b.brist !== undefined && b.brist !== null && b.brist !== "") {
    if (arBristId(b.brist)) brist = b.brist;
    else fel.brist = "Välj en brist i listan, eller lämna fältet tomt.";
  }

  let postnummer: string | null = null;
  const pnr = typeof b.postnummer === "string" ? b.postnummer.replace(/\s/g, "") : "";
  if (pnr !== "") {
    if (/^[1-9]\d{4}$/.test(pnr)) postnummer = pnr;
    else fel.postnummer = "Skriv postnumret med fem siffror, till exempel 123 45, eller lämna fältet tomt.";
  }

  if (b.samtycke !== true) {
    fel.samtycke = "Du behöver godkänna att vi sparar din e-postadress för att kunna skriva upp dig.";
  }

  if (Object.keys(fel).length > 0) return { ok: false, fel };
  return { ok: true, spam: false, data: { epost, brist, postnummer } };
}
