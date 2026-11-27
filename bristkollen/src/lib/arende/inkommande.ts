/** Hjälp för inkommande mejl från Resend: kontrollera att det är äkta och vilket ärende det gäller. */
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_ALDER_SEKUNDER = 5 * 60;

/** Resends webhooks signeras enligt Svix: HMAC-SHA256 av "id.tidsstämpel.body" med hemligheten efter "whsec_". */
export function verifieraSignatur(p: {
  body: string;
  id: string | null;
  tidsstampel: string | null;
  signatur: string | null;
  hemlighet: string;
  nuSekunder: number;
}): boolean {
  if (!p.id || !p.tidsstampel || !p.signatur) return false;
  const ts = Number(p.tidsstampel);
  if (!Number.isFinite(ts) || Math.abs(p.nuSekunder - ts) > MAX_ALDER_SEKUNDER) return false;
  const nyckel = Buffer.from(p.hemlighet.replace(/^whsec_/, ""), "base64");
  const vantad = Buffer.from(createHmac("sha256", nyckel).update(`${p.id}.${p.tidsstampel}.${p.body}`).digest("base64"));
  return p.signatur.split(" ").some((del) => {
    const [version, sig] = del.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig);
    return given.length === vantad.length && timingSafeEqual(given, vantad);
  });
}

/** "Namn <a@b.se>" eller "a@b.se" → "a@b.se" */
function bara(adress: string): string {
  return (adress.match(/<([^<>]+)>\s*$/)?.[1] ?? adress).trim().toLowerCase();
}

export function hittaKortId(adresser: string[], svarDoman: string): string | null {
  const doman = svarDoman.toLowerCase().replace(/[.]/g, "\\.");
  const monster = new RegExp(`^arende-([a-z0-9]{10})@${doman}$`);
  for (const adress of adresser) {
    const traff = bara(adress).match(monster);
    if (traff) return traff[1];
  }
  return null;
}

const GRATISDOMANER = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.se",
  "outlook.com",
  "outlook.se",
  "live.com",
  "live.se",
  "msn.com",
  "yahoo.com",
  "yahoo.se",
  "icloud.com",
  "me.com",
  "telia.com",
  "spray.se",
  "bredband.net",
  "protonmail.com",
  "proton.me",
]);

export function arFranHyresvard(
  fran: string,
  hyresvardEpost: string,
  autentisering: { spf?: string; dkim?: string; dmarc?: string } | null,
): boolean {
  if (autentisering?.dmarc === "fail") return false;
  if (autentisering?.spf === "fail" && autentisering?.dkim === "fail") return false;
  const avsandare = bara(fran);
  const hyresvard = bara(hyresvardEpost);
  if (avsandare === hyresvard) return true;
  const doman = hyresvard.split("@")[1] ?? "";
  return !GRATISDOMANER.has(doman) && avsandare.split("@")[1] === doman;
}

const ENTITETER: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

export function textFranMejl(m: { text: string | null; html: string | null }): string {
  if (m.text?.trim()) return m.text.replace(/\r\n/g, "\n").trim().slice(0, 50_000);
  const html = m.html ?? "";
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (e) => ENTITETER[e] ?? e)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 50_000);
}
