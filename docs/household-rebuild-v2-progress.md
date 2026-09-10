# Household Rebuild v2 — Progress Tracker

Last synced: 2026-09-10  
Working branch: `agent/household-rebuild-v2`  
Production/main baseline: `b7f233ebfe1fbb20ecdf426003f332528562ab0f`  
Accepted Cleaning-v2 rollback basis: `b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Read with `docs/FAMILYAPP-CURRENT-TODO.md` and `FamilyApp-Schoonmaken-current-status.md` for current execution truth. Historical code/documents remain reference only when they conflict with the current performance-first roadmap.

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

The old history contains a much larger Cleaning runtime with availability, approval, pause/exception engines, heavy experience layers, projection/reconcile runtimes and extra notification logic. That state is **historical reference only** because it caused serious real-device freezes.

### Cleaning V2.0 — performance-first rebuild

- [x] Real-device accepted on iPhone at `b4511561f0885023e5ca6649a1eecd8f4a611d6a`.
- [x] Lazy module loading and teardown when leaving Cleaning.
- [x] Household-scoped repository / CleaningOccurrence canonical state.
- [x] Rooms CRUD; routines CRUD + presets; supplies/inventory.
- [x] Week planning + member filter.
- [x] Lightweight own detail sheet.
- [x] Optimistic/coalesced checklists and completion logs.
- [x] Task/Calendar projections.
- [x] Roles/capabilities.
- [x] No active legacy TaskDetailPopup / CleaningExecutionWriteRuntime / CleaningProjectionService / MutationObserver stack.

### Cleaning V2.1 — collaboration / handoff / help

Current status: **implementation candidate complete; automated acceptance green; real-device acceptance pending**.

Latest functional/test checkpoint:
`7e34cb60b78cf45664fdb82202e9673bb2ae9672`

- [x] Transfer concrete occurrence to another active member.
- [x] Recipient accept/decline.
- [x] Counterproposal for person/date/time.
- [x] Third-person counter remains explicit opt-in; no silent assignment.
- [x] Ask for help / accept / decline / withdraw.
- [x] Withdraw pending/counter-proposed transfer.
- [x] Action Inbox decisions derived from occurrence state and writer-free.
- [x] Transfer/help state stays on CleaningOccurrence; no second request store.
- [x] Help does not create multi-person assignment.
- [x] Accepted transfer updates existing Task/Calendar projections without creating new records.
- [x] Idempotent duplicate request behavior and UI double-tap guard.
- [x] No extra long-lived Cleaning Firebase listener.
- [x] No Cleaning startup path added.
- [x] No new notification projector/reminder loop.
- [x] No week-plan approval engine reintroduced.
- [x] **Standalone `Samenwerken` menu removed.**
- [x] `Overdragen`, `Hulp vragen`, request status and `Intrekken` live inside the existing concrete turn detail sheet.
- [x] Incoming decisions remain in Action Inbox; counter routes back to the concrete turn.
- [x] Collaboration lazy-import cache key bumped to `?v=2` for fresh PWA/iPhone code.
- [x] Contracts guard that collaboration cannot return as a standalone menu and cannot add forbidden runtime patterns.
- [x] Full repository `scripts/test-*.js` suite green on `7e34cb60…`.
- [x] GitHub Actions run `34534350216` successful on `7e34cb60…`.
- [ ] Product-owner real-device iPhone acceptance.
- [ ] Only after acceptance: record exact accepted SHA as new rollback basis.
- [ ] Only after separate explicit promotion permission: promote exact accepted state to main.

### Product decision retained for Cleaning V2

Never rebuild unless explicitly reversed:
- member availability engine;
- vacations;
- sickness/absence;
- busy-week/capacity model;
- automatic scheduling around personal availability;
- complex temporary pause/exception engine.

### Planned after V2.1 acceptance

- [ ] V2.2 — visible room/routine history, completion activity, useful reminders only.
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
- Performance on real iPhone is an acceptance criterion, not optional polish.
