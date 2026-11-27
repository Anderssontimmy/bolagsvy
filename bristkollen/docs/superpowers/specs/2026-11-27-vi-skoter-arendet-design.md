# Vi sköter ärendet – design

Datum: 2026-11-27. Godkänd av ägaren i samtal samma dag.

Halvhyra.se går från självbetjäning till att vi sköter kontakten med hyresvärden. Kunden berättar om bristen en gång.
Vi skickar den skriftliga anmälan i kundens namn, blir kontaktperson, tar emot hyresvärdens svar, påminner när svar
dröjer och håller kunden uppdaterad.

## Ägarens beslut

| Fråga | Beslut |
| --- | --- |
| Omfattning | Anmälan och kontakt. Vi kräver inga pengar och förhandlar inte. Kunden bestämmer varje nytt steg. |
| Godkännande | Kunden godkänner anmälan en gång (bekräftelselänk i mejlet). Efter det sker allt automatiskt. |
| Uppdateringar | Mejl vid varje nyhet, med länk till en ärendesida. Inget konto. |
| Foton | Högst 5. De bifogas anmälan till hyresvärden och sparas som bevis. Platsdata tas bort. |
| Pris | Gratis i den här versionen. |
| AI | Fasta brevmallar. AI:n skriver bara om kundens beskrivning och tolkar hyresvärdens svar. |

## Ärendet steg för steg

1. **Kunden fyller i /anmal:** egna uppgifter, adress och lägenhetsnummer, hyresvärdens namn och e-post, typ av brist,
   temperatur (vid kyla), sedan när, beskrivning med egna ord och högst 5 foton. Kunden kryssar i uppdraget:
   *"Jag ger Halvhyra.se i uppdrag att anmäla bristen i mitt namn, ta emot hyresvärdens svar och hålla mig
   uppdaterad. Halvhyra.se kräver inga pengar och förhandlar inte åt mig."*
2. **Granska:** AI:n skriver om beskrivningen till saklig text. Kunden ser hela brevet (mall, AI-text, bilagor) och kan
   ändra texten fritt innan något sparas.
3. **Bekräfta:** ärendet sparas och kunden får en bekräftelselänk (giltig 24 timmar). Först när kunden trycker Skicka på
   länkens sida går anmälan till hyresvärden. Det hindrar att någon anmäler i någon annans namn.
4. **Anmälan skickas** från vår avsändare (`"Anna Andersson via Halvhyra.se" <UTSKICK_FRAN>`) med kopia till kunden.
   Svarsadressen (reply-to) är ärendets egen adress `arende-<kortId>@<SVAR_DOMAN>`. Kunden får mejlet "Anmälan är
   skickad" med länk till ärendesidan.
5. **Hyresvärden svarar:** vi tar emot svaret, AI:n sammanfattar det och sätter en kategori. Kunden får mejlet
   "Hyresvärden har svarat" med sammanfattningen. Hela svaret och eventuella bilagor finns på ärendesidan.
6. **Kunden svarar hyresvärden** i en textruta på ärendesidan (till exempel om när hyresvärden kan komma in). Vi
   skickar texten oförändrad från ärendets adress, med kopia till kunden. AI:n skickar aldrig fritext.
7. **Inget svar:** 7 dagar efter anmälan skickas påminnelse 1, efter 14 dagar påminnelse 2. Båda följer fasta mallar och
   kunden får veta varje gång. Kommer inget svar inom 7 dagar efter påminnelse 2 mejlar vi kunden om nästa steg
   (hyresnämnden, länk till artikel). Sedan gör vi inget mer automatiskt. Så fort hyresvärden har svarat skickas inga
   fler påminnelser.
8. **Avslut:** kunden trycker "Bristen är åtgärdad" på ärendesidan och anger datum och, om den vill, månadshyran. Vi
   påminner om knappen i mejl 14 och 30 dagar efter anmälan. Ärendet stängs. Har kunden angett månadshyran visas en
   uppskattning av nedsättningen från dagen vi skickade anmälan till åtgärdsdagen (samma `raknaUt` som kalkylatorn),
   annars en länk till kalkylatorn. Kunden får också en länk till artikeln om att själv kräva nedsättning.

## Statusar

`vantar_bekraftelse` → `skickad` → `besvarad` → `atgardad`

