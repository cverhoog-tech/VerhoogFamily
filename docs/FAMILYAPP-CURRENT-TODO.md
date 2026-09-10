# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`
Cleaning current status: `FamilyApp-Schoonmaken-current-status.md`
Cleaning milestone log: `FamilyApp-Schoonmaken-milestone-log.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 14 — Schoonmaken is the active roadmap phase and is now a FUNCTIONAL CLOSE-OUT CANDIDATE.**

The earlier STEP 13 Activity / Feed work is already part of the rebuild branch baseline. Do not reopen it unless a concrete regression requires that.

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## Action Inbox — REAL-DEVICE ACCEPTED (06-09-2026)

The cross-module Action Inbox is accepted on iPhone as the central decision surface:

- ✉️ Inbox = open requests requiring a decision.
- 🔔 Meldingen = informational updates.
- Presence in Inbox is derived from canonical domain state, never from NotificationStore delivery.
- Task help, Task swap, Party Quest invites, Cleaning help, Cleaning routine transfer and Cleaning counterproposals route to the existing domain runtimes.
- `ActionInboxStore` is the single owner of `openActionCount`.
- No `/inboxRequests` canonical database and no second domain writer were introduced.
- Functional Action Inbox contract commit: `6fd4c0cefceca0e957800a71ca5614a983ec1ae3`.
- Real-device accepted preview: `https://verhoog-family-ks84yij7s-cverhoog-techs-projects.vercel.app`.
- Household Rebuild Contracts and Vercel were green.

## STEP 14 — Cleaning functional close-out candidate

Latest functional candidate before documentation-only commits:
`cabf639382be4f0bd5a8a2c540855b914dbedffa`

CI for this candidate:
- Household Rebuild Contracts: **SUCCESS** — run `34000853880`.
- Vercel: **SUCCESS**.
- `main`: untouched.

### Functional scope now implemented

- [x] Rooms + routines CRUD, templates, ordering and safe soft-delete.
- [x] Weekplanner, personal approval, rolling horizon and member display filter.
- [x] Task + Agenda projections and controlled reverse sync to CleaningOccurrence.
- [x] Explicit incomplete-work flow: later this week, next occurrence, skip, ask for help.
- [x] Cleaning help request accept/decline routed through Action Inbox and existing Cleaning runtime.
- [x] Personal display preference: Tijd / Aantal / Beide.
- [x] Temporary availability: sick, temporarily unavailable, busy week, vacation and planning pause without backlog.
- [x] Richer room/routine history from canonical completionLogs.
- [x] Bundled Cleaning collaboration notifications + daily reminder.
- [x] Supplies / inventory / Weekvoorraad / explicit Shopping handoff.
- [x] New Cleaning Shopping items preserve stable Cleaning IDs (`cleaningSupplyId`, occurrence/room/routine IDs).
- [x] Conservative lifecycle cleanup for open derived Task/Agenda/Shopping projections while completed/manual history stays protected.
- [x] Shared household activity projection for completed Cleaning work.
- [x] Household-key safety and create-retry idempotency hardening.
- [x] Runtime reachability contract now covers the full Cleaning runtime including role policy.
- [x] Central client role/capability policy: Beheerder / Gezinslid / Beperkt profiel.

### Role/capability product contract

Existing household roles are mapped without a new account model:

- `owner` / `admin` → **Beheerder**.
- `adult` / `member` → **Gezinslid**.
- `child` / `limited` / `restricted` → **Beperkt profiel**.

Current Cleaning behavior:

- Beheerder: full structural rooms/routines, household planning, assignments, household availability, supplies and execution.
- Gezinslid: may plan, initiate routine transfers/counterproposals, manage Cleaning supplies, manage own availability, execute work and respond to requests; structural room/routine changes remain manager-only.
- Beperkt profiel: assigned work execution, request responses/help and personal display preference; no structural, plan-generation, supply or availability initiation.

`scripts/test-cleaning-permissions.js` executes this matrix as behavior, not only string assertions.

### Release-security boundary — intentionally not changed in this milestone

`database.rules.json` still grants active household members broad write access under the generic household `$sharedData` boundary. The new client policy provides the intended product behavior, but **true server-side role enforcement requires a deliberate Firebase Rules migration before public release**.

That migration is a separate release-security gate because production Firebase Rules must not be changed/deployed from this branch without explicit approval.

## Remaining before STEP 14 functional acceptance

- [ ] Real-device smoke on the new role/capability layer.
- [ ] Confirm existing owner/manager Cleaning flows did not regress.
- [ ] Preferably check one adult/member account: structural controls blocked/hidden while planning/transfer/supplies/own availability still work.
- [ ] If a child/limited account is available, check execution + accept/decline/help remain available while management actions are absent.
- [ ] Mark the close-out checkpoint accepted only after explicit user confirmation.

## After functional acceptance

### STEP 14 visual/polish phase
- [ ] Apply definitive premium Cleaning visual specification in light and dark mode.
- [ ] Final hierarchy, hero/background assets, spacing, motion/microinteractions and 44×44 touch targets.
- [ ] Final per-room scheduled-work presentation and supplies affordance.
- [ ] Final empty/loading/error states.

### Optional advisory scope
- [ ] Data-driven frequency/planning suggestions only if they remain advisory and do not become a second planning authority.
- [ ] Optional Cleaning assistant insights only after visual/function baseline is stable.

### Public-release security gate
- [ ] Design/test Firebase Rules role enforcement for Cleaning/shared household writes in a safe non-production rules workflow.
- [ ] Deploy production rules only after explicit approval and regression testing.

## Standing guardrails

- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- `main` stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- `CleaningOccurrence` remains the only canonical source of truth for a concrete Cleaning occurrence.
- Tasks and Agenda remain derived projections.
- Action Inbox remains a read/projection/action-routing layer and never becomes request truth.
- Shopping add and stock replenishment remain explicit user actions.
- Pause/availability must never create a backlog of missed occurrences.
- Realtime subscriptions require exact cleanup and stale HouseholdContext protection.
- New real-device checkpoints require green relevant CI and a unique Vercel preview.
