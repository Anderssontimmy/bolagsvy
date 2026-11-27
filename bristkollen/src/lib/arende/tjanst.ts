/**
 * Lägen och tjänster för ärenden:
 * - "skarp": riktiga mejl och Supabase. Kräver alla variabler i SKARPA.
 * - "test":  lokalt, eller med HALVHYRA_TESTLAGE=ja i webbläsartesterna (sätts aldrig i drift).
 *            Minneslagring, inga mejl, länkar visas på skärmen.
 * - "av":    produktion utan inställningar. Tjänsten är avstängd och sajten visar "kommer snart".
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { brand } from "@/config/brand";
import { skapaAi, type Ai } from "@/lib/ai";
import { resendEpost, resendMottagning, type Epost, type Mottagning } from "@/lib/epost";
import { minnesFiler, supabaseFiler, type FilLagring } from "./filer";
import { minnesLagring, supabaseLagring, type ArendeLagring } from "./lagring";

export type UtskickLage = "skarp" | "test" | "av";
type Env = Record<string, string | undefined>;

const SKARPA = [
  "RESEND_API_KEY",
  "UTSKICK_FRAN",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SVAR_DOMAN",
  "RESEND_WEBHOOK_SECRET",
  "CRON_SECRET",
  "LANK_HEMLIGHET",
] as const;

export function utskickLage(env: Env = process.env): UtskickLage {
  if (SKARPA.every((nyckel) => env[nyckel])) return "skarp";
  if (env.HALVHYRA_TESTLAGE === "ja") return "test";
  return env.NODE_ENV === "production" ? "av" : "test";
}

export type AktivaTjanster = {
  lage: "skarp" | "test";
  lagring: ArendeLagring;
  filer: FilLagring;
  /** Null i testläge: inga mejl skickas. */
  epost: Epost | null;
  mottagning: Mottagning | null;
  ai: Ai;
  fran: string;
  svarDoman: string;
  lankHemlighet: string;
  webhookHemlighet: string | null;
  cronHemlighet: string | null;
};

export type Tjanster = AktivaTjanster | { lage: "av" };

export function hamtaTjanster(env: Env = process.env): Tjanster {
  const lage = utskickLage(env);
  if (lage === "av") return { lage };
  const ai = skapaAi(env);
  if (lage === "skarp") {
    const e = env as Record<(typeof SKARPA)[number], string>;
    return {
      lage,
      lagring: supabaseLagring(e.SUPABASE_URL, e.SUPABASE_SECRET_KEY),
      filer: supabaseFiler(e.SUPABASE_URL, e.SUPABASE_SECRET_KEY),
      epost: resendEpost(e.RESEND_API_KEY),
      mottagning: resendMottagning(e.RESEND_API_KEY),
      ai,
      fran: e.UTSKICK_FRAN,
      svarDoman: e.SVAR_DOMAN,
      lankHemlighet: e.LANK_HEMLIGHET,
      webhookHemlighet: e.RESEND_WEBHOOK_SECRET,
      cronHemlighet: e.CRON_SECRET,
    };
  }
  return {
    lage,
    lagring: minnesLagring(),
    filer: minnesFiler(),
    epost: null,
    mottagning: null,
    ai,
    fran: env.UTSKICK_FRAN ?? `${brand.namn} <anmalan@${brand.domän}>`,
    svarDoman: env.SVAR_DOMAN ?? `svar.${brand.domän}`,
    lankHemlighet: env.LANK_HEMLIGHET ?? "testlage-hemlighet",
    webhookHemlighet: null,
    cronHemlighet: null,
  };
}

/** Slumpad token till bekräftelselänken (256 bitar). */
export function skapaToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

// 32 tecken utan l, o, 0 och 1. 256 är jämnt delbart med 32, så alla tecken är lika vanliga.
const ALFABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function skapaKortId(): string {
  return Array.from(randomBytes(10), (b) => ALFABET[b % 32]).join("");
}

/** Token till ärendesidan: kortId plus en signatur. Sparas inte – servern kan räkna fram den igen till varje mejl. */
export function sidaToken(kortId: string, hemlighet: string): string {
  return `${kortId}.${createHmac("sha256", hemlighet).update(kortId).digest("base64url").slice(0, 32)}`;
}

export function lasSidaToken(token: string, hemlighet: string): string | null {
  const [kortId, signatur] = token.split(".");
  if (!kortId || !signatur || !/^[a-z0-9]{10}$/.test(kortId)) return null;
  const vantad = Buffer.from(sidaToken(kortId, hemlighet).split(".")[1]);
  const given = Buffer.from(signatur);
  return given.length === vantad.length && timingSafeEqual(given, vantad) ? kortId : null;
}

/** Dagens datum i svensk tid, ÅÅÅÅ-MM-DD. */
export function idagSverige(nu: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(nu);
}
