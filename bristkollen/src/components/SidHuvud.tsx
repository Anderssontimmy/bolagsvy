import Link from "next/link";
import { brand } from "@/config/brand";
import { Logga } from "./Logga";

const lankar = [
  { href: "/kalkylator", text: "Kalkylator" },
  { href: "/artiklar", text: "Artiklar" },
  { href: "/om", text: "Om" },
];

export function SidHuvud() {
  return (
    <header className="border-b border-linje bg-papper/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 rounded text-primar no-underline sm:gap-2">
          <Logga className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span className="font-serif text-lg font-semibold tracking-tight text-black sm:text-xl">{brand.namn}</span>
        </Link>
        <nav aria-label="Huvudmeny">
          <ul className="flex items-center sm:gap-2">
            {lankar.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-md px-1.5 text-[0.9rem] font-semibold text-black underline-offset-4 hover:underline sm:px-3 sm:text-[0.95rem]"
                >
                  {l.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
