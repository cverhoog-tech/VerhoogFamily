# FamilyApp — Schoonmaken Visual Specification

Status: **GOEDGEKEURD / CANONIEKE LAYOUT**
Datum: 2026-08-30
Laatste visuele baseline-bevestiging: 2026-09-06
Branch: `agent/household-rebuild-v2`

Deze specificatie legt de goedgekeurde premium Schoonmaken-indeling vast. De goedgekeurde dark-mode mock-up is de visuele referentie voor compositie, informatiehiërarchie en interactie. De uiteindelijke implementatie moet dezelfde layout ook als volwaardige light-mode variant leveren.

## 0. Definitieve premium art-direction baseline — 2026-09-06

De op 2026-09-06 opnieuw aangeleverde light- en dark-mode mockups gelden vanaf deze fase als **primaire visuele referentie** naast de functionele regels in dit document. De implementatie hoeft niet pixel-voor-pixel een statische mockup te kopiëren, maar moet aantoonbaar dezelfde ontwerpkarakteristiek, hiërarchie en kwaliteitslat halen.

Kernrichting voor FamilyApp:

**warm cinematic surfaces + contextual photography + restrained glass + semantic status colour + violet FamilyApp identity + native iOS spacing/interaction.**

Dit betekent concreet:

- FamilyApp moet voelen als een hoogwaardige consumer-app, niet als een generiek SaaS-dashboard.
- Schoonmaken is de visuele benchmark voor de verdere harmonisatie van FamilyApp.
- Contextuele huis-/kamerfotografie is onderdeel van de componentcompositie en niet alleen losse decoratie.
- Fotografie krijgt altijd gecontroleerde overlays/gradients zodat tekst en controls betrouwbaar leesbaar blijven.
- Niet iedere kaart krijgt tegelijk glow, gradient en fotografie: hero's en belangrijke statuskaarten mogen rijk zijn; secundaire surfaces blijven rustiger zodat visuele hiërarchie behouden blijft.
- Status beïnvloedt subtiel de hele component en niet alleen een badge: border, ambient tint/glow, icon treatment en relevante CTA mogen de statussemantiek ondersteunen.
- Statussemantiek blijft: gepland/afgerond groen-teal, flexibel violet/paars, wacht/aandacht amber-goud/oranje, kritisch/ontbreekt gecontroleerd rood.
- Violet blijft de herkenbare FamilyApp-identiteit voor navigatie en primaire interactie, ook wanneer een module eigen semantische statuskleuren gebruikt.
- Iconen krijgen waar passend een hoogwaardige getinte/glass container in plaats van generieke grijze lijniconen zonder context.
- Avatars zijn onderdeel van de informatiehiërarchie en worden compact, helder en consistent gepresenteerd.
- Cards zijn rijk en ruim genoeg voor mobile touch, maar bevatten geen onnodige dashboard-dichtheid.
- Alle primaire interactieve targets blijven minimaal 44x44 px.

### Light mode baseline

- Warme off-white/crème app-basis; geen klinisch wit canvas.
- Zachte elevation, zeer subtiele borders en gecontroleerde shadows.
- Heldere, warme fotografie geïntegreerd in hero's en kamerkaarten.
- Licht getinte glass/surface-lagen in plaats van platte witte rechthoeken.
- Veel ademruimte en sterke typografische hiërarchie.
- Semantische kleuren zijn verfijnd en niet overdreven verzadigd.
- Paars blijft het herkenbare primaire FamilyApp-accent.

### Dark mode baseline

- Diepe bijna-zwarte/navy basis, niet simpelweg `black` met dezelfde light-mode kaarten erbovenop.
- Donkere, sfeervolle fotografie met lokale lichtbronnen en gecontroleerd contrast.
- Translucent/donkere surfaces met subtiele gekleurde edge-glows waar status of interactie dat rechtvaardigt.
- Groen/teal, violet en amber mogen sterker spreken dan in light mode, maar neon-overload wordt expliciet vermeden.
- Belangrijke hero/statuscomponenten mogen cinematic zijn; ondersteunende controls blijven rustiger.

### Relatie Schoonmaken ↔ Taken

Schoonmaken en Taken moeten dezelfde designfamilie gebruiken voor onder andere:

- spacing;
- radii;
- surface hierarchy;
- shadows/glass;
- typography;
- chips/badges;
- buttons en icon-buttons;
- avatar presentation;
- progress UI;
- empty/loading/error states;
- motion/microinteractions;
- light/dark tokenlogica.

Ze worden **niet identiek** gemaakt. Schoonmaken behoudt warme huis-/kamerfotografie en duidelijke cleaning/statussemantiek. Taken gebruikt dezelfde kwaliteitsstandaard en primitives, maar behoudt sterker het violet FamilyApp/quest-karakter en de bestaande taaksemantiek. Taakkaarten mogen dus dezelfde primitives gebruiken als schoonmaakkaarten zonder visueel kamerkaarten te worden.

### Implementatievolgorde premium visual polish

