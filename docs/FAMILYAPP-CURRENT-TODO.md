# FamilyApp — Current TODO / Execution State

Last updated: 2026-09-11  
Branch: `agent/household-rebuild-v2`  
Production/main baseline: `b7f233ebfe1fbb20ecdf426003f332528562ab0f`  
Accepted Cleaning-v2 rollback basis: `b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Read together with:
- `FamilyApp-TODO-updated.txt`
- `docs/FAMILYAPP-FIX-LIST.md`
- `docs/household-rebuild-v2-progress.md`
- `docs/FAMILYAPP-VISUAL-DESIGN-SYSTEM.md`
- `FamilyApp-Schoonmaken-current-status.md`
- `FamilyApp-Schoonmaken-milestone-log.md`
- `FamilyApp-Schoonmaken-module-architectuur.md`

## Hard branch rule

`main` stays read-only until the product owner real-device accepts an exact milestone checkpoint and separately asks to promote it. Production Firebase Rules and fallback/lock branches are also read-only without explicit permission.

## Fixed product/design boundary

Shared FamilyApp visual direction: **Calm Premium Home**.

Cleaning and Tasks will use the same visual family, but not the same product model:
- Cleaning = room → routine → planning → execution → supplies → history;
- Tasks = general task execution;
- concrete Cleaning occurrences may project to Tasks/Agenda, but Cleaning remains the authority for the routine/occurrence;
- Cleaning must not become a second Tasks module.

## Deferred gate — Cleaning V2.1 collaboration

Status: **codecandidate complete; single-device path appears good; multi-user verification deferred by product owner**.

Last fully tested V2.1 checkpoint:
`7e34cb60b78cf45664fdb82202e9673bb2ae9672`

GitHub Actions run `34534350216`: **SUCCESS**.

Retained:
- occurrence transfer / accept / decline / withdraw;
- counter proposal for person/date/time;
- explicit third-person consent;
- help request / accept / decline / withdraw;
- no implicit multi-person assignment;
- contextual collaboration controls inside existing turn detail sheet;
- no standalone `Samenwerken` menu below Kamers;
- accepted transfer updates existing Task/Agenda projections;
- idempotency/double-tap guards;
- no extra long-lived Firebase listener, popup owner, MutationObserver or notification projector.

V2.1 remains **NOT fully real-device/multi-user accepted**. Test later with two/three accounts before final acceptance/promotion.

## Cleaning V2.2 — history / Activity / useful attention

Status: **implementation candidate complete; contract suite green; functional real-device verification pending**.

Functional runtime checkpoint:
`ffb0552bad734309e02361de87bde7a3e96a3464`

Last V2.2 docs/test checkpoint before visual rework:
`28fd9fb6832ef369ee084723b4a71736fb4e662d`

GitHub Actions `Household Rebuild Contract Tests` run `34537817885`: **SUCCESS**.

Built:
- pure read model over canonical completionLogs;
- lightweight History companion;
- fourth `Historie` tab;
- room/routine history;
- current-week summary;
- current-assignee today/overdue attention;
- best-effort `cleaning.completed` Activity projection with deterministic dedupe;
- no second history DB/raw Firebase listener/MutationObserver/polling/notification projector/popup owner.

The V2.2 functional gate remains open. Turn/Supplies visual verification now uses the V2.2.1 candidate below.

## CURRENT GATE — Cleaning V2.2.1 Calm Premium detail visual rework

Status: **implementation complete; contract/CI and real-device iPhone verification pending**.

Implementation checkpoint before milestone documentation:
`c32eb2dac2be9d40912cdb4c6f68c7566e935e06`

Why this was inserted before V2.3:
- product owner re-confirmed the exact Cleaning turn and Supplies visual reference on 2026-09-11;
- building V2.3 first would add new actions into a temporary detail hierarchy and create avoidable rework;
- the detail visual shell is therefore fixed first, while accepted canonical state/writers remain untouched.

New visual implementation:
- `src/modules/cleaning/cleaningDetailVisualV221.js`;
- `src/styles/cleaning-detail-v221.css`;
- `scripts/test-cleaning-detail-visual-v221.js`;
- lazy import through existing `cleaningPremiumFeedback.js`.

### Fixed turn hierarchy

1. native-feeling header;
2. strong room hero + semantic status;
3. prominent cleaning title;
4. day / moment / parts / estimate;
5. assignee card;
6. routine progress;
7. checklist;
8. Start/Continue Cleaning;
9. Edit;
10. View turn + Supplies;
11. collaboration remains contextual in the same existing sheet.

### Fixed supplies hierarchy

1. room-context header;
2. `Voor deze beurt / Alle kameritems` segmented control;
3. turn/room intro;
4. 76px supply rows with 46px coloured minimal line-icon tiles;
5. text + indicator for `Op voorraad / Bijna op / Ontbreekt`;
6. `Ontbreekt iets?` callout;
7. room inventory summary;
8. room-item management when capability allows;
9. `Bekijk alle kameritems / Boodschappen` utility pair;
10. LOW/OUT handoff goes through canonical `ShoppingListStore` with dedupe.

### Safety/performance

- primary `cleaningScreen.js` stays v2.0.0 and remains execution/write authority;
- existing `#cleaning-v2-sheet` stays the sole popup owner;
- no additional raw Firebase listener;
- no visual-layer Firebase writer;
- no MutationObserver;
- no document-wide click interception;
- no visual polling/timer loop;
- no backdrop-filter or continuous animation in the new CSS;
- production Firebase Rules unchanged.

