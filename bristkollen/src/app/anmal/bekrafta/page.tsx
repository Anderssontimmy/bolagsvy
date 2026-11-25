import type { Metadata } from "next";
import { Bekraftelse } from "@/components/Bekraftelse";

export const metadata: Metadata = {
  title: "Skicka din anmälan",
  robots: { index: false, follow: false },
};

export default function BekraftaAnmalan() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 break-words sm:px-6 sm:py-14">
      <h1 className="mb-6 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">Skicka din anmälan</h1>
      <Bekraftelse />
    </div>
  );
}
