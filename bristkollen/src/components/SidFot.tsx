import Link from "next/link";
import { brand } from "@/config/brand";
import { Logga } from "./Logga";

export function SidFot() {
  return (
    <footer className="mt-20 border-t border-linje bg-yta">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr] sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Logga className="h-6 w-6 text-primar" />
            {brand.namn}
          </p>
          <p className="mt-3 max-w-prose text-[0.95rem] text-dampad">
            {brand.namn} ger allmän information, inte juridisk rådgivning. Vi är inte en advokatbyrå och vi
            driver inte in pengar åt någon. Beloppen i kalkylatorn är uppskattningar – ingen garanti.
          </p>
        </div>
        <nav aria-label="Sidfot">
          <ul className="space-y-1 text-[0.95rem]">
            <li>
              <Link className="inline-flex min-h-11 items-center underline" href="/integritet">
                Integritetspolicy
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center underline" href="/villkor">
                Villkor
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center underline" href="/om">
                Om {brand.namn}
              </Link>
            </li>
            <li>
              <a className="inline-flex min-h-11 items-center underline" href={`mailto:${brand.kontaktEpost}`}>
                {brand.kontaktEpost}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
