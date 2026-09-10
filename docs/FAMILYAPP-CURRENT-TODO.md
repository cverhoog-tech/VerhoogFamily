# FamilyApp — Current TODO / Execution State

Last updated: 2026-09-10
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
- `FamilyApp-Schoonmaken-visual-spec.md`

## Hard branch rule

`main` must not change until the product owner has real-device accepted the milestone and explicitly asks to promote that exact accepted state. Production Firebase Rules and fallback branches are also out of scope without explicit permission.

## CURRENT GATE — Cleaning V2.1 collaboration

Status: **implementation complete, repository contract suite green, Vercel green, real-device acceptance pending**.

Implementation checkpoint before documentation updates:
`a9fa6afd7781898fdadf16c10ca50f7a007eaca8`

Built in this slice:
- transfer a concrete CleaningOccurrence to another active household member;
- recipient accept/decline in Action Inbox;
- counterproposal for assignee/date/time;
- third-person counterproposal becomes a new explicit pending request rather than silent reassignment;
- request help;
- recipient accept/decline help in Action Inbox;
- withdraw pending help request;
- withdraw pending/counter-proposed transfer request;
- help acceptance does not create multi-person assignment;
- transfer acceptance updates the same canonical occurrence and bounded existing Task/Agenda projections;
- duplicate-tap guard and idempotent same-request behavior;
- no second request database;
- no additional Cleaning Firebase listener;
- no additional Cleaning startup work;
- no notification projector/reminder loop added in V2.1;
- no week-plan approval flow reintroduced.

### Real-device tests required before acceptance

1. Open Cleaning repeatedly and confirm no freeze/jank regression.
2. From an assigned occurrence, request transfer to another household member.
3. On recipient account/device, accept; confirm the same occurrence now belongs to recipient.
4. Confirm Task and Agenda projection show the same new assignee.
5. Repeat transfer flow and decline; confirm original assignee remains unchanged.
6. Create a counterproposal with another person/date/time; accept it.
7. When the counter proposes a third person, verify that third person still receives an explicit decision before assignment changes.
8. Withdraw a pending transfer.
9. Ask for help; accept and decline variants.
10. Withdraw a pending help request.
11. Tap request/accept controls rapidly/repeatedly; confirm no duplicate occurrence/task/calendar records.
12. Leave Cleaning and use other modules; confirm no background Cleaning slowdown.

Do not mark this milestone REAL-DEVICE ACCEPTED until the product owner explicitly says so.

## NEXT ONLY AFTER V2.1 ACCEPTANCE

### Cleaning V2.2 — History / Activity / reminders
- room history;
- routine history;
- visible completion logs;
- who completed what and when;
- relevant Cleaning events into existing household activity feed;
- only useful reminders;
- optional subtle shared progress, no competitive leaderboard.

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

Do not rebuild availability per member, vacations, sickness/absence, busy-week capacity logic, automatic availability scheduling, or complex pause/exception engines.

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

Older documents/tests can retain old availability/approval/pause implementations as historical rollback/reference material. They do not make those features active backlog and must never be used to reactivate the pre-performance-reset Cleaning runtime.
