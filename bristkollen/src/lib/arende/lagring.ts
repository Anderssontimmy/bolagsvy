/**
 * Lagring av ärenden, meddelanden och bilagor. Brevet och meddelandena ändras aldrig – det är beviset.
 * Minnesvarianten används i testläget, Supabase (REST, utan SDK) i skarpt läge.
 */
import type { Kategori } from "@/lib/ai/typer";
import type { Arende } from "./status";

export type Meddelande = {
  id: string;
  arendeId: string;
  riktning: "ut" | "in";
  typ: "anmalan" | "paminnelse" | "kundsvar" | "hyresvardssvar" | "okand_avsandare";
  fran: string;
  till: string;
  kopia: string | null;
  amne: string;
  text: string;
  sha256: string;
  /** Id hos Resend. Unikt, så att samma mejl inte sparas två gånger. */
  leverantorId: string | null;
  aiSammanfattning: string | null;
  aiKategori: Kategori | null;
  aiFraga: string | null;
  skapad: string;
};

export type Bilaga = {
  id: string;
  arendeId: string;
  meddelandeId: string | null;
  kalla: "kund" | "hyresvard";
  filnamn: string;
  mime: string;
  storlek: number;
  sha256: string;
  sokvag: string;
  skapad: string;
};

export interface ArendeLagring {
  namn: "minne" | "supabase";
  skapa(a: Arende): Promise<void>;
  hamtaViaBekrafta(hash: string): Promise<Arende | null>;
  hamtaViaKortId(kortId: string): Promise<Arende | null>;
  uppdatera(id: string, andring: Partial<Arende>): Promise<void>;
  laggTillMeddelande(m: Meddelande): Promise<"ny" | "dubblett">;
  meddelanden(arendeId: string): Promise<Meddelande[]>;
  laggTillBilaga(b: Bilaga): Promise<void>;
  bilagor(arendeId: string): Promise<Bilaga[]>;
  /** Ärenden där påminnelser och frågor kan behöva gå ut. */
  aktiva(): Promise<Arende[]>;
  /** Obekräftade ärenden vars bekräftelselänk har gått ut. */
  utgangna(nu: string): Promise<Arende[]>;
  radera(id: string): Promise<void>;
}

export type Minne = { arenden: Map<string, Arende>; meddelanden: Meddelande[]; bilagor: Bilaga[] };
export const tomtMinne = (): Minne => ({ arenden: new Map(), meddelanden: [], bilagor: [] });

// Ligger på globalThis så att innehållet överlever omladdning i utvecklingsläget.
const globalt = globalThis as unknown as { __arendeMinne?: Minne };

export function minnesLagring(minne: Minne = (globalt.__arendeMinne ??= tomtMinne())): ArendeLagring {
  const hitta = (villkor: (a: Arende) => boolean) => {
    const a = [...minne.arenden.values()].find(villkor);
    return a ? { ...a } : null;
  };
  return {
    namn: "minne",
    async skapa(a) {
      minne.arenden.set(a.id, { ...a });
    },
    async hamtaViaBekrafta(hash) {
      return hitta((a) => a.bekraftaHash === hash);
    },
    async hamtaViaKortId(kortId) {
      return hitta((a) => a.kortId === kortId);
    },
    async uppdatera(id, andring) {
      const a = minne.arenden.get(id);
      if (a) minne.arenden.set(id, { ...a, ...andring });
    },
    async laggTillMeddelande(m) {
      if (m.leverantorId && minne.meddelanden.some((x) => x.leverantorId === m.leverantorId)) return "dubblett";
      minne.meddelanden.push({ ...m });
      return "ny";
    },
    async meddelanden(arendeId) {
      return minne.meddelanden.filter((m) => m.arendeId === arendeId).sort((a, b) => a.skapad.localeCompare(b.skapad));
    },
    async laggTillBilaga(b) {
      minne.bilagor.push({ ...b });
    },
    async bilagor(arendeId) {
      return minne.bilagor.filter((b) => b.arendeId === arendeId);
    },
    async aktiva() {
      return [...minne.arenden.values()].filter((a) => a.status === "skickad" || a.status === "besvarad");
    },
    async utgangna(nu) {
      return [...minne.arenden.values()].filter((a) => a.status === "vantar_bekraftelse" && a.bekraftaGiltigTill < nu);
    },
    async radera(id) {
      minne.arenden.delete(id);
      minne.meddelanden = minne.meddelanden.filter((m) => m.arendeId !== id);
      minne.bilagor = minne.bilagor.filter((b) => b.arendeId !== id);
    },
  };
}

