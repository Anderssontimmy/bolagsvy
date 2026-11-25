# Att granska för jurist

Allt innehåll i fas 1 är utkast. Inget är juridiskt granskat. Bocka av punkt för punkt och skriv kommentarer direkt i
filen.

## 1. Procenttabellen

Fil: `src/data/procentsatser.ts`. Visas i kalkylatorn och på `/kalkylator`.

| Brist | Spann | Källa |
| --- | --- | --- |
| Störande buller | 10–35 % | Hyresgästföreningens referenstabell, enligt Hem & Hyra |
| Störande granne | 10–40 % | Samma |
| Buller, damm och obehag under renovering | 10–20 % | fastigheter.se |
| Kök eller badrum går inte att använda | 35–45 % | fastigheter.se anger cirka 40 %. Spannet är ett utkast |
| Kyla, 18–20 °C | 0–5 % | Utkast. Enligt Hyresgästföreningen kan hyresgästen under 20 °C kräva att hyresvärden utreder och mäter |
| Kyla, under 18 °C | 5–25 % | Utkast. Folkhälsomyndighetens lägsta riktvärde är 18 °C. Ett enskilt Lawline-svar nämner 25 % vid 15 °C, men det är ingen norm |
| Trasig hiss, trasig tvättstuga, mögel, vattenskada | Inget värde | Visar "Vi kan inte uppskatta beloppet än – anmäl ändå" |

- [ ] Är spannen rimliga som riktmärken? Får vi visa dem på det här sättet?
- [ ] Gränser för kyla: under 18,0 °C ger "under 18". 18,0 till och med 19,9 °C ger "18–20". **20,0 °C eller mer räknas
      inte som kallt.** Är det rätt att 20,0 °C inte ger något?
- [ ] Är det rätt att räkna buller och damm under ett stambyte som "renovering"?

## 2. Kalkylatorn

Filer: `src/lib/kalkylator.ts` och `src/components/Kalkylator.tsx`.

- [ ] Formeln: månadshyra × procentsats × antal dagar ÷ 30. Dagarna räknas som skillnaden mellan datumen. Dagen för
      anmälan räknas alltså inte med som en egen dag – en anmälan den 1 och en åtgärd den 2 ger 1 dag. Stämmer det?
- [ ] Vi frågar efter dagen då **hyresvärden fick** anmälan och föreslår ett senare datum hellre än ett för tidigt. Är
      det rätt utgångspunkt?
- [ ] Beloppen avrundas till tiotal kronor (lägsta nedåt, högsta uppåt) och visas alltid som spann med texten
      "Uppskattning – ingen garanti".
- [ ] **Text när bristen inte är anmäld skriftligt.** Uppdraget sa att hyresgästen "hittills inte har rätt till någon
      nedsättning". Lagen kräver dock inte skriftlighet: nedsättningen gäller från när hyresvärden får veta. Därför
      står det i stället: *"Du kan inte räkna med någon nedsättning för tiden hittills. Hyran kan sänkas först från den
      dag hyresvärden får veta om bristen. Utan en skriftlig anmälan är det svårt att visa vilken dag det var."* Är
      formuleringen korrekt?
- [ ] "Varje dag utan skriftlig anmälan kan kosta dig ungefär X–Y kr" (månadshyra × procent ÷ 30 per dag).
- [ ] Hjälptext: "Skriftligt betyder till exempel brev, e-post eller hyresvärdens formulär för felanmälan." Räcker
      e-post och webbformulär?
- [ ] Vid renovering, kök eller badrum visas en notis om att hyresavtalet kan begränsa rätten vid underhåll.

## 3. Artiklarna

Filer: `src/content/artiklar/*.mdx` (metadata och källor i `src/content/artiklar.ts`). Alla har rutan "Detta är allmän
information, inte juridisk rådgivning", ett datum för "senast granskad" och en källförteckning. Texterna bygger bara
på de nio fakta i uppdraget och på procenttabellen.

- [ ] **Kallt i lägenheten – har du rätt till sänkt hyra?** Riktvärdena 18 och 20 °C och räkneexemplet
      (9 000 kr, 16 °C, 30 dagar → 450–2 250 kr). Rådet att mäta i flera rum och vid olika tider.
