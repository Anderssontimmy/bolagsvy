"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { brand } from "@/config/brand";
import { BRISTTYPER } from "@/data/procentsatser";
import { skapaBrev, type Mejltext } from "@/lib/arende/brev";
import { valideraAnmalan, type AnmalanData, type AnmalanFalt } from "@/lib/arende/validering";
import { idagIso } from "@/lib/format";
import { HONEYPOT_FALT } from "@/lib/vantelista/validering";

type Varden = Record<Exclude<AnmalanFalt, "uppdrag">, string>;
type Fel = Partial<Record<AnmalanFalt, string>>;

const TOMT: Varden = {
  namn: "",
  epost: "",
  telefon: "",
  gatuadress: "",
  postnummer: "",
  ort: "",
  lagenhetsnummer: "",
  hyresvardNamn: "",
  hyresvardEpost: "",
  brist: "",
  temperatur: "",
  sedan: "",
  beskrivning: "",
};

/** Fältens ordning i formuläret – första felet får fokus. */
const ORDNING = Object.keys(TOMT) as (keyof Varden)[];

const inmatning =
  "block w-full rounded-xl border border-linje bg-yta px-4 py-3 text-lg text-black focus:border-primar aria-invalid:border-2 aria-invalid:border-glod";
const knapp =
  "inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-lg font-medium transition-colors disabled:opacity-70";

