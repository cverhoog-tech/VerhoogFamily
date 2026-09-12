# FamilyApp — Visual Design System v1

Status: **CANONIEKE VISUELE BASIS**  
Vastgelegd: **11-09-2026**  
Branch: `agent/household-rebuild-v2`

Deze specificatie legt het gedeelde visuele DNA van FamilyApp vast. De op 11-09-2026 aangeleverde referentiebeelden voor **Schoonmaken** en **Benodigdheden** zijn de primaire referentie voor gevoel, kleurgebruik, icon treatment, spacing, hiërarchie en mobile compositie.

Het doel is **geen pixel-copy van statische mockups**, maar een herkenbare, consistente FamilyApp-taal die op echte iPhone premium, rustig en modern voelt.

---

## 1. Kerngevoel — Calm Premium Home

FamilyApp moet aanvoelen als een hoogwaardige consumer-app voor het gezin, niet als een admin-dashboard of SaaS-tool.

De gewenste combinatie is:

**warm + clean + rustig + premium + menselijk + licht luxe + duidelijk mobiel.**

Visueel betekent dit:

- veel ademruimte;
- sterke, eenvoudige hiërarchie;
- warme off-white light mode en diepe navy/near-black dark mode;
- zachte cards met subtiele borders/elevation;
- doelgerichte kleur, nooit kleur om lege ruimte op te vullen;
- contextuele fotografie waar die betekenis toevoegt;
- minimalistische gekleurde icon tiles;
- grote, duidelijke touch targets;
- één hoofdactie per context;
- beperkte micro-effects, geen visuele overbelasting.

**Minimalistisch betekent niet kaal.** FamilyApp mag sfeer, diepte en identiteit hebben, maar elke visuele laag moet een functie hebben.

---

## 2. Productgrens: dezelfde designfamilie, verschillende modules

### Taken

Taken beantwoordt primair:

**Wat moet ik of iemand anders doen?**

Taken is de algemene uitvoerlaag voor losse en geplande taken, deadlines, assignees, subtaken/checklists en taakstatus.

### Schoonmaken

Schoonmaken beantwoordt primair:

**Hoe hebben we het onderhoud van ons huis georganiseerd?**

Schoonmaken is de structurele plek voor:

- kamers;
- schoonmaakroutines;
- frequentie/planning;
- concrete schoonmaakbeurten;
- benodigdheden per kamer/routine;
- voorraadstatus;
- historie van onderhoud.

Schoonmaken mag **niet** uitgroeien tot een tweede Taken-module.

Een concrete schoonmaakbeurt mag als uitvoer zichtbaar zijn in Taken en Agenda, maar de vaste routine, kamercontext en benodigdheden blijven eigendom van Schoonmaken.

### Gedeeld

Taken en Schoonmaken delen:

- navigatiepatronen;
- spacing;
- typografie;
- card-radii;
- button- en segmented-control-stijl;
- person/assignee cards;
- checklist treatment;
- progress UI;
- statuschips;
- icon treatment;
- light/dark tokenlogica;
- motionprincipes.

Ze delen **geen inhoudsmodel**.

---

## 3. Basistokens

Deze waarden zijn de visuele doelwaarden voor nieuwe/refactored FamilyApp-componenten. Kleine optische correcties per component zijn toegestaan, maar willekeurige nieuwe maten niet.

### 3.1 Spacing scale

Gebruik primair:

- `4px` — micro spacing;
- `8px` — icon/text en compacte interne afstand;
- `12px` — compacte card padding/gaps;
- `16px` — standaard mobile padding;
- `20px` — ruime card padding;
- `24px` — sectieafstand;
- `32px` — grote hoofdstukafstand.

Standaard horizontale schermpadding op mobiel: **16px**.  
Grote hero/detailcomposities mogen optisch naar **18–20px**.

### 3.2 Radius scale

