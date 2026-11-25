# Bristkollen – fas 1

Bristkollen (arbetsnamn) hjälper hyresgäster med förstahandskontrakt att få sänkt hyra när lägenheten har brister.
Fas 1 innehåller landningssida, kalkylator, väntelista, fem artiklar och juridiska sidor (utkast).

- Next.js 16 (App Router), TypeScript i strict-läge, Tailwind CSS 4
- Väntelista i Supabase (EU) – eller i minnet lokalt, utan nycklar
- Plausible för statistik (cookiefritt, av som standard)
- Vitest för enhetstester, Playwright för röktest

Faser och plan: [docs/ROADMAP.md](docs/ROADMAP.md). Datamodell för fas 2–4: [docs/DATAMODELL.md](docs/DATAMODELL.md).
Det som en jurist ska granska: [docs/JURIST-TODO.md](docs/JURIST-TODO.md).

## Kör lokalt

Kräver Node.js 20.9 eller senare (testat med Node 24).

```bash
cd bristkollen
npm install
npm run dev
```

Öppna <http://localhost:3000>. Inga nycklar behövs. Utan Supabase sparas väntelistan i serverns minne och töms när
servern startas om.

> Windows bakom en proxy eller ett antivirus som byter certifikat: kör `set NODE_OPTIONS=--use-system-ca` (cmd) eller
> `$env:NODE_OPTIONS="--use-system-ca"` (PowerShell) innan `npm install` om installationen hänger.

## Kommandon

| Kommando            | Vad det gör                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run dev`       | Utvecklingsserver på port 3000                                           |
| `npm run build`     | Produktionsbygge                                                         |
| `npm run start`     | Startar produktionsbygget                                                |
| `npm run lint`      | ESLint                                                                   |
| `npm run typecheck` | TypeScript-kontroll (kör `npx next typegen` först på en ny dator)        |
| `npm test`          | Enhetstester (Vitest)                                                    |
| `npm run e2e`       | Röktest i webbläsare (Playwright). Kör `npm run build` först.            |

Playwright använder Edge på Windows. Där hänger Playwrights egna Chromium-binärer när flera tester körs samtidigt. På
Linux och Mac används Chromium: kör `npx playwright install chromium` första gången.

## Miljövariabler

Kopiera `.env.example` till `.env.local` och fyll i det du behöver. Allt är frivilligt lokalt.

| Variabel                       | Krävs i produktion | Beskrivning                                                                                       |
| ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | Ja                 | Sajtens adress, t.ex. `https://bristkollen.se`. Används i sitemap och metadata.                    |
| `SUPABASE_URL`                 | Ja                 | Projektets URL, t.ex. `https://abcd.supabase.co`.                                                 |
| `SUPABASE_SECRET_KEY`          | Ja                 | Hemlig nyckel (`sb_secret_…`) eller äldre `service_role`-nyckel. Bara på servern – aldrig `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Nej                | Slår på Plausible, t.ex. `bristkollen.se`. Tomt = ingen statistik.                                |
| `NEXT_PUBLIC_PLAUSIBLE_SRC`    | Nej                | Annan skriptadress, om Plausible ger dig en egen. Standard: `https://plausible.io/js/script.js`.   |

Om `SUPABASE_URL` eller `SUPABASE_SECRET_KEY` saknas i produktion sparas väntelistan bara i minnet, och servern
loggar en varning. Sätt alltid båda innan lansering.

Statistikhändelser: `kalkylator_start` (första ändringen i kalkylatorn), `kalkylator_klar` (ett resultat visas, med
egenskaperna `brist` och `utfall`) och `vantelista_anmalan` (lyckad anmälan, med `brist` om den är vald). För att se
egenskaperna i Plausible: lägg till dem under *Site settings → Custom properties*.

## Supabase

1. Skapa ett projekt i en EU-region (till exempel Stockholm, `eu-north-1`).
2. Öppna **SQL Editor** och kör SQL:en nedan. Den finns också i [supabase/schema.sql](supabase/schema.sql).
3. Hämta **Project URL** och en **Secret key** under *Project Settings → API Keys*. Sätt dem som `SUPABASE_URL` och
   `SUPABASE_SECRET_KEY`.

```sql
create table if not exists public.vantelista (
  id bigint generated always as identity primary key,
  epost text not null unique check (char_length(epost) between 3 and 254),
  brist text check (
    brist in ('kyla', 'renovering', 'kok_badrum', 'buller', 'granne',
              'hiss', 'tvattstuga', 'mogel', 'vattenskada')
  ),
  postnummer text check (postnummer ~ '^[1-9][0-9]{4}$'),
  integritet_version text not null,
  skapad timestamptz not null default now()
);

alter table public.vantelista enable row level security;
-- Inga policyer: bara servern (hemlig nyckel) kan läsa och skriva.
```

Samma e-postadress sparas bara en gång. API:et svarar likadant båda gångerna, så det avslöjar inte vilka adresser som
redan finns.

## Driftsätt på Vercel

1. Skapa ett konto på vercel.com och välj **Add New → Project**. Importera GitHub-repot.
2. Sätt **Root Directory** till `bristkollen`. Vercel känner igen Next.js och väljer `npm run build` själv.
3. Lägg in miljövariablerna ovan under *Settings → Environment Variables* (Production).
4. Klicka **Deploy**.
5. Lägg till domänen under *Settings → Domains* och följ instruktionerna för DNS.

`vercel.json` lägger serverfunktionerna i Stockholm (`arn1`), nära databasen i EU.

## Innan lansering

- [ ] En jurist har granskat allt i [docs/JURIST-TODO.md](docs/JURIST-TODO.md). Sätt `juristGranskad: true` och nytt
      `senastGranskad` i `src/content/artiklar.ts`. Ta bort utkastrutorna i `src/app/integritet` och `src/app/villkor`.
- [ ] Fyll i vem som driver tjänsten och är personuppgiftsansvarig (`[… – fylls i före lansering]` i
      `src/content/sidor/*.mdx`).
- [ ] Kontaktadressen i `src/config/brand.ts` tar emot mejl.
- [ ] Supabase-tabellen finns, och miljövariablerna är satta i Vercel.
- [ ] Byt `integritetVersion` i `src/config/brand.ts` när policyn ändras.

## Struktur

```text
src/
  config/brand.ts          Namn, domän, färger, kontaktadress – byt namn här
  data/procentsatser.ts    Procenttabellen (utkast) med källa per rad
  lib/kalkylator.ts        Kalkylatorns logik (ren TypeScript, testad)
  lib/vantelista/          Validering, begränsning av anrop och lagring (minne/Supabase)
  lib/analys.ts            Plausible-händelser
  app/                     Sidor och API (/api/waitlist)
  components/              Kalkylator, väntelista, sidhuvud m.m.
  content/artiklar/*.mdx   Artiklarna (metadata och källor i content/artiklar.ts)
  content/sidor/*.mdx      Integritetspolicy, villkor och om-sidan
e2e/                       Playwright-röktest
supabase/schema.sql        Databastabellen
docs/                      Färdplan, datamodell och jurist-att-göra
```

**Byta namn:** ändra `src/config/brand.ts`. Färgerna blir CSS-variabler som Tailwind använder (`bg-primar`,
`text-glod` osv.).

**Ändra procentsatser:** ändra `src/data/procentsatser.ts` och uppdatera källan. Testet i `procentsatser.test.ts`
låser värdena med flit, så det måste också uppdateras. Då kan ingen ändra en procentsats av misstag.
