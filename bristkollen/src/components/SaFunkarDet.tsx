import Image, { type StaticImageData } from "next/image";
import stegAnmal from "@/assets/steg-anmal.jpg";
import stegDokumentera from "@/assets/steg-dokumentera.jpg";
import stegKrav from "@/assets/steg-krav.jpg";

const steg: { rubrik: string; text: string; bild: StaticImageData }[] = [
  {
    rubrik: "Anmäl skriftligt",
    text: "Skriv till hyresvärden så fort du märker bristen. Hyran kan sänkas först från den dag hyresvärden får veta om den.",
    bild: stegAnmal,
  },
  {
    rubrik: "Dokumentera",
    text: "Ta foton, mät temperaturen och skriv ner datum. Spara en kopia av allt du skickar.",
    bild: stegDokumentera,
  },
  {
    rubrik: "Kräv nedsättning",
    text: "Begär skriftligt att hyran sänks för tiden bristen fanns. Kalkylatorn visar ungefär hur mycket det kan handla om.",
    bild: stegKrav,
  },
];

export function SaFunkarDet() {
  return (
    <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
      {steg.map((s, i) => (
        <li key={s.rubrik}>
          <Image
            src={s.bild}
            alt=""
            placeholder="blur"
            sizes="(min-width: 640px) 33vw, 100vw"
            className="aspect-[16/9] w-full rounded-lg object-cover"
          />
          <h3 className="mt-4 flex items-center gap-3 text-lg font-semibold">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primar text-base text-white"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span>
              <span className="sr-only">Steg {i + 1}: </span>
              {s.rubrik}
            </span>
          </h3>
          <p className="mt-2 text-dampad">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
