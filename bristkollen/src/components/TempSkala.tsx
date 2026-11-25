const MIN = 14;
const MAX = 24;
const pos = (t: number) => `${((t - MIN) / (MAX - MIN)) * 100}%`;

/** Riktvärden för inomhustemperatur. Skalan är dekorativ – samma sak står i texten under. */
export function TempSkala() {
  return (
    <figure className="rounded-3xl border border-linje bg-yta p-5 shadow-[0_18px_48px_-28px_rgba(20,55,73,0.45)] sm:p-7">
      <figcaption className="font-serif text-xl font-semibold">Hur kallt är för kallt?</figcaption>

      <div aria-hidden="true" className="relative mt-12 mb-1">
        <div className="h-3.5 rounded-full bg-gradient-to-r from-primar/55 via-frost to-glod/70" />
        {[18, 20].map((t) => (
          <div
            key={t}
            className="absolute -top-9 flex -translate-x-1/2 flex-col items-center"
            style={{ left: pos(t) }}
          >
            <span className="text-sm font-bold tabular-nums">{t} °C</span>
            <span className="mt-1 h-8 w-0.5 rounded bg-black" />
          </div>
        ))}
        <div className="mt-2 flex justify-between text-xs text-dampad tabular-nums">
          <span>{MIN} °C</span>
          <span>{MAX} °C</span>
        </div>
      </div>

      <ul className="mt-5 space-y-3 text-[0.98rem]">
        <li className="flex gap-3">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primar" aria-hidden="true" />
          <span>
            <strong>Under 18 °C</strong> är kallare än Folkhälsomyndighetens lägsta riktvärde.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-glod" aria-hidden="true" />
          <span>
            <strong>20 °C</strong> är riktvärdet för den som är känslig för kyla. Hyresgästföreningen utgår från att det
            inte bör vara kallare än så.
          </span>
        </li>
      </ul>
      <p className="mt-5 border-t border-linje pt-4 text-[0.95rem] text-dampad">
        Mät temperaturen och skriv ner datum och tid. Det blir ditt bevis.
      </p>
    </figure>
  );
}