const tillSnake = (s: string) => s.replace(/[A-Z]/g, (b) => `_${b.toLowerCase()}`);
const tillCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, b: string) => b.toUpperCase());
const tillRad = (o: object) => Object.fromEntries(Object.entries(o).map(([k, v]) => [tillSnake(k), v]));
const franRad = <T>(r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [tillCamel(k), v])) as T;

export function supabaseLagring(url: string, nyckel: string, fetchFn: typeof fetch = fetch): ArendeLagring {
  const bas = `${url.replace(/\/$/, "")}/rest/v1`;
  async function anrop(sokvag: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
    const svar = await fetchFn(`${bas}${sokvag}`, {
      method: init.method ?? "GET",
      headers: {
        apikey: nyckel,
        Authorization: `Bearer ${nyckel}`,
        "Content-Type": "application/json",
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    if (!svar.ok) throw new Error(`Supabase svarade ${svar.status}`);
    const text = await svar.text();
    return text ? (JSON.parse(text) as unknown) : null;
  }
  const rader = async <T>(sokvag: string) => ((await anrop(sokvag)) as Record<string, unknown>[]).map((r) => franRad<T>(r));
  const en = async (kolumn: string, varde: string) =>
    (await rader<Arende>(`/arende?${kolumn}=eq.${encodeURIComponent(varde)}&select=*&limit=1`))[0] ?? null;
  const id = (v: string) => encodeURIComponent(v);

  return {
    namn: "supabase",
    async skapa(a) {
      await anrop("/arende", { method: "POST", body: tillRad(a), prefer: "return=minimal" });
    },
    hamtaViaBekrafta: (hash) => en("bekrafta_hash", hash),
    hamtaViaKortId: (kortId) => en("kort_id", kortId),
    async uppdatera(arendeId, andring) {
      await anrop(`/arende?id=eq.${id(arendeId)}`, { method: "PATCH", body: tillRad(andring), prefer: "return=minimal" });
    },
    async laggTillMeddelande(m) {
      const svar = (await anrop("/meddelande?on_conflict=leverantor_id", {
        method: "POST",
        body: tillRad(m),
        prefer: "resolution=ignore-duplicates,return=representation",
      })) as unknown[];
      return svar.length === 0 ? "dubblett" : "ny";
    },
    meddelanden: (arendeId) => rader<Meddelande>(`/meddelande?arende_id=eq.${id(arendeId)}&select=*&order=skapad.asc`),
    async laggTillBilaga(b) {
      await anrop("/bilaga", { method: "POST", body: tillRad(b), prefer: "return=minimal" });
    },
    bilagor: (arendeId) => rader<Bilaga>(`/bilaga?arende_id=eq.${id(arendeId)}&select=*&order=skapad.asc`),
    aktiva: () => rader<Arende>("/arende?status=in.(skickad,besvarad)&select=*"),
    utgangna: (nu) => rader<Arende>(`/arende?status=eq.vantar_bekraftelse&bekrafta_giltig_till=lt.${id(nu)}&select=*`),
    async radera(arendeId) {
      await anrop(`/arende?id=eq.${id(arendeId)}`, { method: "DELETE", prefer: "return=minimal" });
    },
  };
}
