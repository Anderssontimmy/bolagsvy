import Link from "next/link";
import { Kalkylator } from "@/components/Kalkylator";
import { utskickLage } from "@/lib/anmalan/tjanst";
import { SaFunkarDet } from "@/components/SaFunkarDet";
import { TempSkala } from "@/components/TempSkala";
import { VanligaFragor } from "@/components/VanligaFragor";
import { Vantelista } from "@/components/Vantelista";
import { knappPrimar, knappSekundar } from "@/components/knappar";
import { ARTIKLAR } from "@/content/artiklar";

export default function Startsida() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 -right-40 h-[30rem] w-[30rem] rounded-full bg-glod/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-40 -left-52 h-[26rem] w-[26rem] rounded-full bg-primar/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-5xl gap-10 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1.25fr_1fr] md:items-center md:pt-16">
          <div className="fram">
            <p className="text-sm font-bold tracking-[0.08em] text-glod uppercase">För dig som hyr i första hand</p>
            <h1 className="mt-3 text-[2.15rem] font-semibold tracking-tight sm:text-5xl">
              Kallt hemma eller trasigt i lägenheten?{" "}
              <span className="text-primar">Du kan ha rätt till sänkt hyra.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-dampad">
              Hyran kan sänkas när lägenheten har brister. Men bara från den dag hyresvärden får veta om bristen.
              Därför ska du anmäla skriftligt – och tidigt.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#kalkylator" className={knappPrimar}>
                Räkna ut din nedsättning
              </a>
              <Link href="/artiklar/sa-anmaler-du-en-brist" className={knappSekundar}>
                Så anmäler du en brist
              </Link>
            </div>
          </div>
          <div className="fram fram-2">
            <TempSkala />
          </div>
        </div>
      </section>

      <section aria-labelledby="sa-funkar-det" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2 id="sa-funkar-det" className="text-3xl font-semibold">
          Så funkar det
        </h2>
        <p className="mt-2 text-lg text-dampad">Tre steg. Det första är det viktigaste.</p>
        <div className="mt-7">
          <SaFunkarDet />
        </div>
      </section>

      <section id="kalkylator" aria-labelledby="kalkylator-rubrik" className="border-y border-linje bg-frost/60">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 id="kalkylator-rubrik" className="text-3xl font-semibold">
            Räkna ut ungefär hur mycket
          </h2>
          <p className="mt-2 text-lg text-dampad">
            Svara på några frågor så får du en uppskattning i kronor. Vi sparar inte din hyra eller dina datum.
          </p>
          <div className="mt-8">
            <Kalkylator anmalanAktiv={utskickLage() !== "av"} />
          </div>
        </div>
      </section>

      <section aria-labelledby="hall-inte-inne" className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
        <div className="rounded-2xl border-2 border-glod bg-glod-ljus p-5 sm:p-7">
          <h2 id="hall-inte-inne" className="text-2xl font-semibold">
            Håll aldrig inne hyran
          </h2>
          <p className="mt-2 max-w-3xl">
            Även om lägenheten har stora brister: betala hyran. Annars riskerar du att förlora lägenheten. Är du och
            hyresvärden oense om beloppet kan du deponera den delen hos länsstyrelsen i stället.{" "}
            <Link href="/artiklar/far-jag-halla-inne-hyran" className="font-semibold text-primar underline">
              Så deponerar du hyra
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-labelledby="vanliga-fragor" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 id="vanliga-fragor" className="text-3xl font-semibold">
          Vanliga frågor
        </h2>
        <div className="mt-6">
          <VanligaFragor />
        </div>
      </section>

      <section aria-labelledby="las-mer" className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <h2 id="las-mer" className="text-3xl font-semibold">
          Läs mer
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {ARTIKLAR.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/artiklar/${a.slug}`}
                className="group block h-full rounded-2xl border border-linje bg-yta p-5 no-underline transition-colors hover:border-primar"
              >
                <span className="block font-serif text-xl font-semibold group-hover:underline">{a.titel}</span>
                <span className="mt-2 block text-dampad">{a.beskrivning}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Vantelista />
      </div>
    </>
  );
}