export function AnmalanFormular({ testlage }: { testlage: boolean }) {
  const [v, setV] = useState<Varden>(TOMT);
  const [fel, setFel] = useState<Fel>({});
  const [steg, setSteg] = useState<"fylla" | "granska" | "klar">("fylla");
  const [granskad, setGranskad] = useState<{ data: AnmalanData; brev: Mejltext } | null>(null);
  const [uppdrag, setUppdrag] = useState(false);
  const [skickar, setSkickar] = useState(false);
  const [serverfel, setServerfel] = useState("");
  const [testlank, setTestlank] = useState("");
  const [kopierad, setKopierad] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (steg !== "fylla") rubrikRef.current?.focus();
  }, [steg]);

  const satt = (falt: keyof Varden) => (varde: string) => setV((f) => ({ ...f, [falt]: varde }));

  function granska(e: FormEvent) {
    e.preventDefault();
    // Uppdraget ges i nästa steg, när man har sett texten.
    const r = valideraAnmalan({ ...v, uppdrag: true }, idagIso());
    if (!r.ok) {
      setFel(r.fel);
      const forsta = ORDNING.find((f) => r.fel[f]);
      if (forsta) document.getElementById(`a-${forsta}`)?.focus();
      return;
    }
    if (r.spam) return;
    setFel({});
    setGranskad({ data: r.data, brev: skapaBrev(r.data) });
    setSteg("granska");
  }

  async function skicka() {
    if (!uppdrag) {
      setFel({ uppdrag: "Du behöver ge oss i uppdrag att skicka anmälan i ditt namn." });
      document.getElementById("a-uppdrag")?.focus();
      return;
    }
    setFel({});
    setServerfel("");
    setSkickar(true);
    try {
      const svar = await fetch("/api/arende", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, uppdrag, [HONEYPOT_FALT]: honeypot.current?.value ?? "" }),
      });
      const json: { fel?: Fel; meddelande?: string; testlank?: string } = await svar.json().catch(() => ({}));
      if (svar.ok) {
        setTestlank(json.testlank ?? "");
        setSteg("klar");
      } else if (json.fel) {
        setFel(json.fel);
        setSteg("fylla");
      } else {
        setServerfel(json.meddelande ?? "Något gick fel. Försök igen om en stund.");
      }
    } catch {
      setServerfel("Vi fick ingen kontakt med servern. Kontrollera din uppkoppling och försök igen.");
    } finally {
      setSkickar(false);
    }
  }

  async function kopiera() {
    if (!granskad) return;
    await navigator.clipboard.writeText(`${granskad.brev.amne}\n\n${granskad.brev.text}`);
    setKopierad(true);
  }

  return (
    <div className="space-y-6">
      {testlage && (
        <p className="rounded-xl border-2 border-dashed border-glod bg-glod-ljus px-4 py-3 text-[0.95rem]">
          <strong>Testläge.</strong> Inga mejl skickas. Du kan prova hela flödet – bekräftelselänken visas på
          skärmen i stället för i ett mejl.
        </p>
      )}

      {steg === "fylla" && (
        <form
          onSubmit={granska}
          noValidate
          className="space-y-8 rounded-3xl border border-linje bg-yta p-5 shadow-[0_18px_48px_-28px_rgba(20,55,73,0.45)] sm:p-8"
        >
          {Object.keys(fel).length > 0 && (
            <p className="rounded-xl border-2 border-glod bg-glod-ljus p-4 font-semibold" role="alert">
              Kontrollera uppgifterna som är markerade nedan.
            </p>
          )}

          <Del rubrik="Om dig">
            <Falt id="namn" label="Ditt namn" varde={v.namn} onChange={satt("namn")} fel={fel.namn} autoComplete="name" />
            <Falt
              id="epost"
              label="Din e-postadress"
              hjalp="Hit skickar vi länken som du bekräftar med, och en kopia av anmälan."
              typ="email"
              varde={v.epost}
              onChange={satt("epost")}
              fel={fel.epost}
              autoComplete="email"
            />
            <Falt
              id="telefon"
              label="Telefonnummer"
              frivilligt
              typ="tel"
              varde={v.telefon}
              onChange={satt("telefon")}
              fel={fel.telefon}
              autoComplete="tel"
            />
          </Del>

          <Del rubrik="Lägenheten">
            <Falt
              id="gatuadress"
              label="Gatuadress"
              varde={v.gatuadress}
              onChange={satt("gatuadress")}
              fel={fel.gatuadress}
              autoComplete="street-address"
            />
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
              <Falt
                id="postnummer"
                label="Postnummer"
                varde={v.postnummer}
                onChange={satt("postnummer")}
                fel={fel.postnummer}
                autoComplete="postal-code"
                inputMode="numeric"
              />
              <Falt id="ort" label="Ort" varde={v.ort} onChange={satt("ort")} fel={fel.ort} autoComplete="address-level2" />
            </div>
            <Falt
              id="lagenhetsnummer"
              label="Lägenhetsnummer"
              hjalp="Står ofta i hyresavtalet eller på dörren, till exempel 1102."
              varde={v.lagenhetsnummer}
              onChange={satt("lagenhetsnummer")}
              fel={fel.lagenhetsnummer}
            />
          </Del>

          <Del rubrik="Hyresvärden">
            <Falt
              id="hyresvardNamn"
              label="Hyresvärdens namn"
              hjalp="Till exempel bostadsbolagets namn."
              varde={v.hyresvardNamn}
              onChange={satt("hyresvardNamn")}
              fel={fel.hyresvardNamn}
              autoComplete="organization"
            />
            <Falt
              id="hyresvardEpost"
              label="Hyresvärdens e-postadress för felanmälan"
              hjalp="Står ofta i hyresavtalet eller på hyresvärdens webbplats. Har hyresvärden bara ett formulär på webben? Fyll i en annan adress till hyresvärden, eller kopiera texten i nästa steg och klistra in den i formuläret."
              typ="email"
              varde={v.hyresvardEpost}
              onChange={satt("hyresvardEpost")}
              fel={fel.hyresvardEpost}
            />
          </Del>

          <Del rubrik="Bristen">
            <Falt id="brist" label="Vilken typ av brist?" fel={fel.brist}>
              <select
                id="a-brist"
                value={v.brist}
                onChange={(e) => satt("brist")(e.target.value)}
                aria-invalid={fel.brist ? true : undefined}
                aria-describedby={fel.brist ? "a-brist-fel" : undefined}
                className={inmatning}
              >
                <option value="">Välj brist</option>
                {BRISTTYPER.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.namn}
                  </option>
                ))}
              </select>
            </Falt>
            {v.brist === "kyla" && (
              <Falt
                id="temperatur"
                label="Uppmätt temperatur inomhus (°C)"
                frivilligt
                hjalp="Till exempel 17,5. Skriv den lägsta du har mätt i ett rum där du vistas."
                varde={v.temperatur}
                onChange={satt("temperatur")}
                fel={fel.temperatur}
                inputMode="decimal"
              />
            )}
            <Falt id="sedan" label="Sedan när finns bristen?" typ="date" varde={v.sedan} onChange={satt("sedan")} fel={fel.sedan} />
            <Falt
              id="beskrivning"
              label="Beskriv bristen"
              hjalp="Vad är fel, i vilka rum och hur det påverkar dig. Korta meningar räcker."
              fel={fel.beskrivning}
            >
              <textarea
                id="a-beskrivning"
                rows={5}
                maxLength={2000}
                value={v.beskrivning}
                onChange={(e) => satt("beskrivning")(e.target.value)}
                aria-invalid={fel.beskrivning ? true : undefined}
                aria-describedby={["a-beskrivning-hjalp", fel.beskrivning ? "a-beskrivning-fel" : ""].join(" ").trim()}
                className={inmatning}
              />
            </Falt>
          </Del>

          {/* Honeypot: dolt för människor, robotar fyller i det. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="a-webbplats">Lämna det här fältet tomt</label>
            <input id="a-webbplats" type="text" tabIndex={-1} autoComplete="off" ref={honeypot} />
          </div>

          <button type="submit" className={`${knapp} w-full bg-persika text-black hover:bg-persika-mork sm:w-auto`}>
            Granska anmälan
          </button>
        </form>
      )}

      {steg === "granska" && granskad && (
        <section aria-labelledby="granska-rubrik" className="space-y-5">
          <h2 id="granska-rubrik" ref={rubrikRef} tabIndex={-1} className="text-2xl font-semibold outline-none sm:text-3xl">
            Så här ser anmälan ut
          </h2>
          <p>Läs igenom texten. Det är exakt det här som skickas till hyresvärden.</p>

          <div className="overflow-hidden rounded-2xl border border-linje bg-yta">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 border-b border-linje bg-frost px-5 py-4 text-[0.95rem] sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="text-dampad">Till</dt>
              <dd className="font-semibold break-words">
                {granskad.data.hyresvardNamn} &lt;{granskad.data.hyresvardEpost}&gt;
              </dd>
              <dt className="text-dampad">Kopia</dt>
              <dd className="font-semibold break-words">{granskad.data.epost} (du)</dd>
              <dt className="text-dampad">Ämne</dt>
              <dd className="font-semibold">{granskad.brev.amne}</dd>
            </dl>
            <p className="px-5 py-5 font-sans text-[1rem] leading-relaxed break-words whitespace-pre-wrap">{granskad.brev.text}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setSteg("fylla")}
              className={`${knapp} border-2 border-black bg-yta text-black hover:bg-gra`}
            >
              Ändra
            </button>
            <button
              type="button"
              onClick={kopiera}
              className={`${knapp} border-2 border-linje bg-yta text-black hover:border-primar`}
            >
              {kopierad ? "Texten är kopierad" : "Kopiera texten"}
            </button>
          </div>

          <div className="rounded-2xl border border-linje bg-yta p-5 sm:p-6">
            {fel.uppdrag && (
              <p id="a-uppdrag-fel" className="mb-2 font-semibold text-glod">
                {fel.uppdrag}
              </p>
            )}
            <div className="flex items-start gap-3">
              <input
                id="a-uppdrag"
                type="checkbox"
                checked={uppdrag}
                onChange={(e) => setUppdrag(e.target.checked)}
                aria-invalid={fel.uppdrag ? true : undefined}
                aria-describedby={fel.uppdrag ? "a-uppdrag-fel" : undefined}
                className="mt-1 h-6 w-6 shrink-0"
              />
              <label htmlFor="a-uppdrag">
                Jag ger {brand.namn} i uppdrag att skicka anmälan i mitt namn till hyresvärden. Uppgifterna stämmer.{" "}
                <Link href="/integritet" className="font-semibold text-primar underline">
                  Så hanterar vi dina uppgifter
                </Link>
                .
              </label>
            </div>
            <p className="mt-4 text-[0.95rem] text-dampad">
              Vi skickar först en länk till {granskad.data.epost}. Ingenting går till hyresvärden förrän du har
              öppnat länken och tryckt på Skicka.
            </p>
            {serverfel && (
              <p className="mt-4 rounded-xl border-2 border-glod bg-glod-ljus p-3 font-semibold" role="alert">
                {serverfel}
              </p>
            )}
            <button
              type="button"
              onClick={skicka}
              disabled={skickar}
              className={`${knapp} mt-5 w-full bg-persika text-black hover:bg-persika-mork sm:w-auto`}
            >
              {skickar ? "Skickar …" : "Skicka bekräftelselänk till min e-post"}
            </button>
          </div>
        </section>
      )}

      {steg === "klar" && granskad && (
        <section className="rounded-2xl border border-primar/25 bg-frost p-5 sm:p-7" role="status">
          <h2 ref={rubrikRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
            Kolla din e-post
          </h2>
          <p className="mt-3">
            Vi har skickat en länk till <strong>{granskad.data.epost}</strong>. Öppna länken och tryck på Skicka. Då
            går anmälan till {granskad.data.hyresvardNamn}. Länken gäller i 24 timmar.
          </p>
          <p className="mt-3 text-[0.95rem] text-dampad">Hittar du inte mejlet? Titta i skräpposten.</p>
          {testlank && (
            <p className="mt-5 rounded-xl border-2 border-dashed border-glod bg-glod-ljus p-4">
              <strong>Testläge:</strong> inget mejl skickades.{" "}
              <a href={testlank} className="font-semibold text-primar underline">
                Öppna bekräftelselänken
              </a>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Del({ rubrik, children }: { rubrik: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-4 font-serif text-xl font-semibold">{rubrik}</legend>
      {children}
    </fieldset>
  );
}

function Falt({
  id,
  label,
  hjalp,
  frivilligt = false,
  typ = "text",
  varde,
  onChange,
  fel,
  autoComplete,
  inputMode,
  children,
}: {
  id: string;
  label: string;
  hjalp?: string;
  frivilligt?: boolean;
  typ?: "text" | "email" | "tel" | "date";
  varde?: string;
  onChange?: (v: string) => void;
  fel?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "decimal";
  children?: ReactNode;
}) {
  const falt = `a-${id}`;
  const beskrivning = [hjalp ? `${falt}-hjalp` : "", fel ? `${falt}-fel` : ""].join(" ").trim() || undefined;
  return (
    <div>
      <label htmlFor={falt} className="mb-2 block font-bold">
        {label} {frivilligt && <span className="font-normal text-dampad">(frivilligt)</span>}
      </label>
      {hjalp && (
        <p id={`${falt}-hjalp`} className="-mt-1 mb-2 text-[0.95rem] text-dampad">
          {hjalp}
        </p>
      )}
      {fel && (
        <p id={`${falt}-fel`} className="mb-2 font-semibold text-glod">
          {fel}
        </p>
      )}
      {children ?? (
        <input
          id={falt}
          type={typ}
          value={varde}
          onChange={(e) => onChange?.(e.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={fel ? true : undefined}
          aria-describedby={beskrivning}
          className={inmatning}
        />
      )}
    </div>
  );
}
