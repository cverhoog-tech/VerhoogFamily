# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cleaning current truth: `FamilyApp-Schoonmaken-current-status.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`

## Current position — synced 2026-09-06

- [x] STEP 0 — Stable baseline.
- [x] STEP 1 — Authenticated session / startup ownership.
- [x] STEP 2 — HouseholdContext / UID identity / lifecycle.
- [x] STEP 2A — Platform-admin identity foundation.
- [x] STEP 2B — Person/UI identity modernization and Brand/PWA/icon scope.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance — accepted/frozen.
- [x] STEP 9 — Progression — accepted/frozen.
- [x] STEP 10 — Notifications — accepted/frozen.
- [x] STEP 11 — Party Quests — real-device accepted.
- [x] STEP 12 — Profile / presence / avatars — real-device accepted.
- [-] STEP 13 — Activity / Feed baseline is implemented and part of the rebuild branch; do not reopen without a concrete regression.
- [-] STEP 14 / Cleaning workstream — **FUNCTIONAL CLOSE-OUT CANDIDATE; role smoke pending, visual polish next**.
- [ ] Privacy-safe platform operations/admin dashboard follow-up.
- [ ] Firebase Rules/release-security hardening.
- [ ] Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate.
- [ ] Store distribution readiness.

## Action Inbox — COMPLETE / REAL-DEVICE ACCEPTED 2026-09-06

The Action Inbox is the app-wide central decision surface for actionable requests.

Architecture:
- `src/platform/inbox/` is read/projection/action-routing only.
- Presence comes from canonical Task / TaskSwap / PartyQuest / Cleaning state, never Notification delivery.
- Existing domain runtimes remain the only mutation authorities.
- No `/inboxRequests` truth and no second writer.
- `ActionInboxStore.openActionCount` is the single Inbox badge owner.

Accepted product split:
- ✉️ Inbox = requests that need a decision.
- 🔔 Meldingen = informational updates.

Coverage includes:
- Task help;
- Task swap;
- Party Quest invites;
- Cleaning help;
- Cleaning routine transfer;
- Cleaning counterproposals.

Validation:
- `scripts/test-action-inbox.js` green in the full contract suite.
- Household Rebuild Contracts green.
- Vercel READY.
- Real-device accepted preview: `https://verhoog-family-ks84yij7s-cverhoog-techs-projects.vercel.app`.
- Functional Action Inbox contract commit: `6fd4c0cefceca0e957800a71ca5614a983ec1ae3`.

## STEP 14 / Schoonmaken — FUNCTIONAL CLOSE-OUT CANDIDATE

Latest functional candidate before documentation-only commits:
`cabf639382be4f0bd5a8a2c540855b914dbedffa`

Validation:
- Household Rebuild Contracts: **SUCCESS**, run `34000853880`.
- Vercel: **SUCCESS**.
- Functional close-out regression contract added.
- Runtime reachability now guards 42 required Cleaning modules including the role policy.

### Complete functional areas
- [x] Rooms / routines / templates / ordering / safe lifecycle.
- [x] Week planning / approvals / rolling horizon / member display filter.
- [x] Task + Agenda projections and reverse sync.
- [x] Explicit execution exceptions and Cleaning help.
- [x] Tijd / Aantal / Beide preference.
- [x] Temporary availability / sick / busy week / vacation / planning pause.
- [x] Cadence-preserving pause/resume with no missed-work backlog.
- [x] Supplies / inventory / Weekvoorraad / explicit Shopping handoff.
- [x] Stable Cleaning metadata on new Shopping items.
- [x] Richer history from completion logs.
- [x] Collaboration notifications + daily reminder.
- [x] Shared household activity events for completed Cleaning work.
- [x] Conservative derived Task/Agenda/Shopping cleanup.
- [x] Household key safety.
- [x] Room/routine create retry idempotency.
- [x] Action Inbox routing for Cleaning requests.
- [x] Central Cleaning role/capability client policy + behavioral tests.

### Role/capability close-out

Existing roles are mapped without introducing a second account model:
- owner/admin → Beheerder;
- adult/member → Gezinslid;
- child/limited/restricted → Beperkt profiel.

Policy intent:
- Beheerder: full structural + household management.
- Gezinslid: planning, transfers, supplies, own availability and execution; no structural room/routine changes.
- Beperkt profiel: assigned execution, accept/decline/help and personal preference; no management initiation.

Implementation:
- `src/modules/cleaning/cleaningPermissions.js` owns policy only, never Cleaning data.
- Public mutation APIs and matching UI capabilities are guarded centrally.
- `scripts/test-cleaning-permissions.js` executes the role matrix with mocked real mutation APIs.
- Action Inbox eager-loading path loads permission policy before Cleaning runtimes.

### Remaining before functional acceptance
- [ ] Real-device owner/manager smoke: existing Cleaning management flows unchanged.
- [ ] Real-device adult/member smoke if available: structure hidden/blocked; planning/transfer/supplies/own availability still available.
- [ ] Limited/child smoke if available: assigned execution + accept/decline/help remain; management actions absent.
- [ ] Confirm Action Inbox and Task/Agenda reverse sync still behave normally.
- [ ] Only then mark STEP 14 functionally accepted.

### Next after acceptance — visual polish
- [ ] Definitive premium Cleaning visual spec, light + dark.
- [ ] Final hero/background assets.
- [ ] Premium hierarchy/cards/spacing/motion/microinteractions.
- [ ] Remaining 44×44 touch targets.
- [ ] Final room-planning/supplies presentation.
- [ ] Final loading/empty/error states.
- [ ] Optional advisory insights only after the stable visual baseline.

## Public-release security gate

The current Firebase Rules still give active household members broad write access under the generic `$sharedData` branch. The Cleaning role policy therefore provides intended product/client behavior, but server-side role enforcement is a separate release-security task.

Before public release:
- [ ] design/test role-aware Firebase Rules in a safe rules workflow;
- [ ] verify no cross-role bypass for Cleaning/shared-data mutations;
- [ ] deploy production rules only after explicit approval.

Production Firebase Rules are intentionally untouched in the current STEP 14 branch work.

## Validation cadence

Bundle low/medium-risk device smokes into meaningful acceptance sweeps. Keep security/auth/cross-household/finance/idempotency/release-blocking behavior explicit.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Google login post-auth handoff/startup follow-up remains open.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains deferred.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- `main` untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- Accepted domain authorities stay canonical.
- `CleaningOccurrence` remains Cleaning SOT.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Every meaningful update synchronizes current TODO, this tracker and update log.
