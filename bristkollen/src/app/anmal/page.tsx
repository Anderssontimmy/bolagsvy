import type { Metadata } from "next";
import { AnmalanFormular } from "@/components/AnmalanFormular";
import { InfoRuta } from "@/components/InfoRuta";
import { SidHero } from "@/components/SidHero";
import { Vantelista } from "@/components/Vantelista";
import { utskickLage } from "@/lib/arende/tjanst";

export const metadata: Metadata = {
  title: "Anmäl bristen till hyresvärden",
  description: "Skicka en skriftlig anmälan om brist till din hyresvärd via e-post. Du får en kopia som bevis.",
  alternates: { canonical: "/anmal" },
};

export default function Anmal() {
  const lage = utskickLage();

  if (lage === "av") {
    return (
      <>
        <SidHero rubrik="Anmäl bristen till hyresvärden" />
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
    <>
    <SidHero rubrik="Anmäl bristen till hyresvärden" />
    <div className="mx-auto max-w-2xl px-4 py-10 break-words sm:px-6 sm:py-14">
      <p className="text-lg text-dampad">
        Fyll i uppgifterna så skickar vi en skriftlig anmälan till din hyresvärd via e-post. Du får en kopia. Den visar
        vilken dag hyresvärden fick veta om bristen – det är från den dagen hyran kan sänkas.
      </p>
      <div className="mt-6">
        <InfoRuta>Vi skickar anmälan i ditt namn. Vi förhandlar inte och driver inte in pengar åt dig.</InfoRuta>
      </div>
      <div className="mt-8">
        <AnmalanFormular testlage={lage === "test"} />
      </div>
    </div>
    </>
  );
}
