import type { ReactNode } from "react";

/** Rutan "Detta är allmän information, inte juridisk rådgivning". */
export function InfoRuta({ children }: { children?: ReactNode }) {
  return (
    <aside className="flex gap-4 rounded-2xl border-l-4 border-primar bg-frost p-4 sm:p-5" aria-label="Viktigt att veta">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0 text-primar" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v6M12 7.2v.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div>
        <p className="font-bold">Detta är allmän information, inte juridisk rådgivning.</p>
        {children && <div className="mt-1 text-[0.95rem]">{children}</div>}
      </div>
    </aside>
  );
}