- [ ] **Hyresreduktion vid stambyte och renovering.** Den enkla förklaringen av *sedvanligt underhåll* ("underhåll som
      är vanligt och som du kan räkna med när du bor i ett hus"). Återgivningen av 12 kap. 16 § tredje stycket JB och
      NJA 2002 s. 378. Rådet att skriva till hyresvärden även när hyresvärden vet om renoveringen.
- [ ] **Så anmäler du en brist till hyresvärden.** Exemplet med oktober som inte räknas. Beskrivningen av rekommenderat
      brev. Mallen, särskilt meningen "Jag begär nedsättning av hyran från och med i dag tills bristen är åtgärdad".
- [ ] **Störande buller eller grannar.** Att nedsättning kan krävas även när hyresvärden inte orsakat störningen
      (Fastighetsägarnas vägledning). Rådet om störningsdagbok.
- [ ] **Får jag hålla inne hyran?** Svaret nej, beskrivningen av deposition hos länsstyrelsen (minst en vecka före
      förfallodagen, länsstyrelsen bedömer inte beloppet) och stycket om förenklat tvistemål (halva prisbasbeloppet,
      29 600 kr år 2026, ombudskostnader ersätts normalt inte).
- [ ] Förklaringar av facktermer i alla artiklar: hyresnämnden ("en myndighet som hjälper till när hyresgäster och
      hyresvärdar inte är överens"), förelägga, deponera, förfallodag, ombud, skälig, bristfällig.
- [ ] Vanliga frågor på startsidan (`src/components/VanligaFragor.tsx`) och rutan "Håll aldrig inne hyran".

## 4. Villkoren

Fil: `src/content/sidor/villkor.mdx`.

- [ ] Vem som driver tjänsten (enskild näringsverksamhet – namn och organisationsnummer?).
- [ ] Ansvarsbegränsningen mot konsumentskyddande regler.
- [ ] Texten om framtida betaltjänster (fas 3) och vad som krävs för distansavtal och ångerrätt då.

## 5. Integritetspolicyn

Fil: `src/content/sidor/integritet.mdx`. Samtyckestexten finns i `src/components/Vantelista.tsx`.

- [ ] Personuppgiftsansvarig (fylls i).
- [ ] Rättsliga grunder: samtycke för väntelistan, berättigat intresse för statistik och spamskydd.
- [ ] Lagringstid: förslaget är högst 24 månader.
- [ ] Vercel som amerikanskt företag: överföring till USA och vilka skyddsåtgärder som gäller.
- [ ] Beskrivningen av Plausible (inga kakor, inga sparade IP-adresser) och av IP-adressen i spamskyddet (cirka 10
      minuter i arbetsminnet, aldrig i databasen).
- [ ] Postnummer och bristtyp: är det rätt att se dem som personuppgifter tillsammans med e-posten? Det har vi utgått
      från.
- [ ] Samtyckestexten vid väntelistan.

## 6. Marknadsföring och påståenden

- [ ] Rubriken "Du kan ha rätt till sänkt hyra" och att vi aldrig lovar ett visst utfall.
- [ ] Att vi nämner Hyresgästföreningen, Folkhälsomyndigheten, Fastighetsägarna och Lawline som källor. På om-sidan står
      också att vi inte samarbetar med Hyresgästföreningen eller någon myndighet.

## Öppna frågor

1. **Krävs inkassotillstånd från Finansinspektionen för fas 5?**
   *Notis från utvecklingen:* tillstånd enligt inkassolagen (1974:182) har hittills getts av Integritetsskyddsmyndigheten
   (IMY). Det har funnits förslag om att flytta tillsynen till Finansinspektionen. Bekräfta vilken myndighet som gäller
   och om no cure, no pay med ombud räknas som inkassoverksamhet.
2. **Prövas tvister om hyresnedsättning i hyresnämnden eller i tingsrätten, och vilken preskriptionstid gäller
   (12 kap. 61 § JB)?** Svaret påverkar artikeln "Får jag hålla inne hyran?" och vägledningen i fas 3. Kalkylatorn
   varnar i dag inte för gamla anmälningsdatum.

### Fler frågor som dök upp under bygget

3. Fas 2: får vi skicka anmälan till hyresvärden *för* hyresgästens räkning från vår e-posttjänst? Gäller den som
   hyresgästens egen skriftliga anmälan?
4. Fas 2: hur länge får eller bör vi spara utskick och bevis om hyresgästen ber om radering, när de kan behövas som
   bevis i en tvist?
5. Fas 4: räcker ett aktivt val för att visa "grannar på din adress har anmält samma brist", om vi bara visar antal och
   bara när minst 3 har anmält?
