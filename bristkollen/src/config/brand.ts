/**
 * All varumärkesinformation på ett ställe. Byt namn, domän, färger eller
 * kontaktadress här – resten av sajten läser härifrån.
 *
 * Färgerna blir CSS-variabler (se app/layout.tsx) som Tailwind använder
 * via klasser som bg-primar, text-black och border-linje.
 */
export const brand = {
  namn: "Bristkollen",
  domän: "bristkollen.se",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://bristkollen.se",
  kontaktEpost: "hej@bristkollen.se",
  slogan: "Hjälp att få sänkt hyra när lägenheten har brister",
  beskrivning:
    "Kallt hemma eller trasigt i lägenheten? Räkna ut ungefär hur mycket hyran kan sänkas och lär dig hur du anmäler bristen till hyresvärden.",
  /** Version av integritetspolicyn. Sparas med varje anmälan till väntelistan. */
  integritetVersion: "2026-11-25-utkast",
  farger: {
    papper: "#f7f4ee", // bakgrund
    yta: "#ffffff", // kort och formulär
    black: "#1c2430", // brödtext
    dampad: "#4a5565", // sekundär text
    linje: "#d9d3c7", // ramar
    primar: "#1d4b66", // vinterblå: knappar och länkar
    primarMork: "#143749", // hover
    frost: "#e4eef3", // ljusblå ytor
    glod: "#b5541a", // bärnsten: accent och fokusring
    glodLjus: "#fbeee2", // varningsrutor
  },
} as const;

export type Farg = keyof typeof brand.farger;