- kleine chip/icon tile: `12px`;
- controls/supply rows: `14–16px`;
- cards: `18–20px`;
- grote detail-/hero cards: `22–24px`;
- grote sheet/phone-surface elementen: `26–28px` waar passend.

Vermijd een mix van veel willekeurige radii op één scherm.

### 3.3 Touch targets

- absolute minimum: **44 × 44px**;
- primaire buttons: bij voorkeur **52–56px hoog**;
- list rows: bij voorkeur **68–80px hoog**;
- icon-only acties: minimaal **44px** hit area, ook als het visuele icoon kleiner is.

### 3.4 Typography hierarchy

Richtwaarden:

- screen/detail title: `28–32px`, zwaar;
- card/turn title: `20–24px`, semibold/bold;
- section title: `16–18px`, semibold;
- row title: `15–17px`, semibold;
- body: `14–16px`;
- metadata: `12–14px`;
- micro/status helper: `10–12px`.

Uppercase labels alleen spaarzaam voor kleine sectie-kickers. Geen hele schermen met dashboard-achtige all-caps labels.

---

## 4. Kleurtaal

FamilyApp gebruikt een rustige neutrale basis met één herkenbaar violet merkaccent en semantische statuskleuren.

### 4.1 FamilyApp identity

Richttoken light:

- primary violet: `#6D3FEA`;
- violet soft: `rgba(109,63,234,.10)`;
- violet border: `rgba(109,63,234,.24)`.

Richttoken dark:

- primary violet: `#9A72FF`;
- violet soft: `rgba(154,114,255,.13)`;
- violet border: `rgba(154,114,255,.28)`.

Violet is voor:

- primaire navigatie/interactie;
- selected segmented controls;
- relevante utility actions;
- FamilyApp-identiteit.

Violet is **niet automatisch de statuskleur van alles**.

### 4.2 Semantic status

- succes / aanwezig / afgerond: warm groen `#34B45A` light, helderder groen in dark;
- bijna op / aandacht: amber-oranje `#F0A321`;
- ontbreekt / fout: gecontroleerd rood `#E84B55`;
- gepland: groen/teal;
- flexibel: violet;
- neutraal/inactief: muted slate.

Status moet naast kleur altijd door tekst of icoon begrijpelijk blijven.

### 4.3 Light mode

Doel:

- warme off-white/crème basis, ongeveer `#F7F5F1` / `#FAF8F4`;
- primaire surfaces bijna wit maar niet klinisch;
- tekst diep charcoal;
- zachte grijs-beige borders;
- shadows met lage opacity en brede blur;
- kleur als accent, niet als achtergrondruis.

### 4.4 Dark mode

Doel:

- diepe navy/near-black basis, ongeveer `#07101A` / `#09111B`;
- cards één of twee luminantiestappen lichter dan canvas;
- tekst warm wit, geen hard puur wit voor alles;
- borders subtiel licht of lokaal getint;
- accentglow alleen bij hero/status/CTA waar betekenisvol;
- geen neon-overload.

Light en dark gebruiken **dezelfde structuur en componentboom**.

---

## 5. Icon system — essentieel FamilyApp-DNA

De benodigdhedenreferenties leggen de gewenste icoonstijl vast.

### 5.1 Vorm

Een standaard benodigdheden-/utility-icoon bestaat uit:

1. een eenvoudige herkenbare lijnillustratie;
2. in een zachte getinte tile/cirkel;
3. met voldoende contrast, maar zonder zware outline/glow.

Richtwaarden:

- icon tile: **44–48px**;
- tile radius: **12–15px** of ronde variant indien semantisch beter;
- glyph: **22–26px**;
- stroke: visueel ongeveer **1.8–2.2px**;
- max. 1 hoofdkleur per tile.

### 5.2 Benodigdheden

Voorbeelden van pictogramstijl:

