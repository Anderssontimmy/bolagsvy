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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded text-primar no-underline">
          <Logga className="h-8 w-8 shrink-0" />
          <span className="font-serif text-xl font-semibold tracking-tight text-black">{brand.namn}</span>
        </Link>
        <nav aria-label="Huvudmeny">
          <ul className="flex items-center gap-1 sm:gap-2">
            {lankar.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-[0.95rem] font-semibold text-black underline-offset-4 hover:underline sm:px-3"
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
