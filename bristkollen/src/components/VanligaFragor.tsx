import Link from "next/link";
import type { ReactNode } from "react";

const lank = "font-semibold text-primar underline";

const fragor: { fraga: string; svar: ReactNode }[] = [
  {
    fraga: "Vad är hyresnedsättning?",
    svar: (
      <p>
        Hyresnedsättning betyder att hyran blir lägre under en tid. Enligt lagen har du rätt till skälig nedsättning av
        hyran när lägenheten är bristfällig (12 kap. 11 § jordabalken). Skälig betyder rimlig. Ett annat ord för samma sak
        är hyresreduktion.
      </p>
    ),
  },
  {
    fraga: "Från vilken dag räknas nedsättningen?",
    svar: (
      <p>
        Från den dag hyresvärden får veta om bristen. Dagar före det räknas inte. Därför ska du anmäla bristen
        skriftligt så snart som möjligt och spara en kopia.{" "}
        <Link href="/artiklar/sa-anmaler-du-en-brist" className={lank}>
          Så anmäler du en brist
        </Link>
        .
      </p>
    ),
  },
  {
    fraga: "Hur mycket kan hyran sänkas?",
    svar: (
      <p>
        Det finns inga fasta belopp. Procentsatserna i kalkylatorn är riktmärken och inte bindande. Nedsättningen
        bedöms från fall till fall. Därför visar vi alltid en uppskattning i form av ett spann, aldrig ett exakt belopp.
      </p>
    ),
  },
  {
    fraga: "Får jag sluta betala hyran tills bristen är åtgärdad?",
    svar: (
      <p>
        Nej. Håll aldrig inne hyran. Då riskerar du att förlora lägenheten. Är ni oense om hur mycket du ska betala kan
        du i stället deponera den delen hos länsstyrelsen. Det betyder att du lämnar pengarna dit i stället för till
        hyresvärden.{" "}
        <Link href="/artiklar/far-jag-halla-inne-hyran" className={lank}>
          Läs mer om att deponera hyra
        </Link>
        .
      </p>
    ),
  },
  {
    fraga: "Vad händer om hyresvärden inte åtgärdar bristen?",
    svar: (
      <p>
        Då kan du vända dig till hyresnämnden. Hyresnämnden är en myndighet som hjälper till när hyresgäster och
        hyresvärdar inte är överens. Nämnden kan förelägga hyresvärden att åtgärda bristen. Det betyder att hyresvärden
        får ett beslut om att rätta till den.
      </p>
    ),
  },
  {
    fraga: "Vem kan använda tjänsten?",
    svar: (
      <p>
        Du som hyr en lägenhet med förstahandskontrakt, alltså ett kontrakt direkt med hyresvärden. Kalkylatorn och
        artiklarna är gratis.
      </p>
    ),
  },
  {
    fraga: "Är det här juridisk rådgivning? Driver ni mitt ärende?",
    svar: (
      <p>
        Nej. Vi ger allmän information och verktyg. Du skickar själv din anmälan och dina krav till hyresvärden. Vi
        driver inte in pengar åt någon. Behöver du råd i ditt eget fall, kontakta en jurist.
      </p>
    ),
  },
];

export function VanligaFragor() {
  return (
    <div className="divide-y divide-linje rounded-2xl border border-linje bg-yta">
      {fragor.map((f) => (
        <details key={f.fraga} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {f.fraga}
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-linje text-primar transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <div className="pb-5 text-black/90">{f.svar}</div>
        </details>
      ))}
    </div>
  );
}