- sprayfles / reiniger;
- doekjes;
- spons;
- handschoenen;
- raamtrekker;
- ontkalker;
- vuilniszak;
- borstel;
- emmer.

Gebruik **geen generieke emoji** als definitieve production-iconen.

### 5.3 Kleur per item versus voorraadstatus

De itemtegel mag een categorie-/objectkleur hebben. De voorraadstatus rechts is de semantische waarheid.

Voorraadstatus:

- `Op voorraad` → groen check treatment;
- `Bijna op` → amber waarschuwing;
- `Ontbreekt` → rood fout/attention treatment.

Hierdoor hoeft een rood statusicoon niet te betekenen dat ook de productillustratie volledig rood wordt.

### 5.4 Rechter statusindicator

Richtwaarden:

- `30–36px` visuele cirkel;
- duidelijke check / `!` / x;
- zachte tint of outline;
- geen zware badge die visueel concurreert met de itemnaam.

---

## 6. Fotografie / hero assets

Fotografie is context, geen wallpaper.

### Richting

- premium modern gezinshuis;
- warm, realistisch, rustig;
- geen mensen nodig voor kamerhero's;
- geen tekst/labels/UI in de asset zelf;
- goede lokale belichting;
- voldoende rustige zones voor overlays/status;
- geen generieke stockfoto-look.

### Light

- natuurlijk daglicht;
- warm neutraal;
- luchtig zonder overbelichting.

### Dark

- dezelfde premium huiswereld, maar met avond/nachtkarakter;
- praktische lichtbronnen zichtbaar;
- diepe blacks/navy;
- warme highlights;
- geen simpel donker filter over de light asset.

### Hero placement

De kamerhero in een concrete beurt/detail:

- breed en dominant bovenin;
- ongeveer **180–220px** hoog op standaard iPhone, responsief;
- radius `22–24px`;
- statuschip in of direct op de hero;
- geen tekst in druk deel van het beeld zonder leesbaarheidsgradient.

---

## 7. Shared component language

De volgende componenten vormen de gedeelde FamilyApp-familie.

### `FAAppHeader`

- back links;
- gecentreerde of duidelijk dominante titel;
- overflow rechts;
- geen extra decoratie zonder functie.

### `FAHeroMediaCard`

- fotografie/illustratie;
- statuschip;
- optionele gradient;
- geen dashboarddata in de hero proppen.

### `FAStatusPill`

- compacte tekststatus;
- semantische tint;
- subtiele border/background;
- minimaal 34–36px hoog wanneer interactief.

### `FAPersonCard`

- avatar 40–48px;
- naam prominent;
- rol/context muted eronder;
- card rustig en niet groter dan nodig.

### `FAProgressBlock`

- label links;
- percentage rechts;
- dunne premium progressbar;
- één korte ondersteunende zin.

### `FAChecklistCard`

- rows onder elkaar;
- 52–60px per regel minimaal;
- duidelijke ronde check-state;
- subtiele dividers;
- afgerond blijft leesbaar maar rustiger.

### `FAPrimaryCTA`

- één hoofdactie;
- 52–56px hoog;
- full width in detailflows;
- violet of contextueel groen wanneer de actie letterlijk uitvoering/start/completion representeert;
- nooit meerdere concurrerende primary CTA's in één viewportsectie.

### `FASecondaryCTA`

- rustige outline/surface;
- zelfde radiusfamilie;
- visueel duidelijk onder primary.

### `FAUtilityPair`

Twee gelijke utility buttons naast elkaar voor acties zoals:

- `Bekijk beurt`;
- `Benodigdheden`;
- `Alle kameritems`;
- `Boodschappen`.

Utility ≠ primary action.

### `FASegmentedControl`

- maximaal 2–3 opties in deze detailcontext;
- selected state met violet-tint/border;
- ruime hit area;
- geen tabbar-look binnen een sheet.

### `FASupplyRow`

