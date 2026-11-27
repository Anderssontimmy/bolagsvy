"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { knappPrimar, knappSekundar } from "@/components/knappar";
import { KATEGORI_TEXT, RESERV_TOLKNING, type Kategori } from "@/lib/ai/typer";
import { datumText, idagIso, tidText } from "@/lib/format";

type Meddelande = {
  id: string;
  riktning: "ut" | "in";
  typ: "anmalan" | "paminnelse" | "kundsvar" | "hyresvardssvar" | "okand_avsandare";
  fran: string;
  amne: string;
  text: string;
  aiSammanfattning: string | null;
  aiKategori: Kategori | null;
  aiFraga: string | null;
  skapad: string;
};
type Bilaga = { id: string; meddelandeId: string | null; kalla: "kund" | "hyresvard"; filnamn: string; mime: string; lank: string };
type Vy = {
  status: "vantar_bekraftelse" | "skickad" | "besvarad" | "atgardad";
  hyresvardNamn: string;
  hyresvardEpost: string;
  amne: string;
  skickad: string | null;
  skickadDatum: string | null;
  atgardad: string | null;
  uppskattning: string | null;
  testlage: boolean;
  meddelanden: Meddelande[];
  bilagor: Bilaga[];
};

const RUBRIK: Record<Meddelande["typ"], string> = {
  anmalan: "Anmälan skickad",
  paminnelse: "Påminnelse skickad",
  kundsvar: "Du svarade",
  hyresvardssvar: "Hyresvärden svarade",
  okand_avsandare: "Mejl från okänd avsändare",
};
const STATUS: Record<Vy["status"], string> = {
  vantar_bekraftelse: "Inte skickad än",
  skickad: "Skickad – väntar på svar",
  besvarad: "Hyresvärden har svarat",
  atgardad: "Avslutat – bristen är åtgärdad",
};
const inmatning = "block w-full rounded-xl border border-linje bg-yta px-4 py-3 text-lg text-black focus:border-primar";
const lasToken = () => window.location.hash.slice(1);

async function anrop(body: Record<string, unknown>, url = "/api/arende/sida") {
  const svar = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: lasToken(), ...body }),
  });
  return { ok: svar.ok, json: await svar.json().catch(() => ({})) };
}

