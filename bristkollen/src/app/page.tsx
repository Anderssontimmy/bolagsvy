import Link from "next/link";
import { Kalkylator } from "@/components/Kalkylator";
import { utskickLage } from "@/lib/arende/tjanst";
import { SaFunkarDet } from "@/components/SaFunkarDet";
import { TempSkala } from "@/components/TempSkala";
import { VanligaFragor } from "@/components/VanligaFragor";
import { Vantelista } from "@/components/Vantelista";
import { knappPrimar, Pil } from "@/components/knappar";
import { SidHero } from "@/components/SidHero";
import { ARTIKLAR } from "@/content/artiklar";

export default function Startsida() {
  const aktiv = utskickLage() !== "av";
  return (
    <>
      <SidHero
        stor
        rubrik="Kallt hemma eller trasigt i lägenheten?"
        underrubrik={
          <p>
            Du kan ha rätt till sänkt hyra.
            <br />
            Men bara från den dag hyresvärden får veta om bristen.
          </p>
        }
        band="För dig som hyr i första hand – kalkylatorn är gratis"
      >
        <a href="#kalkylator" className={knappPrimar}>
          Räkna ut din nedsättning
          <Pil />
        </a>
        <Link href={aktiv ? "/anmal" : "/artiklar/sa-anmaler-du-en-brist"} className={knappPrimar}>
          {aktiv ? "Anmäl bristen" : "Så anmäler du en brist"}
          <Pil />
        </Link>
      </SidHero>

      <section aria-labelledby="sa-funkar-det" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-lg font-medium text-primar">Steg för steg</p>
        <h2 id="sa-funkar-det" className="mt-1 text-[2rem] sm:text-[2.5rem]">
          Så funkar det
        </h2>
        <p className="mt-3 max-w-2xl text-xl font-light">
          {aktiv ? "Du berättar om bristen – vi sköter kontakten med hyresvärden." : "Tre steg. Det första är det viktigaste."}
        </p>
        <div className="mt-10">
          <SaFunkarDet viSkoter={aktiv} />
        </div>
        <div className="mt-12 flex justify-center">
          <a href="#kalkylator" className={knappPrimar}>
            Räkna ut din nedsättning
            <Pil />
          </a>
        </div>
      </section>

      <section id="kalkylator" aria-labelledby="kalkylator-rubrik" className="bg-primar">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="pa-mork text-center text-white">
            <p className="font-medium">Gratis – vi sparar inte din hyra eller dina datum</p>
            <h2 id="kalkylator-rubrik" className="mt-2 text-[2rem] text-white sm:text-[2.5rem]">
              Räkna ut ungefär hur mycket
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/90">
              Svara på några frågor så får du en uppskattning i kronor.
            </p>
          </div>
          <div className="mt-10">
            <Kalkylator anmalanAktiv={aktiv} />
          </div>
        </div>
      </section>

      <div className="bg-gra">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <TempSkala />
        </div>
      </div>

      <section aria-labelledby="hall-inte-inne" className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-20">
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

      <section aria-labelledby="vanliga-fragor" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 id="vanliga-fragor" className="text-[2rem] sm:text-[2.5rem]">
          Vanliga frågor
        </h2>
        <div className="mt-6">
          <VanligaFragor />
        </div>
      </section>

      <section aria-labelledby="las-mer" className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <h2 id="las-mer" className="text-[2rem] sm:text-[2.5rem]">
          Läs mer
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {ARTIKLAR.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/artiklar/${a.slug}`}
                className="group block h-full rounded-xl bg-gra p-5 no-underline transition-colors hover:bg-frost sm:p-6"
              >
                <span className="block text-xl font-semibold group-hover:underline">{a.titel}</span>
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
