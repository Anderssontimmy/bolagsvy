import type { Metadata } from "next";
import { Kalkylator } from "@/components/Kalkylator";
import { SidHero } from "@/components/SidHero";
import { utskickLage } from "@/lib/arende/tjanst";
import { Vantelista } from "@/components/Vantelista";
import { PROCENTSATSER, UTKAST, type ProcentRad } from "@/data/procentsatser";
import { procentSpann } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kalkylator för hyresnedsättning",
  description:
    "Räkna ut ungefär hur mycket hyran kan sänkas när lägenheten är kall eller har andra brister. Uppskattning – ingen garanti.",
  alternates: { canonical: "/kalkylator" },
};

export default function KalkylatorSida() {
  return (
    <>
      <SidHero
        rubrik="Hur mycket kan hyran sänkas?"
        underrubrik={<p>Svara på några frågor så får du en uppskattning i kronor. Vi sparar inte din hyra eller dina datum.</p>}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div>
          <Kalkylator anmalanAktiv={utskickLage() !== "av"} />
        </div>

        <section aria-labelledby="sa-raknar-vi" className="mt-14">
          <h2 id="sa-raknar-vi" className="text-[1.75rem] sm:text-[2rem]">
            Så räknar vi
          </h2>
          <p className="mt-3">
            <strong>Månadshyra × procentsats × antal dagar ÷ 30.</strong> Vi räknar dagarna från den dag hyresvärden
            fick din skriftliga anmälan till den dag bristen åtgärdades, eller fram till i dag. Dagar före anmälan räknas
            aldrig, eftersom hyran kan sänkas först från den dag hyresvärden får veta om bristen.
          </p>
          <p className="mt-3">
            Procentsatserna är riktmärken och inte bindande. Hur mycket hyran sänks bedöms från fall till fall. Därför
            visar vi alltid ett spann, aldrig ett exakt belopp.
          </p>
          <p className="mt-3">
            Vid vattenskada räknar vi bara på den del av lägenheten som inte går att använda. Är 12 av 60 kvm
            obrukbara blir det högst 20 % av hyran.
          </p>

          <h3 className="mt-8 text-xl font-semibold">Procentsatser vi använder</h3>
          <p className="mt-2 text-[0.95rem] text-dampad">Alla värden är {UTKAST}.</p>
          <ul className="mt-4 divide-y divide-linje rounded-2xl border border-linje bg-yta">
            {(Object.entries(PROCENTSATSER) as [string, ProcentRad][]).map(([id, rad]) => (
              <li key={id} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:gap-x-6">
                <span className="font-semibold">{rad.namn}</span>
                <span className="font-semibold text-primar sm:text-right">
                  {rad.procent ? procentSpann(rad.procent) : "Inget värde än"}
                </span>
                {rad.procent && (
                  <span className="text-[0.9rem] text-dampad sm:col-span-2">
                    Källa:{" "}
                    {rad.kallaUrl ? (
                      <a href={rad.kallaUrl} className="underline" rel="noopener noreferrer">
                        {rad.kalla}
                      </a>
                    ) : (
                      rad.kalla
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Vantelista />
      </div>
    </>
  );
}
