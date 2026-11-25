"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { BRISTTYPER, PROCENTSATSER, arBristId, type ProcentRad, type RadId } from "@/data/procentsatser";
import { sparaHandelse } from "@/lib/analys";
import { datumText, idagIso, kronor, kronorSpann, procentSpann, tolkaTal } from "@/lib/format";
import { raknaUt, type Falt, type KalkylResultat } from "@/lib/kalkylator";

type JaNej = "" | "ja" | "nej";

/** Id för det fält som får fokus när man klickar på ett fel i felsammanfattningen. */
const FALT_ID: Record<Falt, string> = {
  brist: `k-brist-${BRISTTYPER[0].id}`,
  temperatur: "k-temperatur",
  ytaTotal: "k-yta-total",
  ytaObrukbar: "k-yta-obrukbar",
  manadshyra: "k-hyra",
  anmaldSkriftligt: "k-anmald-ja",
  anmalanDatum: "k-anmalan-datum",
  atgardad: "k-atgardad-ja",
  atgardDatum: "k-atgard-datum",
};
const FALT_ORDNING = Object.keys(FALT_ID) as Falt[];

const UNDERHALL: RadId[] = ["renovering", "kok_badrum"];
const decimal = (n: number) => String(n).replace(".", ",");

const falt =
  "block w-full rounded-xl border border-linje bg-yta px-4 py-3 text-lg text-black placeholder:text-dampad/70 focus:border-primar aria-invalid:border-glod aria-invalid:border-2";