export function ArendeSida() {
  const [vy, setVy] = useState<Vy | null>(null);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState("");
  const [klart, setKlart] = useState("");
  const [svarText, setSvarText] = useState("");
  // Sätts när ärendet har hämtats – dagens datum får inte läsas när sidan förrenderas.
  const [datum, setDatum] = useState("");
  const [hyra, setHyra] = useState("");
  const [arbetar, setArbetar] = useState<"" | "svara" | "atgardad" | "simulera">("");

  useEffect(() => {
    let avbruten = false;
    (async () => {
      if (!lasToken()) {
        setFel("Länken saknar en kod. Öppna länken från mejlet igen.");
        setLaddar(false);
        return;
      }
      const { ok, json } = await anrop({});
      if (avbruten) return;
      if (ok) setVy(json);
      else setFel(json.meddelande ?? "Ärendet hittades inte.");
      setDatum(idagIso());
      setLaddar(false);
    })();
    return () => {
      avbruten = true;
    };
  }, []);

  async function utfor(typ: "svara" | "atgardad" | "simulera", body: Record<string, unknown>, lyckat: string) {
    setArbetar(typ);
    setFel("");
    setKlart("");
    try {
      if (typ === "simulera") {
        await anrop(body, "/api/arende/simulera");
        body = {};
      }
      const { ok, json } = await anrop(body);
      if (ok) {
        setVy(json);
        setKlart(lyckat);
        return true;
      }
      setFel(json.meddelande ?? "Något gick fel. Försök igen.");
    } catch {
      setFel("Vi fick ingen kontakt med servern. Försök igen.");
    } finally {
      setArbetar("");
    }
    return false;
  }

  async function svara(e: FormEvent) {
    e.preventDefault();
    if (await utfor("svara", { handling: "svara", text: svarText }, "Ditt svar är skickat till hyresvärden. Du har fått en kopia.")) {
      setSvarText("");
    }
  }

  async function atgardad(e: FormEvent) {
    e.preventDefault();
    await utfor("atgardad", { handling: "atgardad", datum, manadshyra: hyra }, "Ärendet är avslutat.");
  }

  if (laddar) return <p aria-live="polite">Hämtar ditt ärende …</p>;
  if (!vy) {
    return (
      <div className="rounded-2xl border-2 border-glod bg-glod-ljus p-5" role="alert">
        <p className="font-semibold">{fel}</p>
      </div>
    );
  }

  const oppen = vy.status === "skickad" || vy.status === "besvarad";
  const bilagorFor = (m: Meddelande) => vy.bilagor.filter((b) => (m.typ === "anmalan" ? b.kalla === "kund" : b.meddelandeId === m.id));

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gra p-5 sm:p-6" aria-labelledby="status-rubrik">
        <p className="text-sm font-medium text-primar">Status</p>
        <h2 id="status-rubrik" className="mt-1 text-2xl">
          {STATUS[vy.status]}
        </h2>
        <p className="mt-2 text-dampad">
          Anmälan till {vy.hyresvardNamn} ({vy.hyresvardEpost}){vy.skickad ? `, skickad ${tidText(vy.skickad)}` : ""}.
        </p>
      </section>

      {vy.testlage && (
        <div className="rounded-xl border-2 border-dashed border-glod bg-glod-ljus p-4">
          <p>
            <strong>Testläge.</strong> Inga mejl skickas.
          </p>
          {vy.status !== "atgardad" && (
            <button
              type="button"
              onClick={() => utfor("simulera", {}, "Hyresvärden har svarat (simulerat).")}
              disabled={arbetar !== ""}
              className={`${knappSekundar} mt-3`}
            >
              Simulera svar från hyresvärden
            </button>
          )}
        </div>
      )}

      {fel && (
        <p className="rounded-xl border-2 border-glod bg-glod-ljus p-3 font-semibold" role="alert">
          {fel}
        </p>
      )}
      {klart && (
        <p className="rounded-xl bg-frost p-3 font-semibold" role="status">
          {klart}
        </p>
      )}

      <section aria-labelledby="hant-rubrik">
        <h2 id="hant-rubrik" className="text-2xl">
          Det här har hänt
        </h2>
        <ol className="mt-4 space-y-4">
          {vy.meddelanden.map((m) => (
            <li key={m.id} className="rounded-xl border border-linje bg-yta p-5">
              <p className="font-semibold">{RUBRIK[m.typ]}</p>
              <p className="text-sm text-dampad">{tidText(m.skapad)}</p>
              {m.typ === "hyresvardssvar" && m.aiSammanfattning && m.aiSammanfattning !== RESERV_TOLKNING.sammanfattning && (
                <div className="mt-3 rounded-lg bg-frost p-4">
                  <p className="text-sm font-medium text-primar">
                    Sammanfattat av AI – läs hela svaret nedan{m.aiKategori ? ` · ${KATEGORI_TEXT[m.aiKategori]}` : ""}
                  </p>
                  <p className="mt-1">{m.aiSammanfattning}</p>
                  {m.aiFraga && (
                    <p className="mt-2">
                      <strong>Hyresvärden frågar:</strong> {m.aiFraga}
                    </p>
                  )}
                </div>
              )}
              {m.typ === "okand_avsandare" && (
                <p className="mt-2 text-[0.95rem] text-dampad">
                  Från {m.fran}. Vi vet inte om det är hyresvärden, så vi har inte skickat det vidare till dig.
                </p>
              )}
              <details className="mt-3">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-primar underline">Visa hela mejlet</summary>
                <p className="mt-2 text-sm text-dampad break-words">Ämne: {m.amne}</p>
                <p className="mt-2 break-words whitespace-pre-wrap">{m.text}</p>
              </details>
              {bilagorFor(m).length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {bilagorFor(m).map((b) => (
                    <li key={b.id}>
                      <a
                        href={b.lank}
                        download={b.filnamn}
                        className="inline-flex min-h-11 items-center rounded-full border border-linje px-4 text-sm font-medium text-primar underline"
                      >
                        {b.filnamn}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      {oppen && (
        <section aria-labelledby="svara-rubrik" className="rounded-xl border border-linje bg-yta p-5 sm:p-6">
          <h2 id="svara-rubrik" className="text-2xl">
            Svara hyresvärden
          </h2>
          <p className="mt-2 text-dampad">Vi skickar ditt svar i ditt namn från ärendets adress. Du får en kopia.</p>
          <form onSubmit={svara} className="mt-4 space-y-3">
            <label htmlFor="svar" className="block font-semibold">
              Ditt svar
            </label>
            <textarea id="svar" rows={4} maxLength={4000} value={svarText} onChange={(e) => setSvarText(e.target.value)} className={inmatning} />
            <button type="submit" disabled={arbetar !== "" || svarText.trim().length < 2} className={`${knappPrimar} disabled:opacity-70`}>
              {arbetar === "svara" ? "Skickar …" : "Skicka svaret"}
            </button>
          </form>
        </section>
      )}

      {oppen && (
        <section aria-labelledby="atgardad-rubrik" className="rounded-xl bg-gra p-5 sm:p-6">
          <h2 id="atgardad-rubrik" className="text-2xl">
            Är bristen åtgärdad?
          </h2>
          <form onSubmit={atgardad} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="datum" className="block font-semibold">
                Datum då bristen åtgärdades
              </label>
              <input
                id="datum"
                type="date"
                value={datum}
                min={vy.skickadDatum ?? undefined}
                max={idagIso()}
                onChange={(e) => setDatum(e.target.value)}
                className={`${inmatning} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="hyra" className="block font-semibold">
                Månadshyra <span className="font-normal text-dampad">(frivilligt)</span>
              </label>
              <input
                id="hyra"
                inputMode="numeric"
                value={hyra}
                onChange={(e) => setHyra(e.target.value)}
                aria-describedby="hyra-hjalp"
                className={`${inmatning} mt-2`}
              />
              <p id="hyra-hjalp" className="mt-1 text-sm text-dampad">
                Då visar vi ungefär hur mycket hyran kan sänkas.
              </p>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={arbetar !== ""} className={`${knappPrimar} disabled:opacity-70`}>
                {arbetar === "atgardad" ? "Sparar …" : "Bristen är åtgärdad"}
              </button>
            </div>
          </form>
        </section>
      )}

      {vy.status === "atgardad" && (
        <section aria-labelledby="avslutat-rubrik" className="rounded-xl bg-frost p-5 sm:p-6">
          <h2 id="avslutat-rubrik" className="text-2xl">
            Ärendet är avslutat
          </h2>
          {vy.atgardad && <p className="mt-2">Bristen åtgärdades {datumText(vy.atgardad)}.</p>}
          <p className="mt-2">
            {vy.uppskattning ?? (
              <>
                Räkna ut ungefär hur mycket hyran kan sänkas i{" "}
                <Link href="/kalkylator" className="font-semibold text-primar underline">
                  kalkylatorn
                </Link>
                .
              </>
            )}
          </p>
          <p className="mt-2">
            Hyran sänks inte av sig själv. Du behöver själv begära nedsättningen hos hyresvärden.{" "}
            <Link href="/artiklar/sa-anmaler-du-en-brist" className="font-semibold text-primar underline">
              Så gör du
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
