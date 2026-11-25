/**
 * Statistik via Plausible (cookiefritt). Slås på med NEXT_PUBLIC_PLAUSIBLE_DOMAIN.
 * Utan den skickas ingenting.
 */
export type Handelse = "kalkylator_start" | "kalkylator_klar" | "vantelista_anmalan";

type Plausible = ((handelse: string, val?: { props: Record<string, string> }) => void) & { q?: unknown[] };

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export const plausibleDoman = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function sparaHandelse(handelse: Handelse, props?: Record<string, string>): void {
  if (!plausibleDoman || typeof window === "undefined") return;
  // Kö som Plausibles skript tömmer när det har laddats.
  const ko: Plausible = (...args) => {
    (ko.q ??= []).push(args);
  };
  window.plausible ??= ko;
  window.plausible(handelse, props ? { props } : undefined);
}
