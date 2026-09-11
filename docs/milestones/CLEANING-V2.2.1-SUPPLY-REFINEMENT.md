# Cleaning V2.2.1 — Supply visual refinement

Datum: **11-09-2026**  
Parent milestone: **Cleaning V2.2.1 — Calm Premium detail visual rework**  
Status: **CODECANDIDATE GEREED — REAL-DEVICE HERTEST OPEN**

## Aanleiding

De product owner heeft de V2.2.1 Benodigdheden-flow op echte iPhone getest en bevestigd dat de **richting, stijl en werking goed voelen**. Tijdens die test viel op dat de statuscirkels rechts bij Benodigdheden / Alle kameritems op iOS optisch ovaal konden worden. Ook is gevraagd de itemiconen dichter bij de verfijnde minimalistische line-iconstijl van de vastgezette referentie te brengen.

Dit is een **gerichte visual refinement binnen V2.2.1**, geen nieuwe functionele Cleaning-milestone en geen wijziging van canonical state.

## Runtimecandidate

Exacte groene runtimecandidate: `5a9da20e8f0f2ed872d114b8257638980e13ac0b`  
CI: `Household Rebuild Contract Tests` run `34577437564` — **SUCCESS**  
Vercel deployment: `dpl_44hpdgL2VabnMhDjBpGxwdjpPvbr` — **READY**  
Immutable preview: `https://verhoog-family-5lkdh64c5-cverhoog-techs-projects.vercel.app`

## Wijzigingen

- supply status indicators hard 1:1 gemaakt voor Safari/PWA met vaste inline/block-size, min/max-size, `aspect-ratio: 1 / 1`, `appearance:none`, `box-sizing:border-box` en ronde clipping;
- groene check, amber waarschuwing en rode foutstatus gebruiken nu consistente vector/mask-symbolen in plaats van browser-font glyph rendering;
- icon tiles verfijnd naar 48px premium pastel tiles met rustigere 1.75px line treatment;
- categorie-/objectkleur blijft gescheiden van semantische voorraadstatus;
- dezelfde refinement geldt voor `Voor deze beurt` en `Alle kameritems` omdat beide dezelfde `FASupplyRow` presentation primitive gebruiken;
- mobiele <=390px variant behoudt dezelfde 1:1 cirkelgarantie op 36px.

## Architectuur / safety

Ongewijzigd:
- `cleaningScreen.js` blijft de primaire Cleaning write authority;
- geen tweede Firebase listener;
- geen nieuwe popup owner;
- geen MutationObserver;
- geen polling/timers;
- geen nieuwe inventory/shopping writer;
- production Firebase Rules niet gewijzigd;
- `main` niet wijzigen zonder expliciete product-owner toestemming.

## CI-notitie

De eerste activation-run `34577380382` op `8c24c38976d1ca2ffc1a7b473c3f3cb05686aa86` was rood doordat de premium shim-marker tijdelijk `2.2.1-r1` heette terwijl bestaande contracttests terecht de parent milestoneversie `2.2.1` bewaken. Dit was testmetadata, geen runtimefout. De marker is teruggezet naar `2.2.1`; de refinement blijft als aparte lazy presentation companion geladen. Run `34577437564` op `5a9da20e8f0f2ed872d114b8257638980e13ac0b` is volledig groen.

## Real-device her-test

Nog te bevestigen op iPhone:
1. groene/amber/rode statusindicatoren zijn visueel perfect rond;
2. cirkels blijven rond in beide segmented states;
3. icon tiles voelen verfijnder en consistent aan;
4. status wijzigen blijft werken waar editrechten bestaan;
5. light/dark blijven leesbaar;
6. geen nieuwe jank bij wisselen tussen beide supply views.

Niet als REAL-DEVICE GEACCEPTEERD markeren totdat de product owner deze refinement expliciet bevestigt.
