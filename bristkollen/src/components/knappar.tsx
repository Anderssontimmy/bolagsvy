export const knappPrimar =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-persika px-7 py-3 text-lg font-medium text-black no-underline transition-colors hover:bg-persika-mork";

export const knappSekundar =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border-2 border-black bg-yta px-7 py-3 text-lg font-medium text-black no-underline transition-colors hover:bg-gra";

/** Pilen i knapparna. Dekorativ – knappens text säger vad som händer. */
export function Pil() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false">
      <path
        d="M3.5 10h12m-4.5-4.5L15.5 10 11 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
