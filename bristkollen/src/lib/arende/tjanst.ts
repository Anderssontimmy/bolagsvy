/**
 * Vilket läge anmälan till hyresvärden körs i:
 * - "skarp": riktiga mejl. Kräver RESEND_API_KEY, UTSKICK_FRAN, SUPABASE_URL och SUPABASE_SECRET_KEY.
 * - "test":  lokalt utan nycklar. Inga mejl skickas; bekräftelselänken visas på skärmen i stället.
 * - "av":    produktion utan inställningar. Tjänsten är avstängd och sajten visar "kommer snart".
 */
import { createHash, randomBytes } from "node:crypto";
import { resendEpost, type Epost } from "@/lib/epost";
import { minnesLagring, supabaseLagring, type AnmalanLagring } from "./lagring";

export type UtskickLage = "skarp" | "test" | "av";

type Env = Record<string, string | undefined>;

export function utskickLage(env: Env = process.env): UtskickLage {
  if (env.RESEND_API_KEY && env.UTSKICK_FRAN && env.SUPABASE_URL && env.SUPABASE_SECRET_KEY) return "skarp";
  return env.NODE_ENV === "production" ? "av" : "test";
}

export type Tjanster =
  | { lage: "skarp"; lagring: AnmalanLagring; epost: Epost; fran: string }
  | { lage: "test"; lagring: AnmalanLagring }
  | { lage: "av" };

export function hamtaTjanster(env: Env = process.env): Tjanster {
  const lage = utskickLage(env);
  if (lage === "skarp") {
    return {
      lage,
      lagring: supabaseLagring(env.SUPABASE_URL as string, env.SUPABASE_SECRET_KEY as string),
      epost: resendEpost(env.RESEND_API_KEY as string),
      fran: env.UTSKICK_FRAN as string,
    };
  }
  return lage === "test" ? { lage, lagring: minnesLagring() } : { lage };
}

/** Slumpad token till bekräftelselänken (256 bitar). */
export function skapaToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Dagens datum i Sverige, ÅÅÅÅ-MM-DD – servern kan gå på UTC. */
export function idagSverige(nu: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(nu);
}