1. Audit actuele Schoonmaken- en Taken-UI + bestaande shared primitives.
2. Shared Visual Language vastzetten zonder een groot nieuw design-framework te introduceren.
3. Schoonmaken Overzicht redesign.
4. Schoonmaken Planning redesign.
5. Schoonmaken Kamers + Gepland per kamer redesign.
6. Schoonmaken dialogs/empty/loading/error + volledige light/dark polish.
7. Taken-overzicht visueel harmoniseren.
8. Bestaande taakkaarten redesignen zonder functionele taakarchitectuur te wijzigen.
9. Cross-module consistency pass.
10. Regressie/CI/unieke preview en daarna real-device acceptatie.

De functionele STEP 14-architectuur en canonical-state regels veranderen door deze visual-polishfase niet.

## 1. Niet onderhandelbare ontwerpprincipes

- Premium, dynamisch en gelaagd; geen platte/basic witte kaartenset.
- Mobile-first, primair ontworpen voor iPhone/PWA.
- Diepte via glass surfaces, rijke kamerbeelden/illustraties, gradients, zachte shadows en duidelijke statusaccenten.
- Dark en light mode gebruiken **dezelfde componenten, dezelfde layout, dezelfde volgorde en dezelfde interacties**.
- Light mode is geen vereenvoudigde restyle; ook daar blijven diepte, gradients, layered surfaces en premium contrast aanwezig.
- Themeverschillen lopen via gedeelde design tokens. Geen gedupliceerde markup, aparte DOM-structuur of monkeypatch-CSS per thema.
- Status blijft naast kleur altijd tekstueel herkenbaar.
- Persoonlijke weergavevoorkeur Tijd / Aantal / Beide wordt overal gerespecteerd.

## 2. Hoofdstructuur

Primaire module-ingangen:

1. Overzicht
2. Planning
3. Kamers

Binnen **Kamers** staat een toggle:

- Kamers
- Gepland per kamer

De goedgekeurde visuele richting toont daarnaast contextuele toegang tot Geschiedenis/Meer waar nodig, zonder dat de kernarchitectuur daardoor een tweede taken- of agendamodule wordt.

## 3. Overzicht — exacte informatiehiërarchie

Boven naar beneden:

1. Begroeting + datum + profiel/avatar.
2. Grote premium **Huisstatus hero** met:
   - grote voortgangsring;
   - weekpercentage;
   - statussen zoals Gepland / Flexibel / Wacht op akkoord / Afgerond;
   - totale belasting volgens persoonlijke Tijd/Aantal/Beide-instelling.
3. **Aandacht nodig**-kaart voor het belangrijkste open voorstel/conflict.
4. **Snelle acties** zoals nieuwe taak/beurt, voortgang, benodigdheden, instellingen.
5. Compacte recente activiteit.

Hero en kaarten mogen kamer-/huisbeelden als achtergrond gebruiken met voldoende overlay voor leesbaarheid.

## 4. Kamers — basisweergave

Bovenaan:

- titel Kamers;
- toggle **Kamers / Gepland per kamer**.

De kamerweergave is de plek voor structurele kamerconfiguratie en toegang tot routines.

Elke relevante kamerkaart bevat minimaal:

- kamernaam;
- visueel kamerbeeld/illustratie;
- status;
- eerstvolgende beurt of routinecontext;
- toegewezen persoon/avatar indien van toepassing;
- persoonlijke Tijd/Aantal/Beide-weergave;
- actie **Bekijk beurt/kamer**;
- vaste actie **Benodigdheden**.

## 5. Gepland per kamer — canonieke layout

Dit is het huisbrede planningsscherm dat in één oogopslag antwoord geeft op: **wat staat er momenteel per kamer gepland?**

### Bovenste hero

Een premium samenvatting **Dit staat er in huis gepland** met:

- aantal actieve kamers/beurten;
- totaal Gepland;
- totaal Flexibel;
- totaal Wacht op akkoord;
- totaal Afgerond;
- totale geschatte Tijd/Aantal/Beide volgens gebruikersvoorkeur.

### Sortering / secties

Niet puur alfabetisch. Groepeer op toestand:

1. **Aandacht nodig**
2. **Gepland**
3. **Flexibel**
4. **Afgerond**

### Kamerkaart

Iedere kaart bevat:

- rijk kamerbeeld/illustratie als geïntegreerde achtergrond;
- kamernaam;
- statuschip;
- dag/tijd of flexibel tijdvak;
- aantal onderdelen en/of geschatte duur;
- toegewezen avatar/persoon;
- eventueel progressie;
- primaire actie **Bekijk beurt**;
- secundaire actie **Benodigdheden**.

### Status-art-direction

- Gepland: groen/teal.
- Flexibel: paars.
- Wacht op akkoord: amber/goud.
- Bezig: actieve progressie-accenten.
- Afgerond: rustig groen met duidelijke check.
- Aandacht nodig: warm oranje/rood, niet agressief alarmrood.

De statuskleur beïnvloedt subtiel border, glow/gradient en kaartomgeving; niet alleen een klein label.

## 6. Benodigdheden op iedere kamerkaart

