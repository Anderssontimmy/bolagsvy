/** Gemensamt för API-vägarna. */
import { brand } from "@/config/brand";
import type { AktivaTjanster } from "./tjanst";

export const ipFran = (r: Request) => r.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "okand";

export const fel = (meddelande: string, status: number, extra: Record<string, unknown> = {}) =>
  Response.json({ ok: false, meddelande, ...extra }, { status });
export const avstangd = () => fel("Den här tjänsten är inte igång än.", 503);
export const forManga = () => fel("Du har försökt många gånger. Försök igen om en stund.", 429);
export const olasligt = () => fel("Formuläret kunde inte läsas. Ladda om sidan och försök igen.", 400);

export async function lasJson(r: Request, maxTecken: number): Promise<Record<string, unknown> | null> {
  const text = await r.text();
  if (text.length > maxTecken) return null;
  try {
    const v = JSON.parse(text) as unknown;
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Lokalt pekar länkar på den egna servern, i drift på sajtens adress. */
export const basAdress = (t: AktivaTjanster, r: Request) => (t.lage === "test" ? new URL(r.url).origin : brand.url);
