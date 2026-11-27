/**
 * Lagring av anmälningar till hyresvärden. Innehållet ändras aldrig efter att det har skapats –
 * bara status, tid för utskick och leverantörens id. Det är beviset.
 */

export type AnmalanPost = {
  id: string;
  /** SHA-256 av token i bekräftelselänken. Själva token sparas aldrig. */
  tokenHash: string;
  giltigTill: string;
  status: "vantar" | "skickad";
  hyresgastNamn: string;
  hyresgastEpost: string;
  hyresvardNamn: string;
  hyresvardEpost: string;
  amne: string;
  innehall: string;
  innehallSha256: string;
  skapad: string;
  skickad: string | null;
  leverantorId: string | null;
};

export interface AnmalanLagring {
  namn: "minne" | "supabase";
  skapa(post: AnmalanPost): Promise<void>;
  hamta(tokenHash: string): Promise<AnmalanPost | null>;
  markeraSkickad(id: string, skickad: string, leverantorId: string): Promise<void>;
}

const globalt = globalThis as typeof globalThis & { __anmalningar?: Map<string, AnmalanPost> };

export function minnesLagring(poster: Map<string, AnmalanPost> = (globalt.__anmalningar ??= new Map())): AnmalanLagring {
  return {
    namn: "minne",
    async skapa(post) {
      poster.set(post.id, { ...post });
    },
    async hamta(tokenHash) {
      for (const p of poster.values()) if (p.tokenHash === tokenHash) return { ...p };
      return null;
    },
    async markeraSkickad(id, skickad, leverantorId) {
      const p = poster.get(id);
      if (p && p.status === "vantar") poster.set(id, { ...p, status: "skickad", skickad, leverantorId });
    },
  };
}

type Rad = {
  id: string;
  token_hash: string;
  giltig_till: string;
  status: "vantar" | "skickad";
  hyresgast_namn: string;
  hyresgast_epost: string;
  hyresvard_namn: string;
  hyresvard_epost: string;
  amne: string;
  innehall: string;
  innehall_sha256: string;
  skapad: string;
  skickad: string | null;
  leverantor_id: string | null;
};

const tillRad = (p: AnmalanPost): Rad => ({
  id: p.id,
  token_hash: p.tokenHash,
  giltig_till: p.giltigTill,
  status: p.status,
  hyresgast_namn: p.hyresgastNamn,
  hyresgast_epost: p.hyresgastEpost,
  hyresvard_namn: p.hyresvardNamn,
  hyresvard_epost: p.hyresvardEpost,
  amne: p.amne,
  innehall: p.innehall,
  innehall_sha256: p.innehallSha256,
  skapad: p.skapad,
  skickad: p.skickad,
  leverantor_id: p.leverantorId,
});

const franRad = (r: Rad): AnmalanPost => ({
  id: r.id,
  tokenHash: r.token_hash,
  giltigTill: r.giltig_till,
  status: r.status,
  hyresgastNamn: r.hyresgast_namn,
  hyresgastEpost: r.hyresgast_epost,
  hyresvardNamn: r.hyresvard_namn,
  hyresvardEpost: r.hyresvard_epost,
  amne: r.amne,
  innehall: r.innehall,
  innehallSha256: r.innehall_sha256,
  skapad: r.skapad,
  skickad: r.skickad,
  leverantorId: r.leverantor_id,
});

export function supabaseLagring(url: string, nyckel: string, fetchFn: typeof fetch = fetch): AnmalanLagring {
  const bas = `${url.replace(/\/+$/, "")}/rest/v1/anmalan`;
  const headers = {
    apikey: nyckel,
    Authorization: `Bearer ${nyckel}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const kontrollera = (svar: Response) => {
    if (!svar.ok) throw new Error(`Supabase svarade ${svar.status}`);
  };
  return {
    namn: "supabase",
    async skapa(post) {
      kontrollera(await fetchFn(bas, { method: "POST", headers, body: JSON.stringify(tillRad(post)), cache: "no-store" }));
    },
    async hamta(tokenHash) {
      const svar = await fetchFn(`${bas}?token_hash=eq.${encodeURIComponent(tokenHash)}&select=*&limit=1`, {
        headers,
        cache: "no-store",
      });
      kontrollera(svar);
      const rader = (await svar.json()) as Rad[];
      return rader[0] ? franRad(rader[0]) : null;
    },
    async markeraSkickad(id, skickad, leverantorId) {
      // status=eq.vantar: en anmälan kan bara markeras som skickad en gång.
      const svar = await fetchFn(`${bas}?id=eq.${encodeURIComponent(id)}&status=eq.vantar`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "skickad", skickad, leverantor_id: leverantorId }),
        cache: "no-store",
      });
      kontrollera(svar);
    },
  };
}