- `vantar_bekraftelse`: sparad, inte skickad. Går ut efter 24 timmar (raderas av den dagliga körningen).
- `skickad`: anmälan skickad, inget svar än. Påminnelser kan gå ut.
- `besvarad`: hyresvärden har svarat minst en gång. Inga påminnelser.
- `atgardad`: kunden har sagt att bristen är åtgärdad. Ärendet är stängt; inga utskick, ingen textruta.

Påminnelserna räknas i fältet `paminnelser` (0–2) och nästa datum i `nasta_paminnelse`. "Inget svar"-mejlet markeras
med `inget_svar_meddelat`.

Logiken ligger i en ren funktion: `nastaSteg(arende, handelse, idag) → { arende, atgarder[] }`. Händelser:
`bekraftad`, `hyresvardSvarade`, `kundenSvarade`, `kundenAtgardad`, `dagligKontroll`. Åtgärder: `skickaAnmalan`,
`skickaPaminnelse(n)`, `skickaKundsvar`, `mejlaKund(typ)`. Funktionen gör inga anrop själv. Anroparen utför åtgärderna.
Det gör logiken testbar utan mejl och databas.

## Mejl

**Utgående** (Resend REST, som i dag): anmälan, påminnelse 1 och 2, kundens svar. Alla från `UTSKICK_FRAN` med
kundens namn i visningsnamnet, reply-to ärendets adress och kopia till kunden. Anmälan får fotona som bilagor. Varje
utskick har en idempotensnyckel (`anmalan-<id>`, `paminnelse-<n>-<id>`, `kundsvar-<meddelandeId>`).

**Till kunden** (fasta mallar): bekräfta, anmälan skickad, hyresvärden har svarat, påminnelse skickad, inget svar –
nästa steg, är bristen åtgärdad?, ärendet avslutat. Alla innehåller länken till ärendesidan.

**Inkommande** (Resend Receiving): MX-post för `SVAR_DOMAN` pekar på Resend. Resend anropar `POST /api/inkommande` med
händelsen `email.received` (bara metadata). Vi:

1. kontrollerar signaturen (Svix-huvuden, hemligheten `RESEND_WEBHOOK_SECRET`) och avvisar allt annat med 401,
2. hittar ärendet via mottagaradressen `arende-<kortId>@…` (okänt kortId: 200 utan åtgärd),
3. hämtar text och bilagor via Resends API (bilagor: högst 5, högst 10 MB vardera, sparas i lagringen),
4. godtar avsändaren om adressen är hyresvärdens eller har samma domän. Annars sparas mejlet som `okand_avsandare`,
   visas markerat på ärendesidan och skickas inte vidare,
5. låter AI:n tolka svaret, sparar meddelandet och kör `nastaSteg(hyresvardSvarade)`.

Samma mejl två gånger (Resend försöker igen) får inte ge två meddelanden: Resends mejl-id sparas som unikt
`leverantor_id`.

`kortId` är 10 slumpade tecken (gemener och siffror) och går inte att gissa. Det är inte databasens id.

## AI

Officiella `@anthropic-ai/sdk`, modell `claude-opus-5-5`, `output_config.effort: "low"`, strukturerat svar
(`output_config.format`), server-side fallback vid vägran (`fallbacks: "default"`), kontroll av `stop_reason` innan
svaret används. Uppskattad kostnad: under 1 kr per ärende.

1. **`skrivOmBeskrivning({ brist, beskrivning, temperatur })` → `{ text }`.** Saklig text i första person på svenska,
   högst cirka 150 ord, bara uppgifter kunden har lämnat. Inga lagrum, belopp, procentsatser, krav eller nya fakta.
   Spärr i koden: innehåller texten `§`, `kr`, `procent` eller siffror som inte finns i kundens text används kundens
   egen text i stället.
2. **`tolkaSvar({ anmalan, svar })` → `{ sammanfattning, kategori, fraga }`.** Sammanfattning på högst två meningar.
   Kategori: `lovar_atgard`, `atgardad`, `fragar`, `bestrider` eller `ovrigt`. `fraga` är hyresvärdens fråga om det
   finns en, annars tom. Mejlet skickas till modellen som data, och systemprompten säger att instruktioner i det ska
   ignoreras. Modellens svar kan bara bli de tre fälten, och inget av dem kan utlösa ett utskick.