**Benodigdheden** is een vaste zichtbare actie op iedere kamerkaart in Kamers en Gepland per kamer.

Status op/naast de knop:

- alles aanwezig;
- 1+ bijna op;
- 1+ ontbreekt.

Gedrag:

- Heeft de kamer een actuele/geplande schoonmaakbeurt: open standaard **Voor deze beurt**.
- Toon alleen materialen die nodig zijn voor de routine-items van die concrete beurt.
- Bied een tweede tab/keuze **Alle kameritems**.
- Heeft de kamer geen actieve beurt: open direct alle kamerbenodigdheden.
- Vanuit benodigdheden kunnen Bijna op/Op-items na bevestiging naar Boodschappen.

## 7. Kamerdetail / concrete schoonmaakbeurt

Boven naar beneden:

1. Kamerhero met rijk beeld.
2. Statuschip (bijv. Gepland).
3. Titel van de schoonmaakbeurt.
4. Dag/tijd/flexibel moment + geschatte belasting.
5. Toegewezen persoon/avatar.
6. Routineprogressie.
7. Checklist met de onderdelen die deze beurt daadwerkelijk aan de beurt zijn.
8. Primaire actie Start schoonmaken / Taak afronden.
9. Secundaire beheeractie.

De vaste routine blijft structureel eigendom van Schoonmaken; deze concrete beurt is de uitvoeringsprojectie richting Taken/Agenda.

## 8. Benodigdheden-detail

Exacte structuur:

- kamer + titel Benodigdheden;
- toggle **Voor deze beurt / Alle kameritems**;
- product/materialenlijst;
- per item voorraadstatus Op voorraad / Bijna op / Op;
- duidelijke indicatie wanneer een product ontbreekt;
- actie om ontbrekende items toe te voegen aan Boodschappen;
- link naar algemene kamer-voorraadstatus.

Geen volledige voorraadadministratie met milliliters/aantallen verplicht in MVP.

## 9. Voorstel / goedkeuring

De kaart/pagina gebruikt dezelfde rijke kamercontext.

Toon minimaal:

- Wacht op akkoord-status;
- kamer;
- voorgestelde dag/tijd of flexibel moment;
- Tijd/Aantal/Beide;
- voorgestelde persoon/personen;
- relevante context waarom het voorstel bestaat.

Acties:

- Accepteren;
- Aanpassen / tegenvoorstel;
- Afwijzen.

Regel blijft: wat geaccepteerd kan worden moet ook geweigerd kunnen worden.

## 10. Flexibele beurt

Visueel herkenbaar met paarse statusart-direction.

Toon:

- kamerbeeld;
- Flexibel-status;
- periode zoals Dit weekend;
- belasting;
- toegewezen persoon;
- callout dat er nog geen exact moment is;
- primaire actie **Plan dit moment**;
- secundaire acties **Bekijk beurt** en **Benodigdheden**.

## 11. Dark mode — goedgekeurde art direction

- Diepe bijna-zwarte/navy basis.
- Glasachtige surfaces met lichte transparantie.
- Kamerbeelden donker en sfeervol, geïntegreerd in de kaarten.
- Heldere maar gecontroleerde groen/teal, paars en amber statusaccenten.
- Paarse FamilyApp-accentkleur blijft aanwezig voor navigatie en interactie.
- Subtiele glows; geen neon-overload.

## 12. Light mode — verplicht equivalent

Light mode moet **exact dezelfde schermindeling** gebruiken.

Aanpassen via theme tokens:

- warme off-white / zachte crème basis in plaats van klinisch wit;
- licht getinte glass surfaces;
- borders met voldoende contrast maar subtiel;
- zachte elevation/shadows voor duidelijke diepte;
- kamerbeelden helderder, maar met gecontroleerde overlays zodat tekst leesbaar blijft;
- paars blijft primair interactieaccent;
- groen/teal, amber en paars worden qua luminantie aangepast maar behouden dezelfde semantiek;
- hero's houden gradients/ambient depth;
- geen platte witte kaarten als light-mode fallback.

Dark en light moeten vanuit dezelfde componentboom en design-tokenlaag renderen.

## 13. Responsiviteit

- iPhone/PWA is de primaire maatstaf.
- Touch targets minimaal comfortabel mobiel formaat.
- Geen horizontale clipping bij kleine schermen.
- Tekst en statusinformatie blijven leesbaar boven kamerbeelden.
- Tablet/desktop mag de compositie ruimer verdelen, maar niet een andere functionele hiërarchie introduceren.

## 14. Implementatieregel

Deze layout geldt als de **canonieke visuele acceptatiereferentie**. Functionele implementatie mag intern modulair/refactored zijn, maar de zichtbare schermstructuur wordt niet ad-hoc gewijzigd tijdens development.

Als een wijziging noodzakelijk blijkt, wordt eerst deze visual specification aangepast en expliciet goedgekeurd.

Schaalbaar bouwen blijft verplicht: geen inline handler-overrides, dubbele state, cross-module DOM-hacks, duplicated dark/light markup of CSS-monkeypatches.
