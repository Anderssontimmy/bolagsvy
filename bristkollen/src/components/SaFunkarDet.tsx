import Image, { type StaticImageData } from "next/image";
import stegAnmal from "@/assets/steg-anmal.jpg";
import stegDokumentera from "@/assets/steg-dokumentera.jpg";
import stegKrav from "@/assets/steg-krav.jpg";

const STEG_SJALV: { rubrik: string; text: string; bild: StaticImageData }[] = [
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

const STEG_TJANST: typeof STEG_SJALV = [
  {
    rubrik: "Berätta om bristen",
    text: "Fyll i ett formulär och bifoga gärna foton. Det tar några minuter.",
    bild: stegDokumentera,
  },
  {
    rubrik: "Vi anmäler åt dig",
    text: "Vi skickar en skriftlig anmälan till hyresvärden i ditt namn och blir kontaktperson. Du får en kopia.",
    bild: stegAnmal,
  },
  {
    rubrik: "Vi håller dig uppdaterad",
    text: "Vi tar emot hyresvärdens svar, påminner om svaret dröjer och mejlar dig när något händer.",
    bild: stegKrav,
  },
];

/** viSkoter: tjänsten är påslagen och vi sköter anmälan åt kunden. Annars visas stegen för att göra det själv. */
export function SaFunkarDet({ viSkoter = false }: { viSkoter?: boolean }) {
  const steg = viSkoter ? STEG_TJANST : STEG_SJALV;
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
