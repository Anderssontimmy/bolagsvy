/**
 * Lagring för väntelistan bakom ett litet gränssnitt.
 *
 * - Supabase (EU-region) när SUPABASE_URL och SUPABASE_SECRET_KEY finns.
 * - Annars minnet, så att appen går att köra lokalt utan nycklar.
 *   Minnet töms när servern startas om – använd det aldrig i produktion.
 */
import type { BristId } from "@/data/procentsatser";

export type VantelistaPost = {
  epost: string;
  brist: BristId | null;
  postnummer: string | null;
  integritetVersion: string;
};

export interface VantelistaLagring {
  namn: "minne" | "supabase";
  spara(post: VantelistaPost): Promise<void>;
}

type Env = Partial<Record<"SUPABASE_URL" | "SUPABASE_SECRET_KEY", string>>;

export function hamtaLagring(env: Env = process.env): VantelistaLagring {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = env;
  if (SUPABASE_URL && SUPABASE_SECRET_KEY) return supabaseLagring(SUPABASE_URL, SUPABASE_SECRET_KEY);

  if (process.env.NODE_ENV === "production" && !varnat) {
    varnat = true;
    console.warn("Väntelistan sparas bara i minnet: SUPABASE_URL och SUPABASE_SECRET_KEY saknas.");
  }
  return minnesLagring();
}
let varnat = false;

// Ligger på globalThis så att listan överlever omladdning i utvecklingsläget.
const globalt = globalThis as typeof globalThis & { __vantelista?: Map<string, VantelistaPost> };

export function minnesLagring(poster: Map<string, VantelistaPost> = (globalt.__vantelista ??= new Map())) {
  return {
    namn: "minne" as const,
    async spara(post: VantelistaPost) {
      if (!poster.has(post.epost)) poster.set(post.epost, post);
    },
    antal: () => poster.size,
  };
}

export function supabaseLagring(
  url: string,
  nyckel: string,
  fetchFn: typeof fetch = fetch,
): VantelistaLagring {
  const bas = url.replace(/\/+$/, "");
  return {
    namn: "supabase",
    async spara(post) {
      const svar = await fetchFn(`${bas}/rest/v1/vantelista?on_conflict=epost`, {
        method: "POST",
        headers: {
          // Fungerar både med nya hemliga nycklar (sb_secret_…) och äldre service_role-nycklar.
          apikey: nyckel,
          Authorization: `Bearer ${nyckel}`,
          "Content-Type": "application/json",
          // Samma e-post två gånger ska inte ge fel och inte avslöja att adressen redan finns.
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({
          epost: post.epost,
          brist: post.brist,
          postnummer: post.postnummer,
          integritet_version: post.integritetVersion,
        }),
        cache: "no-store",
      });
      if (!svar.ok) throw new Error(`Supabase svarade ${svar.status}`);
    },
  };
}
