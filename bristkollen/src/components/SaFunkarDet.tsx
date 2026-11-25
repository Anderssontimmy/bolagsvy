const steg = [
  {
    rubrik: "Anmäl skriftligt",
    text: "Skriv till hyresvärden så fort du märker bristen. Hyran kan sänkas först från den dag hyresvärden får veta om den.",
  },
  {
    rubrik: "Dokumentera",
    text: "Ta foton, mät temperaturen och skriv ner datum. Spara en kopia av allt du skickar.",
  },
  {
    rubrik: "Kräv nedsättning",
    text: "Begär skriftligt att hyran sänks för tiden bristen fanns. Kalkylatorn visar ungefär hur mycket det kan handla om.",
  },
];

export function SaFunkarDet() {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steg.map((s, i) => (
        <li key={s.rubrik} className="relative rounded-2xl border border-linje bg-yta p-5 sm:p-6">
          <span className="font-serif text-5xl leading-none font-semibold text-glod" aria-hidden="true">
            {i + 1}
          </span>
          <h3 className="mt-3 text-xl font-semibold">
            <span className="sr-only">Steg {i + 1}: </span>
            {s.rubrik}
          </h3>
          <p className="mt-2 text-dampad">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