export function Kalkylator() {
  const [brist, setBrist] = useState("");
  const [temperatur, setTemperatur] = useState("");
  const [ytaTotal, setYtaTotal] = useState("");
  const [ytaObrukbar, setYtaObrukbar] = useState("");
  const [hyra, setHyra] = useState("");
  const [anmald, setAnmald] = useState<JaNej>("");
  const [anmalanDatum, setAnmalanDatum] = useState("");
  const [atgardad, setAtgardad] = useState<JaNej>("");
  const [atgardDatum, setAtgardDatum] = useState("");
  const [utfall, setUtfall] = useState<{ r: KalkylResultat; hyra: number } | null>(null);

  const startad = useRef(false);
  const fokusRef = useRef<HTMLHeadingElement>(null);

  // Vattenskada räknas på den yta som inte går att använda och behöver två extra frågor.
  const valdRad = arBristId(brist) && brist !== "kyla" ? (PROCENTSATSER[brist] as ProcentRad) : null;
  const paYta = valdRad?.berakning === "yta";
  const extraFragor = brist === "kyla" ? 1 : paYta ? 2 : 0;

  useEffect(() => {
    if (utfall) fokusRef.current?.focus();
  }, [utfall]);

  function vidAndring() {
    if (!startad.current) {
      startad.current = true;
      sparaHandelse("kalkylator_start");
    }
    // Ett gammalt resultat ska inte stå kvar när uppgifterna ändras.
    if (utfall) setUtfall(null);
  }

  function rakna(e: FormEvent) {
    e.preventDefault();
    const manadshyra = tolkaTal(hyra);
    const r = raknaUt({
      brist,
      manadshyra,
      temperatur: brist === "kyla" ? tolkaTal(temperatur) : null,
      ytaTotal: paYta ? tolkaTal(ytaTotal) : null,
      ytaObrukbar: paYta ? tolkaTal(ytaObrukbar) : null,
      anmaldSkriftligt: anmald === "" ? null : anmald === "ja",
      anmalanDatum: anmald === "ja" ? anmalanDatum : "",
      atgardad: anmald !== "ja" || atgardad === "" ? null : atgardad === "ja",
      atgardDatum: atgardad === "ja" ? atgardDatum : "",
      idag: idagIso(),
    });
    setUtfall({ r, hyra: manadshyra ?? 0 });
    if (r.typ !== "fel") sparaHandelse("kalkylator_klar", { brist, utfall: r.typ });
  }

  const fel = utfall?.r.typ === "fel" ? utfall.r.fel : {};

  return (
    <div className="rounded-3xl border border-linje bg-yta p-5 shadow-[0_18px_48px_-28px_rgba(20,55,73,0.45)] sm:p-8">
      <form onSubmit={rakna} onChange={vidAndring} noValidate className="space-y-7">
        {utfall?.r.typ === "fel" && (
          <div className="rounded-xl border-2 border-glod bg-glod-ljus p-4" role="alert">
            <h3 ref={fokusRef} tabIndex={-1} className="font-sans text-lg font-bold outline-none">
              Kontrollera uppgifterna
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {FALT_ORDNING.filter((f) => fel[f]).map((f) => (
                <li key={f}>
                  <a href={`#${FALT_ID[f]}`} className="underline">
                    {fel[f]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Grupp legend="Vilken typ av brist har du?" nummer={1} fel={fel.brist} felId="k-brist-fel">
          <div className="grid gap-2 sm:grid-cols-2">
            {BRISTTYPER.map((b) => (
              <Alternativ
                key={b.id}
                id={`k-brist-${b.id}`}
                name="brist"
                checked={brist === b.id}
                onChange={() => setBrist(b.id)}
              >
                {b.namn}
              </Alternativ>
            ))}
          </div>
          <p className="mt-3 text-[0.95rem] text-dampad">
            Kan du inte använda kök eller badrum under ett stambyte? Välj det alternativet.
          </p>
        </Grupp>

        {brist === "kyla" && (
          <Textfalt
            id="k-temperatur"
            nummer={2}
            label="Vilken temperatur har du mätt upp inomhus?"
            hjalp="Skriv temperaturen i grader Celsius, till exempel 17,5."
            enhet="°C"
            varde={temperatur}
            onChange={setTemperatur}
            inputMode="decimal"
            fel={fel.temperatur}
          />
        )}

        {paYta && (
          <>
            <Textfalt
              id="k-yta-total"
              nummer={2}
              label="Hur stor är din lägenhet?"
              hjalp="Skriv ytan i kvadratmeter. Den står ofta i hyresavtalet."
              enhet="kvm"
              varde={ytaTotal}
              onChange={setYtaTotal}
              inputMode="decimal"
              fel={fel.ytaTotal}
            />
            <Textfalt
              id="k-yta-obrukbar"
              nummer={3}
              label="Hur stor yta kan du inte använda på grund av skadan?"
              hjalp="Till exempel ett sovrum på 12 kvm. Räkna bara yta som inte går att använda alls."
              enhet="kvm"
              varde={ytaObrukbar}
              onChange={setYtaObrukbar}
              inputMode="decimal"
              fel={fel.ytaObrukbar}
            />
          </>
        )}

        <Textfalt
          id="k-hyra"
          nummer={2 + extraFragor}
          label="Hur hög är din månadshyra?"
          hjalp="Skriv hyran i kronor per månad, till exempel 8 500."
          enhet="kr"
          varde={hyra}
          onChange={setHyra}
          inputMode="numeric"
          fel={fel.manadshyra}
        />

        <Grupp
          legend="Har du anmält bristen skriftligt till hyresvärden?"
          nummer={3 + extraFragor}
          hjalp="Skriftligt betyder till exempel brev, e-post eller hyresvärdens formulär för felanmälan – något du kan visa upp i efterhand."
          hjalpId="k-anmald-hjalp"
          fel={fel.anmaldSkriftligt}
          felId="k-anmald-fel"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Alternativ id="k-anmald-ja" name="anmald" checked={anmald === "ja"} onChange={() => setAnmald("ja")}>
              Ja
            </Alternativ>
            <Alternativ id="k-anmald-nej" name="anmald" checked={anmald === "nej"} onChange={() => setAnmald("nej")}>
              Nej, inte skriftligt
            </Alternativ>
          </div>
        </Grupp>

        {anmald === "ja" && (
          <>
            <Textfalt
              id="k-anmalan-datum"
              label="Vilket datum fick hyresvärden din anmälan?"
              hjalp="Nedsättningen räknas från den dagen. Vet du inte exakt? Välj hellre ett senare datum än ett för tidigt."
              varde={anmalanDatum}
              onChange={setAnmalanDatum}
              typ="date"
              fel={fel.anmalanDatum}
            />

            <Grupp legend="Är bristen åtgärdad?" fel={fel.atgardad} felId="k-atgardad-fel">
              <div className="grid gap-2 sm:grid-cols-2">
                <Alternativ
                  id="k-atgardad-ja"
                  name="atgardad"
                  checked={atgardad === "ja"}
                  onChange={() => setAtgardad("ja")}
                >
                  Ja
                </Alternativ>
                <Alternativ
                  id="k-atgardad-nej"
                  name="atgardad"
                  checked={atgardad === "nej"}
                  onChange={() => setAtgardad("nej")}
                >
                  Nej, inte än
                </Alternativ>
              </div>
              {atgardad === "nej" && <p className="mt-3 text-[0.95rem] text-dampad">Då räknar vi dagarna fram till i dag.</p>}
            </Grupp>

            {atgardad === "ja" && (
              <Textfalt
                id="k-atgard-datum"
                label="Vilket datum blev bristen åtgärdad?"
                varde={atgardDatum}
                onChange={setAtgardDatum}
                typ="date"
                fel={fel.atgardDatum}
              />
            )}
          </>
        )}

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primar px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-primar-mork sm:w-auto"
        >
          Räkna ut
        </button>
      </form>

      {utfall && utfall.r.typ !== "fel" && (
        <div className="fram mt-8">
          <Resultat r={utfall.r} hyra={utfall.hyra} rubrikRef={fokusRef} />
        </div>
      )}
    </div>
  );
}

function Grupp({
  legend,
  nummer,
  hjalp,
  hjalpId,
  fel,
  felId,
  children,
}: {
  legend: string;
  nummer?: number;
  hjalp?: string;
  hjalpId?: string;
  fel?: string;
  felId: string;
  children: ReactNode;
}) {
  const beskrivning = [hjalp ? hjalpId : null, fel ? felId : null].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset aria-describedby={beskrivning}>
      <legend className="mb-3 text-lg font-bold">
        {nummer !== undefined && (
          <span aria-hidden="true" className="mr-2 font-serif text-glod">
            {nummer}.
          </span>
        )}
        {legend}
      </legend>
      {hjalp && (
        <p id={hjalpId} className="-mt-1 mb-3 text-[0.95rem] text-dampad">
          {hjalp}
        </p>
      )}
      {fel && (
        <p id={felId} className="mb-3 font-semibold text-glod">
          {fel}
        </p>
      )}
      {children}
    </fieldset>
  );
}

function Alternativ({
  id,
  name,
  checked,
  onChange,
  children,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 leading-snug transition-colors ${
        checked ? "border-primar bg-frost font-semibold" : "border-linje bg-yta hover:border-primar"
      }`}
    >
      <input id={id} type="radio" name={name} checked={checked} onChange={onChange} className="h-5 w-5 shrink-0" />
      <span>{children}</span>
    </label>
  );
}

function Textfalt({
  id,
  nummer,
  label,
  hjalp,
  enhet,
  varde,
  onChange,
  typ = "text",
  inputMode,
  fel,
}: {
  id: string;
  nummer?: number;
  label: string;
  hjalp?: string;
  enhet?: string;
  varde: string;
  onChange: (v: string) => void;
  typ?: "text" | "date";
  inputMode?: "numeric" | "decimal";
  fel?: string;
}) {
  const beskrivning = [hjalp ? `${id}-hjalp` : null, fel ? `${id}-fel` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-3 block text-lg font-bold">
        {nummer !== undefined && (
          <span aria-hidden="true" className="mr-2 font-serif text-glod">
            {nummer}.
          </span>
        )}
        {label}
      </label>
      {hjalp && (
        <p id={`${id}-hjalp`} className="-mt-1 mb-3 text-[0.95rem] text-dampad">
          {hjalp}
        </p>
      )}
      {fel && (
        <p id={`${id}-fel`} className="mb-3 font-semibold text-glod">
          {fel}
        </p>
      )}
      <div className="flex max-w-xs items-center gap-3">
        <input
          id={id}
          type={typ}
          inputMode={inputMode}
          autoComplete="off"
          value={varde}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={beskrivning}
          aria-invalid={fel ? true : undefined}
          className={falt}
        />
        {enhet && (
          <span className="text-lg font-semibold text-dampad" aria-hidden="true">
            {enhet}
          </span>
        )}
      </div>
    </div>
  );
}

function Resultat({
  r,
  hyra,
  rubrikRef,
}: {
  r: Exclude<KalkylResultat, { typ: "fel" }>;
  hyra: number;
  rubrikRef: RefObject<HTMLHeadingElement | null>;
}) {
  const rubrik = "font-serif text-2xl font-semibold outline-none";

  if (r.typ === "inte_kallt") {
    return (
      <Ruta ton="lugn">
        <h3 ref={rubrikRef} tabIndex={-1} className={rubrik}>
          Vi kan inte uppskatta någon nedsättning för kyla
        </h3>
        <p className="mt-3">
          Du har mätt upp {String(r.temperatur).replace(".", ",")} °C. Det är inte under de riktvärden vi utgår från:
          18 °C enligt Folkhälsomyndigheten och 20 °C enligt Hyresgästföreningen.
        </p>
        <p className="mt-3">Har du en annan brist? Välj den i listan och räkna igen.</p>
      </Ruta>
    );
  }

  if (r.typ === "ej_anmald") {
    return (
      <Ruta ton="varning">
        <h3 ref={rubrikRef} tabIndex={-1} className={rubrik}>
          Du kan inte räkna med någon nedsättning för tiden hittills
        </h3>
        <p className="mt-3">
          Hyran kan sänkas först från den dag hyresvärden får veta om bristen. Utan en skriftlig anmälan är det svårt
          att visa vilken dag det var.
        </p>
        {r.perDag ? (
          <>
            <p className="mt-4 text-xl font-bold">
              Varje dag utan skriftlig anmälan kan kosta dig ungefär {kronorSpann(r.perDag)}.
            </p>
            <Etikett />
            <Kalla rad={r.rad} />
          </>
        ) : (
          <p className="mt-4 text-xl font-bold">Vi kan inte uppskatta beloppet än – anmäl ändå.</p>
        )}
        <p className="mt-5 text-lg font-bold">Anmäl bristen skriftligt i dag.</p>
        <NastaSteg />
      </Ruta>
    );
  }

  if (r.typ === "inget_varde") {
    return (
      <Ruta ton="lugn">
        <h3 ref={rubrikRef} tabIndex={-1} className={rubrik}>
          Vi kan inte uppskatta beloppet än – anmäl ändå
        </h3>
        <p className="mt-3">
          Vi har inget underlag för att uppskatta nedsättningen för {r.rad.namn.toLowerCase()} ännu. Du kan ändå ha rätt
          till sänkt hyra. Hur mycket bedöms från fall till fall.
        </p>
        <NastaSteg />
      </Ruta>
    );
  }

  const dagText = r.dagar === 1 ? "1 dag" : `${r.dagar} dagar`;
  return (
    <Ruta ton="lugn">
      <h3 ref={rubrikRef} tabIndex={-1} className={rubrik}>
        Din uppskattning
      </h3>
      {r.dagar === 0 ? (
        <p className="mt-3 text-lg">
          Bristen åtgärdades samma dag som hyresvärden fick din anmälan. Då finns det inga dagar att räkna.
        </p>
      ) : (
        <>
          <p className="mt-2 font-serif text-4xl font-semibold tracking-tight text-primar sm:text-5xl">
            {kronorSpann(r.belopp)}
          </p>
          <Etikett />
        </>
      )}

      <dl className="mt-6 grid gap-4 border-t border-linje pt-5 text-[0.95rem] sm:grid-cols-2">
        <Rad term="Brist">{r.rad.namn}</Rad>
        <Rad term="Procent av månadshyran">
          {procentSpann(r.procent)}
          {r.yta && ` (${decimal(r.yta.obrukbar)} av ${decimal(r.yta.total)} kvm går inte att använda)`} (utkast)
        </Rad>
        <Rad term="Antal dagar">
          {dagText}, från {datumText(r.fran)} till {r.pagaende ? `i dag (${datumText(r.till)})` : datumText(r.till)}
        </Rad>
        <Rad term="Så räknade vi">
          {kronor(hyra)} × {procentSpann(r.procent)} × {dagText} ÷ 30
        </Rad>
      </dl>

      {r.pagaende && (
        <p className="mt-5">Bristen finns kvar. Beloppet kan växa för varje dag tills bristen är åtgärdad.</p>
      )}
      {UNDERHALL.includes(r.radId) && (
        <p className="mt-4">
          Gäller det underhåll, till exempel ett stambyte? Då kan ditt hyresavtal begränsa rätten till nedsättning.{" "}
          <Link href="/artiklar/stambyte-och-renovering" className="font-semibold text-primar underline">
            Läs mer om stambyte och renovering
          </Link>
          .
        </p>
      )}
      <Kalla rad={r.rad} />
      <p className="mt-5 text-lg font-bold">Nästa steg: begär nedsättningen skriftligt och spara en kopia.</p>
      <NastaSteg />
    </Ruta>
  );
}

function Ruta({ ton, children }: { ton: "lugn" | "varning"; children: ReactNode }) {
  const stil = ton === "varning" ? "border-2 border-glod bg-glod-ljus" : "border border-primar/25 bg-frost";
  return <section className={`rounded-2xl p-5 sm:p-7 ${stil}`}>{children}</section>;
}

function Etikett() {
  return (
    <p className="mt-3 inline-flex rounded-full border border-linje bg-yta px-3 py-1 text-sm font-bold">
      Uppskattning – ingen garanti
    </p>
  );
}

function Rad({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-dampad">{term}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

function Kalla({ rad }: { rad: ProcentRad }) {
  return (
    <p className="mt-4 text-[0.95rem] text-dampad">
      Procentsatserna är riktmärken och inte bindande. Hur mycket hyran sänks bedöms från fall till fall. Källa:{" "}
      {rad.kallaUrl ? (
        <a href={rad.kallaUrl} className="underline" rel="noopener noreferrer">
          {rad.kalla}
        </a>
      ) : (
        rad.kalla
      )}
      .
    </p>
  );
}

function NastaSteg() {
  return (
    <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <li>
        <Link
          href="/artiklar/sa-anmaler-du-en-brist"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primar px-5 py-3 font-bold text-white hover:bg-primar-mork sm:w-auto"
        >
          Så anmäler du en brist
        </Link>
      </li>
      <li>
        <a
          href="#vantelista"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-primar bg-yta px-5 py-3 font-bold text-primar hover:bg-frost sm:w-auto"
        >
          Skriv upp dig på väntelistan
        </a>
      </li>
    </ul>
  );
}
