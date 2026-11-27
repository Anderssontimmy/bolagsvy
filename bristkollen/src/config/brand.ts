/**
 * All varumärkesinformation på ett ställe. Byt namn, domän, färger eller
 * kontaktadress här – resten av sajten läser härifrån.
 *
 * Färgerna blir CSS-variabler (se app/layout.tsx) som Tailwind använder
 * via klasser som bg-primar, text-black och border-linje.
 */
export const brand = {
  namn: "Halvhyra.se",
  domän: "halvhyra.se",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://halvhyra.se",
  kontaktEpost: "hej@halvhyra.se",
  slogan: "Hjälp att få sänkt hyra när lägenheten har brister",
  beskrivning:
    "Kallt hemma eller trasigt i lägenheten? Räkna ut ungefär hur mycket hyran kan sänkas och lär dig hur du anmäler bristen till hyresvärden.",
  /** Version av integritetspolicyn. Sparas med varje anmälan till väntelistan. */
  integritetVersion: "2026-11-25-utkast",
  farger: {
    papper: "#ffffff", // bakgrund
    yta: "#ffffff", // kort och formulär
    gra: "#f9fafb", // ljusgrå sektioner och frågerader
    black: "#0e1116", // brödtext
    dampad: "#4b5563", // sekundär text
    linje: "#d1d5db", // ramar
    primar: "#115b55", // mörkgrön: band, sektioner, länkar
    primarMork: "#072b36", // hover och mörka ytor
    frost: "#eff1e5", // ljusa ytor och inaktiva steg
    persika: "#f9c8b8", // knappar
    persikaMork: "#f4ad97", // hover på knappar
    orange: "#f59c21", // dekor (aldrig som textfärg – för låg kontrast)
    glod: "#a84d16", // accent för text, varningar och fokusring
    glodLjus: "#fdece6", // varningsrutor
  },
} as const;

export type Farg = keyof typeof brand.farger;
