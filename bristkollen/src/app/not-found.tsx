import Link from "next/link";
import { knappPrimar } from "@/components/knappar";

export default function SidanFinnsInte() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-[2rem] font-semibold sm:text-[2.6rem]">Sidan finns inte</h1>
      <p className="mt-3 text-lg text-dampad">Länken kan vara fel, eller så har sidan flyttats.</p>
      <Link href="/" className={`${knappPrimar} mt-6`}>
        Till startsidan
      </Link>
    </div>
  );
}
