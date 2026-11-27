import Link from "next/link";
import { brand } from "@/config/brand";
import { Logga } from "./Logga";

const lankar = [
  { href: "/kalkylator", text: "Kalkylator" },
  { href: "/artiklar", text: "Artiklar" },
  { href: "/om", text: "Om" },
];

/** Ligger ovanpå fotot överst på varje sida (se SidHero), därför vit text. */
export function SidHuvud() {
  return (
    <header className="pa-mork absolute inset-x-0 top-0 z-20 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-4 sm:px-8 sm:py-6 lg:px-14">
        <Link href="/" className="flex items-center gap-1.5 rounded text-white no-underline sm:gap-2">
          <Logga className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" />
          <span className="text-lg font-semibold tracking-tight sm:text-2xl">{brand.namn}</span>
        </Link>
        <nav aria-label="Huvudmeny" className="flex items-center gap-2 sm:gap-6 lg:gap-10">
          <ul className="flex items-center sm:gap-4 lg:gap-8">
            {lankar.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-md px-1.5 text-[0.95rem] font-medium text-white underline-offset-4 hover:underline sm:px-2 sm:text-lg"
                >
                  {l.text}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/kalkylator"
            className="hidden min-h-11 items-center rounded-full bg-persika px-5 text-base font-medium text-black no-underline transition-colors hover:bg-persika-mork md:inline-flex"
          >
            Räkna ut
          </Link>
        </nav>
      </div>
    </header>
  );
}
