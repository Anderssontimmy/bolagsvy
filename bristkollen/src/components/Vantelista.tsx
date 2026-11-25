"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { brand } from "@/config/brand";
import { BRISTTYPER } from "@/data/procentsatser";
import { sparaHandelse } from "@/lib/analys";
import { HONEYPOT_FALT, valideraVantelista, type VantelistaFalt } from "@/lib/vantelista/validering";

const FALT_ID: Record<VantelistaFalt, string> = {
  epost: "v-epost",
  brist: "v-brist",
  postnummer: "v-postnummer",
  samtycke: "v-samtycke",
};

const falt =
  "block w-full rounded-xl border border-linje bg-yta px-4 py-3 text-lg text-black focus:border-primar aria-invalid:border-2 aria-invalid:border-glod";

export function Vantelista() {
  const [epost, setEpost] = useState("");
  const [brist, setBrist] = useState("");
  const [postnummer, setPostnummer] = useState("");
  const [samtycke, setSamtycke] = useState(false);
  const [fel, setFel] = useState<Partial<Record<VantelistaFalt, string>>>({});
  const [status, setStatus] = useState<"redo" | "skickar" | "klar">("redo");
  const [serverfel, setServerfel] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const tackRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "klar") tackRef.current?.focus();
  }, [status]);

  function visaFel(nyaFel: Partial<Record<VantelistaFalt, string>>) {
    setFel(nyaFel);
    const forsta = (Object.keys(FALT_ID) as VantelistaFalt[]).find((f) => nyaFel[f]);
    if (forsta) document.getElementById(FALT_ID[forsta])?.focus();
  }

  async function skicka(e: FormEvent) {
    e.preventDefault();
    setServerfel("");
    const data = { epost, brist, postnummer, samtycke, [HONEYPOT_FALT]: honeypot.current?.value ?? "" };
    const kontroll = valideraVantelista(data);
    if (!kontroll.ok) return visaFel(kontroll.fel);

    setFel({});
    setStatus("skickar");
    try {
      const svar = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: { fel?: Partial<Record<VantelistaFalt, string>>; meddelande?: string } = await svar
        .json()
        .catch(() => ({}));
      if (svar.ok) {
        setStatus("klar");
        sparaHandelse("vantelista_anmalan", brist ? { brist } : undefined);
        return;
      }
      setStatus("redo");
      if (json.fel) visaFel(json.fel);
      else setServerfel(json.meddelande ?? "Något gick fel. Försök igen om en stund.");
    } catch {
      setStatus("redo");
      setServerfel("Vi fick ingen kontakt med servern. Kontrollera din uppkoppling och försök igen.");
    }
  }

  return (
    <section
      id="vantelista"
      aria-labelledby="vantelista-rubrik"
      className="rounded-3xl bg-primar px-5 py-8 text-white sm:px-10 sm:py-12"
    >
      <div className="max-w-2xl">
        <h2 id="vantelista-rubrik" className="text-2xl font-semibold sm:text-3xl">
          Snart kan du anmäla bristen till din hyresvärd med ett klick – skriv upp dig.
        </h2>
        <p className="mt-3 text-white/90">
          Vi bygger en tjänst där du skickar en formell anmälan via e-post och sparar den som bevis. Skriv upp dig, så
          hör vi av oss när den är klar.
        </p>
      </div>

      {status === "klar" ? (
        <div className="mt-6 max-w-2xl rounded-2xl bg-yta p-5 text-black sm:p-6" role="status">
          <h3 ref={tackRef} tabIndex={-1} className="text-xl font-semibold outline-none">
            Tack! Du står nu på väntelistan.
          </h3>
          <p className="mt-2">
            Vi hör av oss när du kan anmäla bristen med ett klick. Vänta inte på oss med din anmälan – skicka den
            skriftligt redan i dag.
          </p>
        </div>
      ) : (
        <form onSubmit={skicka} noValidate className="mt-6 max-w-2xl space-y-5 rounded-2xl bg-yta p-5 text-black sm:p-6">
          <div>
            <label htmlFor="v-epost" className="mb-2 block font-bold">
              Din e-postadress
            </label>
            {fel.epost && (
              <p id="v-epost-fel" className="mb-2 font-semibold text-glod">
                {fel.epost}
              </p>
            )}
            <input
              id="v-epost"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={epost}
              onChange={(e) => setEpost(e.target.value)}
              aria-describedby={fel.epost ? "v-epost-fel" : undefined}
              aria-invalid={fel.epost ? true : undefined}
              required
              className={falt}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-[1.6fr_1fr]">
            <div>
              <label htmlFor="v-brist" className="mb-2 block font-bold">
                Vilken brist har du? <span className="font-normal text-dampad">(frivilligt)</span>
              </label>
              {fel.brist && (
                <p id="v-brist-fel" className="mb-2 font-semibold text-glod">
                  {fel.brist}
                </p>
              )}
              <select
                id="v-brist"
                value={brist}
                onChange={(e) => setBrist(e.target.value)}
                aria-describedby={fel.brist ? "v-brist-fel" : undefined}
                aria-invalid={fel.brist ? true : undefined}
                className={falt}
              >
                <option value="">Välj om du vill</option>
                {BRISTTYPER.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.namn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="v-postnummer" className="mb-2 block font-bold">
                Postnummer <span className="font-normal text-dampad">(frivilligt)</span>
              </label>
              {fel.postnummer && (
                <p id="v-postnummer-fel" className="mb-2 font-semibold text-glod">
                  {fel.postnummer}
                </p>
              )}
              <input
                id="v-postnummer"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={postnummer}
                onChange={(e) => setPostnummer(e.target.value)}
                aria-describedby={fel.postnummer ? "v-postnummer-fel" : undefined}
                aria-invalid={fel.postnummer ? true : undefined}
                className={falt}
              />
            </div>
          </div>

          {/* Honeypot: dolt för människor, robotar fyller i det. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="v-webbplats">Lämna det här fältet tomt</label>
            <input id="v-webbplats" name={HONEYPOT_FALT} type="text" tabIndex={-1} autoComplete="off" ref={honeypot} />
          </div>

          <div>
            {fel.samtycke && (
              <p id="v-samtycke-fel" className="mb-2 font-semibold text-glod">
                {fel.samtycke}
              </p>
            )}
            <div className="flex items-start gap-3">
              <input
                id="v-samtycke"
                type="checkbox"
                checked={samtycke}
                onChange={(e) => setSamtycke(e.target.checked)}
                aria-describedby={fel.samtycke ? "v-samtycke-fel" : undefined}
                aria-invalid={fel.samtycke ? true : undefined}
                className="mt-1 h-6 w-6 shrink-0"
              />
              <label htmlFor="v-samtycke">
                Jag godkänner att {brand.namn} sparar min e-postadress – och brist och postnummer om jag fyller i dem –
                för att kontakta mig om tjänsten.{" "}
                <Link href="/integritet" className="font-semibold text-primar underline">
                  Läs integritetspolicyn
                </Link>
                .
              </label>
            </div>
          </div>

          {serverfel && (
            <p className="rounded-xl border-2 border-glod bg-glod-ljus p-3 font-semibold" role="alert">
              {serverfel}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "skickar"}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primar px-6 py-3 text-lg font-bold text-white hover:bg-primar-mork disabled:opacity-70 sm:w-auto"
          >
            {status === "skickar" ? "Skickar …" : "Skriv upp mig"}
          </button>
          <p className="text-[0.95rem] text-dampad">
            Vi skickar bara mejl om tjänsten. Vill du inte stå kvar? Mejla{" "}
            <a href={`mailto:${brand.kontaktEpost}`} className="underline">
              {brand.kontaktEpost}
            </a>{" "}
            så tar vi bort dig.
          </p>
        </form>
      )}
    </section>
  );
}
