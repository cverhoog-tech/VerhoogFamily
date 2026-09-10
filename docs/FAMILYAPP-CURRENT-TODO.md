# FamilyApp — Current TODO / Execution State

Last updated: 2026-09-11  
Branch: `agent/household-rebuild-v2`  
Production/main baseline: `b7f233ebfe1fbb20ecdf426003f332528562ab0f`  
Accepted Cleaning-v2 rollback basis: `b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Read together with:
- `FamilyApp-TODO-updated.txt`
- `docs/FAMILYAPP-FIX-LIST.md`
- `docs/household-rebuild-v2-progress.md`
- `FamilyApp-Schoonmaken-current-status.md`
- `FamilyApp-Schoonmaken-milestone-log.md`
- `FamilyApp-Schoonmaken-module-architectuur.md`

## Hard branch rule

`main` stays read-only until the product owner real-device accepts an exact milestone checkpoint and separately asks to promote it. Production Firebase Rules and fallback/lock branches are also read-only without explicit permission.

## Deferred gate — Cleaning V2.1 collaboration

Status: **codecandidate complete; single-device path appears good; multi-user verification deferred by product owner**.

Last fully tested V2.1 checkpoint:
`7e34cb60b78cf45664fdb82202e9673bb2ae9672`

GitHub Actions run `34534350216`: **SUCCESS**.

Built and retained:
- occurrence transfer / accept / decline / withdraw;
- counter proposal for person/date/time;
- explicit third-person consent;
- help request / accept / decline / withdraw;
- no implicit multi-person assignment;
- contextual collaboration controls inside existing turn detail sheet;
- no standalone `Samenwerken` menu below Kamers;
- Action Inbox fresh-session hydration on demand;
- accepted transfer updates existing Task/Agenda projections;
- idempotency/double-tap guards;
- no extra long-lived Firebase listener, popup owner, MutationObserver or notification projector.

The product owner reported on 2026-09-11 that the available-device flow appears to work, but multi-user testing was not possible at that moment. Therefore V2.1 remains **NOT fully real-device/multi-user accepted**. Test later with two/three accounts before final acceptance/promotion.

## CURRENT GATE — Cleaning V2.2 history / Activity / useful attention

Status: **implementation candidate complete; full contract suite green; real-device iPhone verification pending**.

Functional/test checkpoint:
`ffb0552bad734309e02361de87bde7a3e96a3464`

GitHub Actions `Household Rebuild Contract Tests` run `34537327502`: **SUCCESS**.

Built:
- pure `cleaningHistoryContract.js` read model over canonical `completionLogs`;
- lightweight `cleaningHistoryV22.js` companion, lazy behind Cleaning navigation;
- fourth `Historie` tab next to Vandaag / Kamers / Weekplan;
- completion history grouped by room;
- routine history from stored completion checklists;
- last execution time and member;
- 30-day activity counts per room/routine;
- current-week count/minutes/people summary;
- compact current-assignee attention on Vandaag for own today/overdue work;
- best-effort projection of newly observed completed logs to existing Household Activity as `cleaning.completed`;
- deterministic Activity occurrence key for append-once dedupe;
- first existing history snapshot is baseline, preventing historical feed flood;
- REOPENED logs do not emit a new completed Activity event.

Performance/safety:
- primary accepted `cleaningScreen.js` remains unchanged;
- same CleaningHouseholdRepository snapshot/subscription;
- no second raw Firebase listener;
- no second history database;
- no MutationObserver;
- no polling/setInterval;
- no notification/push projector;
- no second popup owner;
- old `cleaningHistoryExperience.js`, `cleaningActivityProjector.js` and `cleaningNotificationProjector.js` remain disconnected historical reference.

### Real-device tests required for V2.2

1. Four Cleaning tabs fit cleanly on one row on iPhone.
2. Vandaag remains responsive; attention row only appears for current user's today/overdue work.
3. Historie opens/closes without jank.
4. Existing completionLogs display by room.
5. Expanded room shows routine, last moment and household member.
6. Complete a new turn; Historie updates from canonical completionLogs.
7. Household Activity gets at most one matching `cleaning.completed` event.
8. Reopen a completed turn; no duplicate completed Activity event.
9. Repeated tab switching creates no duplicate Historie tab/sections.
10. Leave Cleaning and use other modules; no background Cleaning performance regression.

Do not mark V2.2 REAL-DEVICE ACCEPTED until the product owner explicitly confirms it.

## NEXT AFTER V2.2 TEST

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

### Cleaning V2.4 — final premium polish
- light/dark visual finish;
- room atlas/assets;
- clear hierarchy;
- lightweight iOS-feeling microinteractions;
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
