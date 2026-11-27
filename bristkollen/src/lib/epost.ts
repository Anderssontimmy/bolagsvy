/**
 * E-post via Resend (REST, utan SDK): skicka textmejl och ta emot svar.
 * Bara textmejl – ingen HTML som kan bli fel eller missbrukas.
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
  /** Bifogas mejlet. Resend tar emot base64. */
  bilagor?: { filnamn: string; innehall: Buffer }[];
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
          ...(m.bilagor?.length
            ? { attachments: m.bilagor.map((b) => ({ filename: b.filnamn, content: b.innehall.toString("base64") })) }
            : {}),
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
 * (bara vår domän får skicka). Svar går till ärendets egen adress via reply-to.
 */
export function avsandare(namn: string, franEnv: string): string {
  const adress = franEnv.match(/<([^>]+)>/)?.[1] ?? franEnv.trim();
  const visning = `${namn} via ${brand.namn}`.replace(/["<>\r\n]/g, "").replace(/\s+/g, " ").trim();
  return `"${visning}" <${adress}>`;
}

export type MottagetMejl = {
  id: string;
  fran: string;
  till: string[];
  kopia: string[];
  mottagenFor: string[];
  amne: string;
  text: string | null;
  html: string | null;
  autentisering: { spf?: string; dkim?: string; dmarc?: string } | null;
};

export type MottagenBilaga = { filnamn: string; typ: string; storlek: number; nedladdning: string };

export interface Mottagning {
  hamtaMejl(id: string): Promise<MottagetMejl>;
  hamtaBilagor(id: string): Promise<MottagenBilaga[]>;
  laddaNer(url: string): Promise<Buffer>;
}

export function resendMottagning(nyckel: string, fetchFn: typeof fetch = fetch): Mottagning {
  async function hamta(sokvag: string) {
    const svar = await fetchFn(`https://api.resend.com${sokvag}`, {
      headers: { Authorization: `Bearer ${nyckel}` },
      cache: "no-store",
    });
    if (!svar.ok) throw new Error(`Resend svarade ${svar.status}`);
    return (await svar.json()) as Record<string, unknown>;
  }
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    async hamtaMejl(id) {
      const m = await hamta(`/emails/receiving/${encodeURIComponent(id)}`);
      return {
        id: String(m.id ?? id),
        fran: String(m.from ?? ""),
        till: lista(m.to),
        kopia: lista(m.cc),
        mottagenFor: lista(m.received_for),
        amne: String(m.subject ?? ""),
        text: typeof m.text === "string" ? m.text : null,
        html: typeof m.html === "string" ? m.html : null,
        autentisering: (m.authentication as MottagetMejl["autentisering"]) ?? null,
      };
    },
    async hamtaBilagor(id) {
      const svar = await hamta(`/emails/receiving/${encodeURIComponent(id)}/attachments`);
      const data = Array.isArray(svar.data) ? (svar.data as Record<string, unknown>[]) : [];
      return data.map((b) => ({
        filnamn: String(b.filename ?? "bilaga"),
        typ: String(b.content_type ?? "application/octet-stream"),
        storlek: Number(b.size ?? 0),
        nedladdning: String(b.download_url ?? ""),
      }));
    },
    async laddaNer(url) {
      const svar = await fetchFn(url, { cache: "no-store" });
      if (!svar.ok) throw new Error(`Bilagan kunde inte hämtas (${svar.status})`);
      return Buffer.from(await svar.arrayBuffer());
    },
  };
}
