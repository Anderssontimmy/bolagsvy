/** Typer och texter för AI-tolkningen. Importerar inget SDK, så komponenter i webbläsaren kan använda filen. */
export const KATEGORIER = ["lovar_atgard", "atgardad", "fragar", "bestrider", "ovrigt"] as const;
export type Kategori = (typeof KATEGORIER)[number];
export type Tolkning = { sammanfattning: string; kategori: Kategori; fraga: string };

export const KATEGORI_TEXT: Record<Kategori, string> = {
  lovar_atgard: "Lovar att åtgärda",
  atgardad: "Säger att bristen är åtgärdad",
  fragar: "Ställer en fråga",
  bestrider: "Håller inte med",
  ovrigt: "Övrigt",
};

export const RESERV_TOLKNING: Tolkning = {
  sammanfattning: "Hyresvärden har svarat. Läs svaret på ärendesidan.",
  kategori: "ovrigt",
  fraga: "",
};
