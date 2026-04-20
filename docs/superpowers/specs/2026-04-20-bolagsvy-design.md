# Bolagsvy — Produktspec

**Datum:** 2026-04-20  
**Status:** Godkänd av grundare

---

## Sammanfattning

Bolagsvy är ett freemium-verktyg för sökning och bevakning av svenska bolag. Gratisnivån driver organisk SEO-trafik via individuella bolagssidor; Pro-nivån monetiserar med avancerad filtrering, CSV-export och e-postbevakning. Produkten byggs och underhålls av en person med Claude Code som utvecklare.

---

## Problem & marknad

- Allabolag.se är dominerande men har gammaldags UX och inga kraftfunktioner
- Creditsafe/UC är dyra enterprise-verktyg (2 000–10 000 kr/mån)
- Apollo/LinkedIn Sales Navigator har tunn och opålitlig data på svenska bolag
- Gap: ingen erbjuder billig + enkel + Sweden-native prospektering och bevakning

**Primär köpare:** Säljare, SDR:s och rekryterare på SME-bolag (10–100 anställda) som letar leads eller bevakar marknaden.

**Sekundär köpare:** Grundare och VD:ar som vill följa konkurrenter och sin bransch.

---

## Produkt

### Gratisnivå (alla)
- Sök bolag på namn eller org.nr
- Bolagsprofil: adress, SNI-bransch, styrelseledamöter, registreringsdatum, omsättningsklass
- Länk till senaste årsredovisning (Bolagsverket)
- Delbar URL per bolag (`bolagsvy.se/bolag/[slug]`)

### Pro — 299 kr/mån eller 2 490 kr/år
- Avancerad filtrering: bransch (SNI), stad/län, omsättning (intervall), antal anställda, bolagsålder
- Spara sökningar
- Exportera sökresultat som CSV
- Bolagsbevakning: lägg till valfria bolag på watchlist
- Veckodigest varje måndag: styrelseändringar, omsättningshopp, adressändringar

### Ej i v1
- Team-/organisationskonton
- CRM-integrationer
- API-access
- Mobilapp

---

## Nyckelskärmar

1. **Startsida** — stor sökruta, enkel hero, länk till Pro. SEO-optimerad.
2. **Bolagsprofil** — `/bolag/[slug]`, statiskt genererad per bolag, indexeras av Google
3. **Sökresultat med filter** (Pro) — filterpanel till vänster, resultatlista till höger, exportknapp
4. **Bevakningsdashboard** (Pro) — lista bevakade bolag, senaste ändringar, inställningar för digest
5. **Konto & betalning** — Stripe-integration, byt plan, avsluta

---

## Organisk tillväxtstrategi

Produkten genererar en statisk SEO-sida för varje aktivt svenskt bolag (~600 000 st). Google indexerar dessa och rankar dem på sökningar som "[bolagsnamn] org nr", "[bolagsnamn] styrelse" etc. Trafiken är gratis och passiv efter lansering.

Inga betalda annonser eller aktiv försäljning i v1.

---

## Teknikstack

| Komponent | Val | Motivering |
|---|---|---|
| Frontend & routing | Next.js (App Router) | SSG för bolagssidor, SEO-vänlig |
| Hosting | Vercel | Gratis tier, global CDN, noll ops |
| Databas | Supabase (PostgreSQL) | Managed, inbyggd auth, gratis tier |
| Autentisering | Supabase Auth | Ingår, enkel e-post/Google-login |
| Betalning | Stripe | Standard för SaaS-prenumerationer |
| E-post | Resend | Billig, modern, bra DX |
| Data | Bolagsverkets öppna API | Gratis, officiell källa |
| Datasynk | Vercel Cron Jobs | Nattlig synk av bolagsändringar |

**Driftkostnad för ägaren:** 0–200 kr/mån fram till hundratals betalande kunder.

---

## Intäktsmodell & milstolpar

| Fas | Mål | Intäkt |
|---|---|---|
| Månad 1–3 | Bygga MVP, lansera, indexera | 0 kr |
| Månad 3–6 | Google börjar ranka, första Pro-kunder | 1 000–5 000 kr/mån |
| ~50 Pro-kunder | Ramen-lönsamhet | ~15 000 kr/mån |
| ~200 Pro-kunder | Bra lön, fortfarande solo | ~60 000 kr/mån |

---

## Risker

| Risk | Sannolikhet | Hantering |
|---|---|---|
| Allabolag bygger Pro-funktioner | Låg (mediebolag, ej produktfokus) | Bygg snabbt, skaffa lojala kunder |
| Bolagsverkets API ändras | Låg | Håll koll på API-changelog |
| SEO tar lång tid | Medel | Förvänta 3–6 månader, inte veckor |
| Låg konvertering fri→Pro | Medel | A/B-testa uppgraderingsprompts |
