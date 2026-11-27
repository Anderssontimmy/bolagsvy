import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AnmalanFormular } from "@/components/AnmalanFormular";
import { InfoRuta } from "@/components/InfoRuta";
import { SidHero } from "@/components/SidHero";
import { Vantelista } from "@/components/Vantelista";
import { utskickLage } from "@/lib/arende/tjanst";

export const metadata: Metadata = {
  title: "Anmäl bristen till hyresvärden",
  description:
    "Berätta om bristen så skickar vi en skriftlig anmälan till din hyresvärd, tar emot svaret och håller dig uppdaterad.",
  alternates: { canonical: "/anmal" },
};

export default function Anmal() {
  return (
    <>
      <SidHero rubrik="Anmäl bristen till hyresvärden" />
      <Suspense fallback={<p className="mx-auto max-w-2xl px-4 py-10 sm:px-6">Laddar …</p>}>
        <Innehall />
      </Suspense>
    </>
  );
}

async function Innehall() {
  await connection();
  const lage = utskickLage();

  if (lage === "av") {
    return (
      <>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-lg text-dampad">
            Snart kan du skicka en skriftlig anmälan till din hyresvärd härifrån. Tills dess: anmäl bristen själv,
            skriftligt, redan i dag.
          </p>
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Vantelista />
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 break-words sm:px-6 sm:py-14">
      <p className="text-lg text-dampad">
        Berätta om bristen. Vi skickar en skriftlig anmälan till hyresvärden i ditt namn, tar emot svaret och mejlar
        dig när något händer. Du får en kopia av allt. Hyran kan sänkas från den dag hyresvärden får anmälan.
      </p>
      <div className="mt-6">
        <InfoRuta>Vi skickar anmälan i ditt namn och tar emot hyresvärdens svar. Vi kräver inga pengar och förhandlar inte åt dig.</InfoRuta>
      </div>
      <div className="mt-8">
        <AnmalanFormular testlage={lage === "test"} />
      </div>
    </div>
  );
}
