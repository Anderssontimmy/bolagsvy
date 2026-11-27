import type { Metadata } from "next";
import { Bekraftelse } from "@/components/Bekraftelse";
import { SidHero } from "@/components/SidHero";

export const metadata: Metadata = {
  title: "Skicka din anmälan",
  robots: { index: false, follow: false },
};

export default function BekraftaAnmalan() {
  return (
    <>
      <SidHero rubrik="Skicka din anmälan" />
      <div className="mx-auto max-w-2xl px-4 py-10 break-words sm:px-6 sm:py-14">
        <Bekraftelse />
      </div>
    </>
  );
}
