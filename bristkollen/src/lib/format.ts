import type { Spann } from "@/data/procentsatser";

const tal = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
const datum = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function kronor(n: number): string {
  return `${tal.format(n)} kr`;
}

/** "1 200–3 500 kr". Vi visar alltid ett spann, aldrig ett exakt belopp. */
export function kronorSpann({ min, max }: Spann): string {
  return `${tal.format(min)}–${tal.format(max)} kr`;
}

const procent = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });

/** "5–25 %". Procent som räknats fram från en yta kan ha decimaler: "0–19,4 %". */
export function procentSpann({ min, max }: Spann): string {
  return `${procent.format(min)}–${procent.format(max)} %`;
}

/** "25 november 2026" från "2026-11-25". */
export function datumText(iso: string): string {
  return datum.format(new Date(`${iso}T00:00:00Z`));
}

/** Dagens datum i användarens tidszon som ÅÅÅÅ-MM-DD. */
export function idagIso(nu: Date = new Date()): string {
  const tva = (n: number) => String(n).padStart(2, "0");
  return `${nu.getFullYear()}-${tva(nu.getMonth() + 1)}-${tva(nu.getDate())}`;
}

/** Tolkar "9 500", "9500" och "17,5" som tal. Tom text ger null. */
export function tolkaTal(text: string): number | null {
  const rensad = text.replace(/[\s ]/g, "").replace(",", ".");
  if (rensad === "") return null;
  const n = Number(rensad);
  return Number.isFinite(n) ? n : Number.NaN;
}
