import Image from "next/image";
import type { ReactNode } from "react";
import hero from "@/assets/hero-bakgrund.jpg";

const STANDARDBAND = "Anmäl bristen skriftligt – hyran kan sänkas först från den dagen";

/**
 * Överst på varje sida: fotot med en mörk ton, rubriken i mitten och ett grönt band under.
 * Sidhuvudet ligger ovanpå fotot, därför börjar texten en bit ner.
 */
export function SidHero({
  rubrik,
  underrubrik,
  stor = false,
  band = STANDARDBAND,
  children,
}: {
  rubrik: string;
  underrubrik?: ReactNode;
  /** Startsidans högre variant. */
  stor?: boolean;
  band?: string | null;
  /** Knappar under rubriken. */
  children?: ReactNode;
}) {
  return (
    <>
      <section
        className={`pa-mork relative isolate flex items-center overflow-hidden text-center text-white ${
          stor ? "min-h-[40rem] lg:min-h-[48.75rem]" : "min-h-[22rem] sm:min-h-[27rem]"
        }`}
      >
        <Image
          src={hero}
          alt=""
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="-z-20 object-cover object-[28%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/55" />
        <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${stor ? "pt-32 pb-14 sm:pt-36" : "pt-32 pb-12"}`}>
          <h1
            className={`fram mx-auto tracking-tight text-white ${
              stor
                ? "max-w-4xl text-[2.6rem] leading-[1.1] sm:text-6xl lg:text-[5rem]"
                : "max-w-3xl text-[2.2rem] leading-[1.12] sm:text-5xl lg:text-[4rem]"
            }`}
          >
            {rubrik}
          </h1>
          {underrubrik && (
            <div className="fram fram-2 mx-auto mt-5 max-w-3xl text-xl leading-snug sm:text-2xl">{underrubrik}</div>
          )}
          {children && <div className="fram fram-3 mt-9 flex flex-col items-center gap-4">{children}</div>}
        </div>
      </section>
      {band && (
        <p className="pa-mork flex items-center justify-center gap-3 bg-primar px-4 py-3.5 text-center text-white sm:text-xl">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true" focusable="false">
            <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m8 12.2 2.7 2.7L16 9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{band}</span>
        </p>
      )}
    </>
  );
}