På ärendesidan står "Sammanfattat av AI – läs hela svaret nedan".

**Reserv:** utan `ANTHROPIC_API_KEY`, vid fel, timeout eller vägran används kundens egen text (1) eller
`{ sammanfattning: "Hyresvärden har svarat. Läs svaret på ärendesidan.", kategori: "ovrigt", fraga: "" }` (2).
Ärendet stannar aldrig för att AI:n inte svarar.

## Foton

Webbläsaren skalar ner fotona till högst 2 000 px och gör om dem till JPEG innan de skickas. Vercels gräns är 4,5 MB per
anrop, och omkodningen tar också bort dold information. Servern tar emot högst 5 filer och högst 4 MB totalt, godtar
bara JPEG, PNG och WebP, och kodar om varje bild med `sharp` (`rotate()` och sedan JPEG, vilket tar bort all metadata,
även GPS). Filerna sparas i en privat bucket med kontrollsumma. På ärendesidan visas de via signerade länkar som gäller
en timme.

## Data (Supabase)

Ersätter tabellen `anmalan` från 2026-11-25. Den har aldrig tagits i drift.

- **`arende`:** id, kort_id (unik), status, bekrafta_hash, bekrafta_giltig_till, kundens uppgifter (namn, e-post,
  telefon), adress och lägenhetsnummer, hyresvärdens namn och e-post, brist, temperatur, sedan, beskrivning_kund,
  beskrivning_ai, amne och brevtext (det brev kunden godkände) med brev_sha256, uppdrag_version, skapad, skickad,
  skickad_datum, paminnelser, nasta_paminnelse, inget_svar_meddelat, kundfragor (0–2), atgardad, manadshyra (frivillig,
  för uppskattningen). En trigger stoppar ändringar av brevet, adresserna och kort_id.
- **`meddelande`:** id, arende_id, riktning (`ut`/`in`), typ (`anmalan`, `paminnelse`, `kundsvar`, `hyresvardssvar`,
  `okand_avsandare`), fran, till, kopia, amne, text, sha256, leverantor_id (unik), ai_sammanfattning, ai_kategori,
  ai_fraga, skapad. Raderna ändras aldrig (en trigger stoppar update).
- **`bilaga`:** id, arende_id, meddelande_id, kalla (`kund`/`hyresvard`), filnamn, mime, storlek, sha256, sokvag, skapad.

RLS påslaget utan policyer. Bara servern (med den hemliga nyckeln) läser och skriver. Lagringen ligger bakom ett
gränssnitt med en minnesvariant för testläget, som i dag.

## Sidor och anrop

| Väg | Vad |
| --- | --- |
| `/anmal` | Formulär, foton, granska (redigerbar AI-text), skicka bekräftelselänk |
| `/anmal/bekrafta#token` | Visa brevet, Skicka, sedan knapp till ärendesidan |
| `/arende#token` | Status, tidslinje, hyresvärdens svar, bilagor, textruta, "Bristen är åtgärdad" (noindex) |
| `POST /api/arende/utkast` | AI skriver om beskrivningen (högst 10 per timme per IP) |
| `POST /api/arende` | Skapa ärende (multipart med foton) och mejla bekräftelselänken |
| `POST /api/arende/bekrafta` | Visa eller skicka (ersätter `/api/anmalan/bekrafta`) |
| `POST /api/arende/sida` | Visa, svara hyresvärden, markera åtgärdad |
| `POST /api/inkommande` | Resend-webhook |
| `GET /api/cron/dagligen` | Påminnelser, frågor till kunden, radera obekräftade. Kräver `Authorization: Bearer CRON_SECRET`. Vercel Cron en gång per dag. |
| `POST /api/arende/simulera` | Bara i testläge: låtsas att hyresvärden svarar |

Token till ärendesidan står efter `#` i länken och skickas i anropets body, aldrig i adressen, som bekräftelselänken
i dag. Den är `kortId.HMAC-SHA256(LANK_HEMLIGHET, kortId)` och sparas inte. Servern räknar fram den på nytt till varje
mejl och kontrollerar den när sidan öppnas. Den gäller tills ärendet raderas.

