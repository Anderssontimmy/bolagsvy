# Färdplan

Affärsmodellen i början är självbetjäning: hyresgästen skickar själv sina krav. Vi driver inte in pengar åt någon
förrän en jurist har sagt att det är tillåtet (det kan kräva inkassotillstånd).

## Fas 1 – nu (byggd)

- Landningssida med fokus på kalla lägenheter (vinter)
- Kalkylator: månadshyra × procentsats × dagar från skriftlig anmälan ÷ 30, visas som spann
- Väntelista: e-post (krävs), brist och postnummer (frivilligt), samtycke
- Fem artiklar och juridiska sidor som utkast
- Statistik: `kalkylator_start`, `kalkylator_klar`, `vantelista_anmalan`

## Fas 2 – bristdagbok och anmälan med ett klick

- Konto (Supabase Auth, inloggning med e-postlänk)
- Bristdagbok: foto, temperatur och anteckning, med tidsstämpel från servern
- Formell anmälan till hyresvärden som skickas via e-post med ett klick
- Varje utskick loggas och sparas oförändrat som bevis (innehåll, mottagare, tid och leveransstatus)
- Väntelistan bjuds in först

## Fas 3 – kravbrev och vägledning

- Kravbrev som PDF, betalt (195–395 kr via Stripe). Hyresgästen skickar det själv.
- Påminnelser, till exempel om att följa upp efter 14 dagar
- Vägledning om nästa steg: hyresnämnden, deponering hos länsstyrelsen

## Fas 4 – hus och admin

- Ärenden grupperas per hus. "Grannar på din adress har anmält samma brist" visas bara för den som själv har valt det,
  och bara när tillräckligt många har anmält, så att ingen enskild går att peka ut.
- Adminpanel: ärenden, utskick, studsade mejl, statistik

## Fas 5 – kanske senare

- No cure, no pay med jurist som ombud
- Signering med BankID
- Hjälp med deposition
- Kräver juridisk prövning först (inkassotillstånd, se docs/JURIST-TODO.md)

## Hur fas 1 är förberedd för resten

- **Lagring bakom ett gränssnitt** (`src/lib/vantelista/lagring.ts`): samma mönster kan användas för bristdagbok och
  utskick.
- **Bristtyperna finns på ett ställe** (`BRISTTYPER` i `src/data/procentsatser.ts`). Kalkylator, väntelista och
  databasens `check` använder samma id:n.
- **Kalkylatorn är ren logik** (`src/lib/kalkylator.ts`). Den kan återanvändas på servern för kravbrev i fas 3, och
  procentsatserna kan versioneras.
- **Samtycke versioneras** (`integritetVersion` sparas med varje anmälan). Det behövs för konton i fas 2.
- **Postnummer samlas in frivilligt redan nu.** Det ger en första bild av var bristerna finns inför fas 4.
