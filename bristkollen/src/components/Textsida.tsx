import type { ReactNode } from "react";
import { datumText } from "@/lib/format";

export function Textsida({
  titel,
  ingress,
  utkast = false,
  uppdaterad,
  children,
}: {
  titel: string;
  ingress?: string;
  utkast?: boolean;
  uppdaterad?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">{titel}</h1>
      {ingress && <p className="mt-3 text-lg text-dampad">{ingress}</p>}
      {utkast && (
        <p className="mt-5 rounded-xl border-2 border-glod bg-glod-ljus px-4 py-3 text-[0.95rem]">
          <strong>Utkast.</strong> Den här texten ska granskas av en jurist innan tjänsten lanseras.
        </p>
      )}
      {uppdaterad && <p className="mt-4 text-sm text-dampad">Senast uppdaterad: {datumText(uppdaterad)}</p>}
      <div className="mt-6 text-[1.06rem]">{children}</div>
    </div>
  );
}