## Lägen

- **skarp:** kräver `RESEND_API_KEY`, `UTSKICK_FRAN`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SVAR_DOMAN`,
  `RESEND_WEBHOOK_SECRET`, `CRON_SECRET` och `LANK_HEMLIGHET`. `ANTHROPIC_API_KEY` är frivillig (utan den används
  reserven).
- **test:** när `NODE_ENV` inte är production, eller när `HALVHYRA_TESTLAGE=ja` (bara för webbläsartesterna, sätts
  aldrig i drift). Minneslagring, inga mejl. Länkarna visas på skärmen och knappen "Simulera svar från hyresvärden"
  finns på ärendesidan. AI används om `ANTHROPIC_API_KEY` finns.
- **av:** produktion utan inställningar. /anmal visar "kommer snart" och väntelistan, som i dag.

"Så funkar det" på startsidan visar de nya stegen (Berätta om bristen – Vi anmäler åt dig – Vi håller dig uppdaterad)
bara när läget inte är `av`. Annars visas dagens steg. Sajten lovar aldrig något som inte fungerar.

## Säkerhet och integritet

- Spärr mot för många anrop per IP på alla publika anrop (som i dag).
- Fält som blir mejlrubriker rensas från radbrytningar (som i dag).
- Webhooken kontrollerar signatur och tidsstämpel (högst 5 minuter gammal).
- Inget i ett inkommande mejl kan få oss att skicka något. Bara kunden (via ärendesidan) och den dagliga körningen
  (fasta mallar) skickar.
- Personuppgifter loggas aldrig. Loggar innehåller bara ärende-id och händelse.
- Integritetspolicy och villkor (utkast) uppdateras: uppdraget, att vi tar emot hyresvärdens mejl, AI-tolkning med
  Anthropic som biträde, foton, lagringstid.

## Fel

- Utskick till hyresvärden misslyckas: ärendet stannar i sin status. Gäller det anmälan ser kunden "Kunde inte
  skickas, försök igen" och kan trycka Skicka igen (länken gäller 24 timmar). Gäller det en påminnelse försöker den
  dagliga körningen igen nästa dag. Samma idempotensnyckel gör att inget skickas två gånger.
- Mejl till kunden misslyckas: loggas med ärende-id, ärendet går vidare ändå.
- Webhooken svarar 500 vid tillfälliga fel så att Resend försöker igen. Dubbletter stoppas av `leverantor_id`.
- Hyresvärdens adress studsar: syns först när leveransstatus byggs (utanför den här versionen). Kunden kan se på
  ärendesidan att inget svar har kommit.

## Tester

- Enhetstester: `nastaSteg` (alla händelser och datumgränser), mallarna, kontroll av webhook-signatur, matchning av
  avsändare, AI-funktionerna med låtsasklient (inklusive spärren och reserven), fotobehandlingen (GPS borta),
  lagringens minnesvariant och Supabase-varianten mot låtsas-fetch.
- Anropstester för varje API-väg, som `src/app/api/anmalan/route.test.ts` i dag.
- Webbläsartest i testläge: fyll i med foto → granska → bekräfta → ärendesidan → simulera svar → svara hyresvärden →
  åtgärdad. Plus att /anmal är avstängd i läget `av` och att inget scrollar i sidled på 360 px.

## Utanför den här versionen

Krav på nedsättning eller återbetalning, förhandling, ansökan till hyresnämnden, betalning, konto och inloggning,
BankID, AI-skrivna svar till hyresvärden, leveransstatus och studsar, SMS, översikt över flera ärenden per kund.

## Ägarens steg innan det blir skarpt

1. Jurist granskar mallarna, uppdragstexten och de nya punkterna i `docs/JURIST-TODO.md`.
2. Köp halvhyra.se. Lägg till och verifiera domänen i Resend, lägg till `svar.halvhyra.se` för mottagning (MX-post)
   och skapa en webhook för `email.received` till `/api/inkommande`.
3. Skapa en API-nyckel hos Anthropic (console.anthropic.com).
4. Supabase-projekt (EU), kör `supabase/schema.sql`, skapa bucketen `bilagor` (privat).
5. Vercel-projekt med miljövariablerna ovan. Cron-jobbet kommer från `vercel.json`.
