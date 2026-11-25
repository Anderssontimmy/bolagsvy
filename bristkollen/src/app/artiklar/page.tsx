import type { Metadata } from "next";
import Link from "next/link";
import { InfoRuta } from "@/components/InfoRuta";
import { ARTIKLAR } from "@/content/artiklar";

export const metadata: Metadata = {
  title: "Artiklar om hyresnedsättning",
  description: "Läs om kalla lägenheter, stambyte, buller, hur du anmäler en brist och varför du aldrig ska hålla inne hyran.",
  alternates: { canonical: "/artiklar" },
};

export default function Artiklar() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">Artiklar</h1>
      <p className="mt-3 text-lg text-dampad">Enkla svar om dina rättigheter när lägenheten har brister.</p>
      <div className="mt-6">
        <InfoRuta />
      </div>
      <ul className="mt-8 space-y-4">
        {ARTIKLAR.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/artiklar/${a.slug}`}
              className="group block rounded-2xl border border-linje bg-yta p-5 no-underline transition-colors hover:border-primar sm:p-6"
            >
              <span className="block font-serif text-xl font-semibold group-hover:underline sm:text-2xl">
                {a.titel}
              </span>
              <span className="mt-2 block text-dampad">{a.beskrivning}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