- icon tile links;
- itemnaam prominent;
- voorraadstatus onder itemnaam;
- statusindicator rechts;
- rijhoogte ongeveer **72–80px**;
- rustige surface met radius `16–18px`.

### `FAMissingSupplyCTA`

- zachte violet/premium callout;
- titel `Ontbreekt iets?`;
- uitleg `Voeg direct toe aan boodschappen`;
- ronde plusactie rechts;
- duidelijk actieblok maar niet zwaarder dan de primaire schoonmaakactie.

### `FAInventorySummary`

- compacte statuskaart;
- tekstuele samenvatting van bijna-op/ontbreekt;
- kleur in woorden/counters;
- geen mini-dashboard met te veel cijfers.

---

## 8. Schoonmaken — functionele en visuele identiteit

Schoonmaken is **home maintenance**, niet task management.

De module moet primair sturen op:

**kamer → routine → planning → uitvoering → benodigdheden → historie.**

Gebruik consequent woorden als:

- `routine`;
- `onderdeel`;
- `schoonmaakbeurt`;
- `benodigdheden`;
- `kameritems`.

Vermijd in Schoonmaken waar mogelijk Taken-taal zoals `subtaak toevoegen` wanneer het feitelijk om een routineonderdeel gaat.

### Concrete schoonmaakbeurt — harde layout

Volgorde:

1. `FAAppHeader` — back, kamernaam, overflow.
2. `FAHeroMediaCard` — kamerfoto + status `GEPLAND` / andere status.
3. Grote titel — bijvoorbeeld `Badkamer schoonmaken`.
4. Metadata — dag, tijdvak, aantal onderdelen, geschatte duur.
5. `FAPersonCard` — toegewezen persoon.
6. `FAProgressBlock` — routinevoortgang.
7. `FAChecklistCard` — alleen onderdelen van deze concrete beurt.
8. `FAPrimaryCTA` — `Start schoonmaken` / passende execution state.
9. `FASecondaryCTA` — `Bewerken`.
10. `FAUtilityPair` — `Bekijk beurt` + `Benodigdheden` met badge indien relevant.

Geen zelfstandige grote Samenwerken-sectie in deze hiërarchie. Contextuele samenwerking mag als compacte beurtactie bestaan zonder de hoofdflow te domineren.

---

## 9. Benodigdheden — harde layout

Benodigdheden is een eigen contextuele detailflow, gekoppeld aan kamer/routine/voorraad.

Volgorde:

1. `FAAppHeader` — `Badkamer – Benodigdheden` + back + overflow.
2. Optionele compacte kamerhero alleen wanneer deze visueel rust geeft; nooit verplicht als hij de lijst naar beneden duwt zonder informatiewaarde.
3. `FASegmentedControl`:
   - `Voor deze beurt`;
   - `Alle kameritems`.
4. Introregel — bijvoorbeeld `Wat je nodig hebt voor vandaag 19:30`.
5. `FASupplyRow` lijst.
6. `FAMissingSupplyCTA` — ontbrekend item direct richting Boodschappen.
7. `FAInventorySummary` — bijvoorbeeld `1 bijna op • 1 ontbreekt`.
8. Onderste utility actions:
   - `Bekijk alle kameritems`;
   - `Boodschappen` + badge wanneer relevant.

### Productregel

`Voor deze beurt` toont alleen benodigdheden die nodig zijn voor de routineonderdelen van de concrete occurrence.

`Alle kameritems` toont de structurele benodigdheden van de kamer.

Voorraadstatus en shoppen blijven verbonden, maar Schoonmaken wordt geen volledige warehouse-/voorraadmodule.

---

## 10. Taken — visueel aansluiten zonder kopie te worden

Taken krijgt later dezelfde premium shell en componentfamilie, maar behoudt een eigen informatielogica.

### Taken mag delen

- header;
- assignee card;
- checklist card;
- primary/secondary CTA;
- utility pair;
- statuspill;
- progress;
- icon tiles;
- spacing/radii/typografie;
- violet identity;
- light/dark surfaces.