### Real-device checks required

1. Light and dark mode turn sheet matches the new hierarchy and feels calm/premium.
2. Hero/header/spacing do not jump during open/close.
3. Checklist taps remain instant; progress count/bar/percentage follow immediately.
4. Start/Continue and complete-all still work through the existing writer.
5. Edit still routes into existing management flow.
6. Collaboration remains in the same turn sheet and does not dominate it.
7. Supplies segmented switch is smooth and correct.
8. Supply icon style/size/colour and stock indicators match the reference direction.
9. Inventory status changes and room-item creation work.
10. LOW/OUT → Boodschappen does not create duplicates.
11. Repeated open/close/scope switching does not freeze or jank.
12. Vandaag / Kamers / Weekplan / Historie still work after the detail rework.

Do not mark V2.2.1 REAL-DEVICE ACCEPTED until the product owner explicitly confirms the exact candidate checkpoint.

## NEXT AFTER V2.2.1 TEST

### Cleaning V2.3 — Function gaps + hardening
- incomplete occurrence: move / later this week / skip;
- manual assignee/date/time change;
- projection consistency hardening;
- household key safety;
- idempotency/double submit;
- listener lifecycle/account-household switch;
- soft-delete cases;
- cache/versioning;
- extra contracts.

### Cleaning V2.4 — broad premium consistency pass
- harmonize remaining Cleaning cards/tabs/states;
- full light/dark consistency;
- refine room atlases/assets;
- lightweight iOS-feeling microinteractions;
- prepare the same shared visual primitives for later Tasks harmonisation;
- no heavy glass/blur/repaint regressions.

## Explicitly NOT in Cleaning roadmap

Do not rebuild availability per member, vacations, sickness/absence, busy-week capacity logic, automatic availability scheduling, or complex pause/exception engines unless the product owner explicitly reverses that decision.

## STEP 15 after Cleaning

Branding / PWA / Login & Auth:
- final FamilyApp logo/icon family;
- PWA/maskable/Apple Touch/favicon assets;
- premium new login screen;
- Google, Apple and normal account login/registration preserved;
- normal-account onboarding/session lifecycle explicitly tested;
- Apple action also reachable from Home via the same auth authority;
- manifest/theme/background/caching/Home Screen icon real-device verification;
- only reopen Google post-auth freeze if currently reproducible.

## Other genuinely open items

- Internationalisation: NL/EN/TR/DE/FR with central i18n and saved user choice.
- Party Quest toast: verify current real-device candidate before writing new code.
- Release/security later: server-side role rules, Apple provider/release config, App Store/native/PWA decisions. No production Rules change without permission.

## Historical status rule

Historical code can remain for rollback/product reference but must never be treated as permission to reactivate the pre-performance-reset Cleaning runtime.
