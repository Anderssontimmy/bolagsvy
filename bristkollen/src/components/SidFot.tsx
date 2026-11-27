import Link from "next/link";
import { brand } from "@/config/brand";
import { Logga } from "./Logga";

const lank = "inline-flex min-h-11 items-center font-medium text-white underline-offset-4 hover:underline";

export function SidFot() {
  return (
    <footer className="pa-mork mt-20 bg-primar text-white">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-xl font-semibold">
            <Logga className="h-8 w-8" />
            {brand.namn}
          </p>
          <p className="mt-4 max-w-prose text-[0.95rem] text-white/85">
            {brand.namn} ger allmän information, inte juridisk rådgivning. Vi är inte en advokatbyrå och vi
            driver inte in pengar åt någon. Beloppen i kalkylatorn är uppskattningar – ingen garanti.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Kontakt</h2>
          <ul className="mt-2 text-[0.95rem]">
            <li>
              <a className={lank} href={`mailto:${brand.kontaktEpost}`}>
                {brand.kontaktEpost}
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Sidfot">
          <h2 className="text-lg font-semibold">Hjälp</h2>
          <ul className="mt-2 text-[0.95rem]">
            <li>
              <Link className={lank} href="/integritet">
                Integritetspolicy
              </Link>
            </li>
            <li>
              <Link className={lank} href="/villkor">
                Villkor
              </Link>
            </li>
            <li>
              <Link className={lank} href="/om">
                Om {brand.namn}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