### Taken mag niet automatisch overnemen

- kamerhero als verplicht element;
- routineprogressie;
- voorraadstatus;
- benodigdheden als standaardsectie;
- kamer-/routinebegrippen;
- CleaningOccurrence-logica.

### Visueel onderscheid

Taken mag iets sterker de FamilyApp-violet/quest-identiteit dragen. Schoonmaken blijft warmer, huisgerichter en contextueel fotografisch.

**Zelfde productfamilie, andere mentale taak.**

---

## 11. Light / dark parity

Voor ieder gedeeld component geldt:

- dezelfde inhoud;
- dezelfde volgorde;
- dezelfde afmetingen;
- dezelfde interaction states;
- alleen tokens/assets veranderen.

Dark mode mag rijker in contrast en ambient glow zijn. Light mode blijft warm en gelaagd en wordt nooit een platte witte fallback.

---

## 12. Motion / premium gevoel

Motion moet native en rustig voelen.

Wel:

- `120–220ms` transitions voor state changes;
- subtiele press scale / opacity;
- zachte progress updates;
- sheet transitions;
- statusfeedback zonder layout-jump.

Niet:

- continue animaties;
- zware blur/backdrop-filter stacks;
- repaint-intensieve glows;
- spring/bounce op elk element;
- motion die de iPhone-performancebasis aantast.

Performance op echte iPhone is onderdeel van designkwaliteit.

---

## 13. Do / Don't

### Do

- gebruik kleur doelgericht;
- laat één hoofdactie dominant zijn;
- geef lijsten voldoende verticale rust;
- gebruik icon tiles om objecten snel herkenbaar te maken;
- gebruik fotografie voor kamer/context;
- behoud status altijd tekstueel;
- bouw light/dark uit dezelfde componenten;
- maak Taken en Schoonmaken herkenbaar familie van elkaar.

### Don't

- geen generiek SaaS-dashboard;
- geen klinisch wit canvas;
- geen neon-overload;
- geen vijf accentkleuren zonder semantiek;
- geen emoji als definitieve functionele iconenset;
- geen zware glass/blurlaag op elk element;
- geen grote losse secties voor secundaire acties;
- geen dashboardcards met onnodige statistieken;
- geen Schoonmaken-UI die functioneel een tweede Taken-module wordt;
- geen Taken-UI die geforceerd kamerfotografie/routines overneemt.

---

## 14. Implementatievolgorde vanaf deze baseline

1. Schoonmaken concrete beurt/detail-sheet exact naar deze layoutfamilie brengen.
2. Benodigdheden-detail exact naar de supply-row/icon/status-taal brengen.
3. Schoonmaken overige cards/tabs harmoniseren zonder functionele architectuur te wijzigen.
4. Real-device light + dark verificatie.
5. Daarna Taken visueel harmoniseren met dezelfde shared primitives.
6. Cross-module consistency pass.

Functionele canonical-state regels blijven leidend. Visual harmonisatie mag nooit een tweede writer, tweede authority of zware achtergrondruntime introduceren.

---

## 15. Acceptatiecriteria

Een nieuw/refactored FamilyApp-scherm slaagt visueel pas wanneer:

- het op iPhone direct als FamilyApp herkenbaar voelt;
- light en dark dezelfde informatiehiërarchie hebben;
- primary/secondary/utility acties direct onderscheidbaar zijn;
- iconen coherent en betekenisvol zijn;
- kleuren functioneel en gedoseerd zijn;
- spacing/radii niet willekeurig afwijken;
- het scherm rustig blijft ondanks rijke inhoud;
- Schoonmaken nog steeds primair over huisonderhoud/routines/benodigdheden gaat;
- Taken nog steeds primair over algemene uitvoering gaat;
- er geen performance-regressie is door visuele effecten.
