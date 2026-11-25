/**
 * E-post via Resend (REST, utan SDK). Bara textmejl – ingen HTML som kan bli fel eller missbrukas.
 */
import { brand } from "@/config/brand";

export type Mejl = {
  fran: string;
  till: string[];
  kopia?: string[];
  svarTill?: string[];
  amne: string;
  text: string;
  /** Samma nyckel inom 24 timmar ger inget nytt mejl hos Resend. */
  idempotensnyckel: string;
};

export interface Epost {
  skicka(mejl: Mejl): Promise<{ id: string }>;
}

export function resendEpost(nyckel: string, fetchFn: typeof fetch = fetch): Epost {
  return {
    async skicka(m) {
      const svar = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${nyckel}`,
          "Content-Type": "application/json",
          "Idempotency-Key": m.idempotensnyckel,
        },
        body: JSON.stringify({
          from: m.fran,
          to: m.till,
          ...(m.kopia ? { cc: m.kopia } : {}),
          ...(m.svarTill ? { reply_to: m.svarTill } : {}),
          subject: m.amne,
          text: m.text,
        }),
        cache: "no-store",
      });
      if (!svar.ok) throw new Error(`Resend svarade ${svar.status}`);
      const json = (await svar.json()) as { id?: string };
      return { id: json.id ?? "okant" };
    },
  };
}

/**
 * Avsändare för anmälan: hyresgästens namn "via" tjänsten, men vår adress
 * (bara vår domän får skicka). Svar går till hyresgästen via reply-to.
 */
export function avsandare(namn: string, franEnv: string): string {
  const adress = franEnv.match(/<([^>]+)>/)?.[1] ?? franEnv.trim();
  const visning = `${namn} via ${brand.namn}`.replace(/["<>\r\n]/g, "").replace(/\s+/g, " ").trim();
  return `"${visning}" <${adress}>`;
}
