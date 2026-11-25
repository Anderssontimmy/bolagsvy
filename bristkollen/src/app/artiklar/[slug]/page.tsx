import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoRuta } from "@/components/InfoRuta";
import { knappPrimar } from "@/components/knappar";
import { ARTIKLAR, hamtaArtikel } from "@/content/artiklar";
import { datumText } from "@/lib/format";

export function generateStaticParams() {
  return ARTIKLAR.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/artiklar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const artikel = hamtaArtikel(slug);
  if (!artikel) return {};
  return {
    title: artikel.titel,
    description: artikel.beskrivning,
    alternates: { canonical: `/artiklar/${artikel.slug}` },
    openGraph: { type: "article", title: artikel.titel, description: artikel.beskrivning },
  };
}

export default async function ArtikelSida({ params }: PageProps<"/artiklar/[slug]">) {
  const { slug } = await params;
  const artikel = hamtaArtikel(slug);
  if (!artikel) notFound();

  const { default: Innehall } = await import(`@/content/artiklar/${artikel.slug}.mdx`);

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/artiklar" className="inline-flex min-h-11 items-center font-semibold text-primar underline">
        <span aria-hidden="true">←&nbsp;</span>Alla artiklar
      </Link>
      <h1 className="mt-4 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">{artikel.titel}</h1>
      <p className="mt-4 text-[0.95rem] text-dampad">
        Senast granskad: <time dateTime={artikel.senastGranskad}>{datumText(artikel.senastGranskad)}</time>
        {!artikel.juristGranskad && " · Utkast – ska granskas av jurist"}
      </p>
      <div className="mt-6">
        <InfoRuta>Varje situation är olika. Behöver du råd i ditt eget fall, kontakta en jurist.</InfoRuta>
      </div>

      <div className="mt-8 text-[1.08rem]">
        <Innehall />
      </div>

      <section aria-labelledby="kallor" className="mt-14 border-t border-linje pt-8">
        <h2 id="kallor" className="text-2xl font-semibold">
          Källor
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 marker:text-dampad">
          {artikel.kallor.map((k) => (
            <li key={k.url}>
              <a href={k.url} className="font-semibold text-primar underline" rel="noopener noreferrer">
                {k.titel}
              </a>
              <span className="text-dampad"> – {k.utgivare}</span>
            </li>
          ))}
        </ol>
      </section>

      <aside className="mt-12 rounded-2xl border border-linje bg-frost p-5 sm:p-7" aria-labelledby="rakna-ut">
        <h2 id="rakna-ut" className="text-2xl font-semibold">
          Hur mycket kan din hyra sänkas?
        </h2>
        <p className="mt-2">Svara på några frågor och få en uppskattning i kronor.</p>
        <Link href="/kalkylator" className={`${knappPrimar} mt-5 w-full sm:w-auto`}>
          Till kalkylatorn
        </Link>
      </aside>
    </article>
  );
}
