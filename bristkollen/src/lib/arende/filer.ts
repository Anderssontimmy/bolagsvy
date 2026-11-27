/** Foton och hyresvärdens bilagor. Privat lagring – kunden ser dem bara via tillfälliga länkar. */
export interface FilLagring {
  spara(sokvag: string, data: Buffer, mime: string): Promise<void>;
  hamta(sokvag: string): Promise<Buffer>;
  /** En länk som kunden kan öppna. Gäller en timme i skarpt läge. */
  lank(sokvag: string): Promise<string>;
  radera(sokvagar: string[]): Promise<void>;
}

type FilMinne = Map<string, { data: Buffer; mime: string }>;
const globalt = globalThis as unknown as { __filMinne?: FilMinne };

export function minnesFiler(minne: FilMinne = (globalt.__filMinne ??= new Map())): FilLagring {
  return {
    async spara(sokvag, data, mime) {
      minne.set(sokvag, { data, mime });
    },
    async hamta(sokvag) {
      const fil = minne.get(sokvag);
      if (!fil) throw new Error("Filen finns inte");
      return fil.data;
    },
    async lank(sokvag) {
      const fil = minne.get(sokvag);
      return fil ? `data:${fil.mime};base64,${fil.data.toString("base64")}` : "";
    },
    async radera(sokvagar) {
      for (const s of sokvagar) minne.delete(s);
    },
  };
}

export function supabaseFiler(url: string, nyckel: string, bucket = "bilagor", fetchFn: typeof fetch = fetch): FilLagring {
  const bas = `${url.replace(/\/$/, "")}/storage/v1`;
  const auth = { apikey: nyckel, Authorization: `Bearer ${nyckel}` };
  const sti = (s: string) => s.split("/").map(encodeURIComponent).join("/");
  async function kolla(svar: Response) {
    if (!svar.ok) throw new Error(`Supabase Storage svarade ${svar.status}`);
    return svar;
  }
  return {
    async spara(sokvag, data, mime) {
      await kolla(
        await fetchFn(`${bas}/object/${bucket}/${sti(sokvag)}`, {
          method: "POST",
          headers: { ...auth, "Content-Type": mime },
          body: new Uint8Array(data),
        }),
      );
    },
    async hamta(sokvag) {
      const svar = await kolla(await fetchFn(`${bas}/object/${bucket}/${sti(sokvag)}`, { headers: auth, cache: "no-store" }));
      return Buffer.from(await svar.arrayBuffer());
    },
    async lank(sokvag) {
      const svar = await kolla(
        await fetchFn(`${bas}/object/sign/${bucket}/${sti(sokvag)}`, {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: 3600 }),
        }),
      );
      const { signedURL } = (await svar.json()) as { signedURL: string };
      return `${bas}${signedURL}`;
    },
    async radera(sokvagar) {
      if (sokvagar.length === 0) return;
      await kolla(
        await fetchFn(`${bas}/object/${bucket}`, {
          method: "DELETE",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: sokvagar }),
        }),
      );
    },
  };
}
