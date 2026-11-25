"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { knappPrimar } from "@/components/knappar";
import { sparaHandelse } from "@/lib/analys";
import { tidText } from "@/lib/format";

type Anmalan = {
  status: "vantar" | "skickad";
  utgangen: boolean;
  hyresvardNamn: string;
  hyresvardEpost: string;
  hyresgastEpost: string;
  amne: string;
  innehall: string;
  skickad: string | null;
  testlage: boolean;
};

type Tillstand =
  | { typ: "laddar" }
  | { typ: "fel"; meddelande: string }
  | { typ: "visa"; a: Anmalan; skickar: boolean; fel: string }
  | { typ: "klar"; a: Anmalan; skickad: string; kvitto: string | null };

async function anrop(token: string, skicka: boolean) {
  const svar = await fetch("/api/anmalan/bekrafta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, skicka }),
  });
  return { ok: svar.ok, json: await svar.json().catch(() => ({})) };
}

/** Token ligger efter # i länken. Den skickas aldrig till servern i adressen och hamnar inte i loggar. */
const lasToken = () => window.location.hash.slice(1);

export function Bekraftelse() {
  const [t, setT] = useState<Tillstand>({ typ: "laddar" });
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let avbruten = false;
    (async () => {
      const token = lasToken();
      const { ok, json } = token
        ? await anrop(token, false)
        : { ok: false, json: { meddelande: "Länken saknar en kod. Öppna länken från mejlet igen." } };
      if (avbruten) return;
      if (!ok) setT({ typ: "fel", meddelande: json.meddelande ?? "Något gick fel. Försök igen." });
      else if (json.status === "skickad") setT({ typ: "klar", a: json, skickad: json.skickad, kvitto: null });
      else setT({ typ: "visa", a: json, skickar: false, fel: "" });
    })();
    return () => {
      avbruten = true;
    };
  }, []);

  useEffect(() => {
    if (t.typ === "klar") rubrikRef.current?.focus();
  }, [t.typ]);

  async function skicka() {
    if (t.typ !== "visa") return;
    setT({ ...t, skickar: true, fel: "" });
    try {
      const { ok, json } = await anrop(lasToken(), true);
      if (ok) {
        setT({ typ: "klar", a: t.a, skickad: json.skickad, kvitto: json.kvitto ?? null });
        sparaHandelse("anmalan_skickad");
      } else {
        setT({ ...t, skickar: false, fel: json.meddelande ?? "Anmälan kunde inte skickas. Försök igen." });
      }
    } catch {
      setT({ ...t, skickar: false, fel: "Vi fick ingen kontakt med servern. Försök igen." });
    }
  }

  if (t.typ === "laddar") return <p aria-live="polite">Hämtar din anmälan …</p>;

  if (t.typ === "fel") {
    return (
      <div className="rounded-2xl border-2 border-glod bg-glod-ljus p-5" role="alert">
        <p className="font-semibold">{t.meddelande}</p>
        <Link href="/anmal" className="mt-3 inline-block font-semibold text-primar underline">
          Fyll i en ny anmälan
        </Link>
      </div>
    );
  }

  if (t.typ === "klar") {
    return (
      <section className="rounded-2xl border border-primar/25 bg-frost p-5 sm:p-7" role="status">
        <h2 ref={rubrikRef} tabIndex={-1} className="text-2xl font-semibold outline-none sm:text-3xl">
          Anmälan är skickad
        </h2>
        <p className="mt-3 text-lg">
          Skickad {tidText(t.skickad)} till {t.a.hyresvardNamn} ({t.a.hyresvardEpost}).
        </p>
        {t.a.testlage ? (
          <p className="mt-4 rounded-xl border-2 border-dashed border-glod bg-glod-ljus p-4">
            <strong>Testläge:</strong> inget mejl skickades. I skarpt läge hade anmälan gått till {t.a.hyresvardEpost}{" "}
            med kopia till {t.a.hyresgastEpost}.
          </p>
        ) : (
          <p className="mt-3">
            Du har fått en kopia på {t.a.hyresgastEpost}. <strong>Spara den – den är ditt bevis</strong> på vilken dag
            hyresvärden fick veta om bristen. Svar från hyresvärden kommer direkt till dig.
          </p>
        )}
        {t.kvitto && <p className="mt-3 text-[0.95rem] text-dampad">Kvitto: {t.kvitto}</p>}
        <h3 className="mt-6 text-xl font-semibold">Nästa steg</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Fortsätt att dokumentera: foton, temperatur och datum.</li>
          <li>Betala hyran som vanligt. Håll aldrig inne hyran.</li>
          <li>Räkna ut ungefär hur mycket hyran kan sänkas.</li>
        </ul>
        <Link href="/kalkylator" className={`${knappPrimar} mt-5 w-full sm:w-auto`}>
          Till kalkylatorn
        </Link>
      </section>
    );
  }

  const { a } = t;
  if (a.utgangen) {
    return (
      <div className="rounded-2xl border-2 border-glod bg-glod-ljus p-5" role="alert">
        <p className="font-semibold">Länken har gått ut. Fyll i formuläret igen så får du en ny länk.</p>
        <Link href="/anmal" className="mt-3 inline-block font-semibold text-primar underline">
          Fyll i en ny anmälan
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {a.testlage && (
        <p className="rounded-xl border-2 border-dashed border-glod bg-glod-ljus px-4 py-3 text-[0.95rem]">
          <strong>Testläge.</strong> Inget mejl skickas när du trycker på knappen.
        </p>
      )}
      <p>Läs igenom anmälan en sista gång. När du trycker på knappen skickas den till hyresvärden.</p>
      <div className="overflow-hidden rounded-2xl border border-linje bg-yta">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 border-b border-linje bg-frost px-5 py-4 text-[0.95rem] sm:grid-cols-[auto_minmax(0,1fr)]">
          <dt className="text-dampad">Till</dt>
          <dd className="font-semibold break-words">
            {a.hyresvardNamn} &lt;{a.hyresvardEpost}&gt;
          </dd>
          <dt className="text-dampad">Kopia</dt>
          <dd className="font-semibold break-words">{a.hyresgastEpost} (du)</dd>
          <dt className="text-dampad">Ämne</dt>
          <dd className="font-semibold">{a.amne}</dd>
        </dl>
        <p className="px-5 py-5 leading-relaxed break-words whitespace-pre-wrap">{a.innehall}</p>
      </div>
      {t.fel && (
        <p className="rounded-xl border-2 border-glod bg-glod-ljus p-3 font-semibold" role="alert">
          {t.fel}
        </p>
      )}
      <button
        type="button"
        onClick={skicka}
        disabled={t.skickar}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primar px-6 py-3 text-lg font-bold text-white hover:bg-primar-mork disabled:opacity-70 sm:w-auto"
      >
        {t.skickar ? "Skickar …" : `Skicka anmälan till ${a.hyresvardNamn}`}
      </button>
    </section>
  );
}
