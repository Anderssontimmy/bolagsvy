import type { Metadata } from "next";
import Link from "next/link";
import { InfoRuta } from "@/components/InfoRuta";
import { SidHero } from "@/components/SidHero";
import { ARTIKLAR } from "@/content/artiklar";

export const metadata: Metadata = {
  title: "Artiklar om hyresnedsättning",
  description: "Läs om kalla lägenheter, stambyte, buller, hur du anmäler en brist och varför du aldrig ska hålla inne hyran.",
  alternates: { canonical: "/artiklar" },
};

export default function Artiklar() {
  return (
    <>
      <SidHero rubrik="Artiklar" underrubrik={<p>Enkla svar om dina rättigheter när lägenheten har brister.</p>} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <InfoRuta />
      <ul className="mt-8 space-y-4">
        {ARTIKLAR.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/artiklar/${a.slug}`}
              className="group block rounded-xl bg-gra p-5 no-underline transition-colors hover:bg-frost sm:p-6"
            >
              <span className="block text-xl font-semibold group-hover:underline sm:text-2xl">
                {a.titel}
              </span>
              <span className="mt-2 block text-dampad">{a.beskrivning}</span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </>
  );
}
