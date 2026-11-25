/**
 * Enkel begränsning av antalet anrop per nyckel (IP-adress) i minnet.
 * IP-adressen sparas aldrig någon annanstans och försvinner när fönstret
 * har gått. På Vercel har varje serverinstans sin egen räknare – det räcker
 * som ett första skydd mot spam.
 */
export function skapaBegransare({ max, fonsterMs }: { max: number; fonsterMs: number }) {
  const traffar = new Map<string, number[]>();

  return function tillat(nyckel: string, nu: number = Date.now()): boolean {
    const grans = nu - fonsterMs;
    // Rensa adresser vars fönster har gått ut, så att inga IP-adresser ligger kvar i onödan.
    for (const [k, tider] of traffar) if (tider.every((t) => t <= grans)) traffar.delete(k);
    const aktuella = (traffar.get(nyckel) ?? []).filter((t) => t > grans);

    if (aktuella.length >= max) {
      traffar.set(nyckel, aktuella);
      return false;
    }
    aktuella.push(nu);
    traffar.set(nyckel, aktuella);
    return true;
  };
}
