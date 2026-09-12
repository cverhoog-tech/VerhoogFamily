# Household Rebuild v2 — Progress Tracker

Last synced: 2026-09-11  
Working branch: `agent/household-rebuild-v2`  
Production/main baseline: `b7f233ebfe1fbb20ecdf426003f332528562ab0f`  
Accepted Cleaning-v2 rollback basis: `b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Read with `docs/FAMILYAPP-CURRENT-TODO.md` and `FamilyApp-Schoonmaken-current-status.md` for current execution truth.

## Completed rebuild milestones

- [x] STEP 0 — Stable baseline.
- [x] STEP 1 — Authenticated session/startup ownership.
- [x] STEP 2 — HouseholdContext / UID identity / lifecycle.
- [x] STEP 2A — Platform-admin identity foundation.
- [x] STEP 2B — Person/UI identity modernization foundation.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance.
- [x] STEP 9 — Progression.
- [x] STEP 10 — Notifications / push foundation.
- [x] STEP 11 — Party Quest lifecycle.
- [x] STEP 12 — Profile / presence / avatars.
- [x] STEP 13 — Household Activity / Feed.

## STEP 14 — Cleaning

### Historical pre-reset Cleaning

Heavy availability/approval/pause/exception/history/projector runtimes remain **historical reference only**. They caused serious real-device freezes and are not permission to reactivate those owners.

### Cleaning V2.0 — performance-first rebuild

- [x] Real-device accepted on iPhone at `b4511561f0885023e5ca6649a1eecd8f4a611d6a`.
- [x] Lazy module loading and teardown.
- [x] One household-scoped Cleaning repository.
- [x] CleaningOccurrence canonical execution state.
- [x] Rooms/routines/presets/supplies/inventory.
- [x] Week planning + member filter.
- [x] Lightweight own detail sheet.
- [x] Optimistic/coalesced checklists and completion logs.
- [x] Task/Calendar projections.
- [x] Roles/capabilities.
- [x] Legacy TaskDetailPopup / execution/projection cascade / MutationObserver stack inactive.

### Cleaning V2.1 — collaboration / handoff / help

Status: **codecandidate complete; single-device path appears good; multi-user verification deferred**.

Test checkpoint: `7e34cb60b78cf45664fdb82202e9673bb2ae9672`  
CI run `34534350216`: **SUCCESS**

- [x] Transfer concrete occurrence.
- [x] Recipient accept/decline.
- [x] Counterproposal person/date/time.
- [x] Third-person explicit opt-in; no silent assignment.
- [x] Ask/accept/decline/withdraw help.
- [x] Withdraw pending/counter-proposed transfer.
- [x] Action Inbox occurrence decisions and fresh-session on-demand hydration.
- [x] Collaboration state stays on CleaningOccurrence.
- [x] Help does not create multi-person assignment.
- [x] Accepted transfer updates existing Task/Calendar projections.
- [x] Idempotency / double-tap guard.
- [x] No standalone `Samenwerken` menu; controls live in existing turn detail sheet.
- [x] No extra long-lived Firebase listener / popup owner / observer / notification projector.
- [x] Full contract suite green.
- [x] Product-owner single-device observation: “lijkt te werken”.
- [ ] Multi-user account A/B/C verification — explicitly deferred until later.
- [ ] Only after explicit complete acceptance: record exact V2.1 accepted rollback SHA.

### Cleaning V2.2 — history / Activity / useful attention

Status: **codecandidate complete; automated contracts green; real-device verification pending**.

Functional/test checkpoint: `ffb0552bad734309e02361de87bde7a3e96a3464`  
CI run `34537327502`: **SUCCESS**

- [x] Pure `cleaningHistoryContract.js` over canonical completionLogs.
- [x] Lazy Cleaning-only `cleaningHistoryV22.js` companion.
- [x] Fourth `Historie` tab.
- [x] History grouped by room.
- [x] Routine history from stored completion checklists.
- [x] Last completion moment + household member.
- [x] 30-day room/routine activity counts.
- [x] Current-week count/minutes/people summary.
- [x] Current-user Today attention for own today/overdue work.
- [x] Newly observed completed logs can publish `cleaning.completed` to existing Household Activity.
- [x] Deterministic append-once Activity key.
- [x] Existing history baseline prevents historical feed flood.
- [x] REOPENED logs do not emit a new completed Activity event.
- [x] No second history database.
- [x] No second raw Firebase listener.
- [x] No MutationObserver or polling timer.
- [x] No NotificationStore/push projector.
- [x] Old history/activity/notification projector files remain disconnected.
- [x] Full repository contract suite green on the functional checkpoint.
- [ ] Real-device iPhone layout/performance/history/activity test.
- [ ] Only after explicit acceptance: record exact accepted V2.2 SHA as rollback candidate.
- [ ] Only after separate promotion permission: promote an exact accepted state to main.

### Product decision retained for Cleaning V2

Do not rebuild unless explicitly reversed:
- member availability engine;
- vacations;
- sickness/absence;
- busy-week/capacity model;
- automatic scheduling around personal availability;
- complex temporary pause/exception engine.

### Next

- [ ] V2.3 — incomplete occurrence choices, manual moment/person, projection consistency and hardening.
- [ ] V2.4 — final premium visual polish, light/dark and room assets without repaint-heavy effects.

## STEP 15 — Branding / PWA / Login & Auth

- [ ] Final premium FamilyApp logo and icon family.
- [ ] PWA icon + maskable + Apple Touch + favicon.
- [ ] New premium login screen.
- [ ] Preserve Google / Apple / normal login and registration.
- [ ] Explicit normal-account lifecycle tests.
- [ ] Apple action reachable from Home through the same auth authority.
- [ ] Verify manifest, colors, launch appearance, caching and sharp iPhone Home Screen icon.
- [ ] Re-test historical Google post-auth freeze only if currently reproducible.

## Later/open platform work

- [ ] i18n: NL / EN / TR / DE / FR with central architecture and saved per-user choice.
- [ ] Party Quest toast: real-device verification of existing candidate before new code.
- [ ] Release/security: server-side role rules, Apple provider/release setup, App Store/native/PWA decisions.

## Safety rails

- Main is read-only until explicit post-acceptance promotion permission.
- Production Firebase Rules are read-only without explicit permission.
- Fallback/lock branches are read-only.
- Performance on real iPhone is a hard acceptance criterion.
