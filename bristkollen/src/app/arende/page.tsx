import type { Metadata } from "next";
import { ArendeSida } from "@/components/ArendeSida";
import { SidHero } from "@/components/SidHero";

export const metadata: Metadata = {
  title: "Ditt ärende",
  robots: { index: false, follow: false },
};

export default function Arende() {
  return (
    <>
      <SidHero rubrik="Ditt ärende" underrubrik={<p>Här ser du allt som har hänt med din anmälan.</p>} />
      <div className="mx-auto max-w-2xl px-4 py-10 break-words sm:px-6 sm:py-14">
        <ArendeSida />
      </div>
    </>
  );
}
