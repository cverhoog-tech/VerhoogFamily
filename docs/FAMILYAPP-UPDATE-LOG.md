# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. Read this together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md`, `docs/household-rebuild-v2-roadmap.md` and `docs/FAMILYAPP-FIX-LIST.md` before changing the rebuild branch.

Historical entries through STEP 11.1 are preserved verbatim in `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.

## Logging rule
1. Record every meaningful product/code checkpoint.
2. Synchronize the central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never put service-account private keys or push-device tokens in chat, client code or repository files.

Newest entries belong at the top.

---

## 2026-08-27 — Party Quest UX Tests 1/2 PASS; explicit “Later beslissen” follow-up implemented

- Product owner confirmed Party Quest UX Test 1 **PASS** on a real device: from an existing Party Quest, **＋ Nieuwe Party Quest** opens correctly without ending the current one and the chooser shows meaningful Arcana/RPG icons rather than one repeated generic sparkle.
- Product owner confirmed Party Quest UX Test 2 **PASS** on a real device: **Nieuwe quest maken** opens the existing canonical premium task creator, and after save the Party Quest chooser returns automatically with the newly created task preselected.
- During the invite flow, product owner identified a clarity gap: a recipient could tap outside the invite modal to defer a decision, but there was no explicit visible action for users who do not want to accept or decline yet.
- Product owner approved a presentation-only follow-up. `partyQuestInvites.js` is now v7.1.0 and the served runtime cache key is `partyQuestInvites.js?v=8`.
- Single incoming Party Quest invitations now expose three explicit choices: **Weigeren**, **Accepteren**, and neutral **Later beslissen**.
- Multiple incoming invitations use the same neutral **Later beslissen** affordance for the current invite batch.
- **Later beslissen** performs no PartyQuestService mutation and does not write a new Firebase status. The invite remains canonical `pending`.
- Deferral is runtime-session presentation state only (`deferredInviteIds`), deliberately not localStorage/Firebase persistence and not a new invite authority.
- Deferral is keyed by Party Quest invite occurrence/version (`inviteOccurrenceId`/`inviteVersion` fallback), so the same pending occurrence does not auto-open repeatedly in the current runtime session while a new/reinvite occurrence may prompt again.
- Manual access remains explicit: tapping the Party Quest tile still reopens all current pending invitations, including a deferred one.
- Added/extended `scripts/test-party-quest-ux-patch.js` to enforce the explicit button, session-only occurrence-scoped defer state, manual reopen path, no fake `respond(q,'pending')`, architecture boundaries and unchanged frozen notification/reward runtime keys.
- Updated the Party Quest service loader contract to expect the new invite facade runtime key.
- Full `Household Rebuild Contract Tests` run `33052149328`: **SUCCESS**. Logs explicitly report `party quest UX patch: PASS`, `party quest STEP 11.4 targeted + household help: PASS`, `party quest STEP 11.3 leave + ActiveView lifecycle: PASS`, and all frozen notification contracts remain green.
- Follow-up code/contract checkpoint: `0ef7274feea7ddadc86919843bf0a24891214e33`.
- Vercel Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF`: **READY**, branch `agent/household-rebuild-v2`, `target: null`.
- Real-device **Later beslissen** smoke is still pending and is the next UX test action.
- Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328`.
- STEP 11.5 completion/reward settlement and STEP 11.6 notification-event extensions were not started.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — Party Quest UX patch implemented; STEP 11.4 Test 1 device PASS

- Product owner reported STEP 11.4 targeted-help Test 1 **PASS** on a real device: the maker of an active Party Quest could send a help request to one eligible household member and the action changed to **Hulpvraag beheren**.
- This is recorded as a partial STEP 11.4 device PASS only. Recipient accept/decline and household-broadcast follow-up actions remain pending and STEP 11.4 is not marked fully device-accepted yet.
- Product owner then identified three Party Quest UX gaps and explicitly approved **GO Party Quest UX patch** before STEP 11.5:
  - a pending/active Party Quest should not block starting an additional Party Quest;
  - the Party Quest chooser should allow creating a new ordinary quest/task directly;
  - the generic sparkle task icons should be replaced with meaningful Arcana/RPG icons in the visual language of the Person/Tasks UI.
- Upgraded `src/modules/tasks/partyQuestInvites.js` to v7.0.0 presentation/facade behavior while preserving the frozen-compatible `getById`, `respond` and `revokeInvite` methods used by `NotificationActions`.
- Party Quest status UI now exposes **＋ Nieuwe Party Quest**, so an existing pending/active Party Quest no longer traps the user in only close/retract/end actions.
- Upgraded `src/modules/tasks/partyQuestActiveView.js` to v7.0.0 and added the same **＋ Nieuwe Party Quest** action to the active-quest overlay, which previously intercepted the shared Party Quest tile before the invite facade could offer a new start.
- Added **Nieuwe quest maken** to **Start een Party Quest**. It delegates to the existing premium `TaskDetailPopup.openCreate()` flow; no second task form, task repository or task authority was introduced.
- New-task return uses an explicit HouseholdContext-scoped handoff: it snapshots existing task IDs, waits for canonical `familyapp:tasks-updated`, verifies the same UID/household/revision, finds the newly created self-owned open task and reopens the Party Quest chooser with that task preselected.
- The handoff is cleared on cancel/background close, stale identity or timeout, preventing a later unrelated task update from reopening Party Quest under the wrong context.
- Replaced the chooser's generic `✦` placeholder with the existing canonical `TaskCategoryIcons.detect()` + `TaskCategoryIcons.icon()` family. Existing semantic categories such as pickup/dropoff, groceries, laundry, cleaning, kitchen, pantry, travel, admin, family and garden now produce meaningful Arcana/RPG glyphs; unknown tasks use the quest fallback.
- Active Party Quest cards use the same icon family for visual consistency.
- Runtime now serves `partyQuestInvites.js?v=7` and `partyQuestActiveView.js?v=7`.
- Added `scripts/test-party-quest-ux-patch.js` covering syntax, additional-Party-Quest access, canonical task-create handoff, HouseholdContext guards, Arcana icon usage, architecture boundaries and frozen-layer/cache-key invariants.
- Full `Household Rebuild Contract Tests` run `33049748789`: **SUCCESS**. Logs explicitly report `party quest UX patch: PASS`, while STEP 11.3, STEP 11.4 and all frozen notification contracts remain green.
- Code/contract checkpoint before documentation sync: `1c5b543926055ab647773b8182fa63322f83878e`.
- Vercel Preview `dpl_EjBMPpzoLdKThex7nGkNbLJhjv81`: **READY**, branch `agent/household-rebuild-v2`, `target: null`. Stable branch alias remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328`.
- STEP 11.5 completion/reward settlement and STEP 11.6 notification-event extensions were **not** started.
- STEP 11.3 participant-leave smoke and the separate Party Quest toast visual test remain pending/deferred as previously recorded.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — STEP 11.4 targeted + household Party Quest help implemented

- Product owner explicitly approved **GO 11.4 only**. STEP 11.5 completion/reward work and STEP 11.6 notification-event extensions were not started.
- Upgraded `src/modules/tasks/partyQuestService.js` to v1.2.0 with canonical Party Quest help methods `requestHelp`, `requestHouseholdHelp`, `respondHelp` and `retractHelp` through `PartyQuestRepository` only.
- Party Quest help state remains scoped to the Party Quest itself at `helpRequests/{occurrenceId}` and does not reuse the ordinary Task-help state as a second Party Quest authority.
- Help requests are occurrence-scoped and may target one eligible household UID or be broadcast to eligible household members.
- Only the Party Quest inviter can create or retract a help request. The Party Quest must be active and the linked task must still be open.
- At most one open help request may exist for a Party Quest at a time.
- Helper eligibility excludes the requester/inviter, inactive household members, the task creator/current assignees and Party Quest members who are already pending or active. Eligibility is rechecked inside the canonical mutation so a stale UI cannot force an invalid join.
- A targeted accept/decline closes that occurrence. Wrong recipients and repeated responses are rejected.
- A household-wide decline is stored per UID for that occurrence and leaves the broadcast open for other eligible household members.
- A household-wide accept adds that UID to the Party Quest as an active participant with `joinedVia: help` and `helpOccurrenceId`, while the broadcast remains open so additional eligible helpers can still join until the inviter retracts it.
- Open help requests are automatically retracted when the inviter cancels the Party Quest or when a last-participant leave closes the Party Quest.
- Added `src/modules/tasks/partyQuestHelpUi.js` and finalized it as v1.0.1. The inviter gets **Hulp vragen / Hulpvraag beheren** in the active Party Quest overlay; eligible recipients get **Hulp geven / Niet voor mij**.
- PartyQuestHelpUi reads through `PartyQuestRepository`, delegates all mutations to `PartyQuestService`, uses HouseholdContext identity, owns exact repository unsubscribe/generation guards and rejects stale account/household projections.
- Fixed a presentation edge case so an outstanding help request disappears immediately for a member who later becomes assigned, inactive or otherwise ineligible.
- Existing pending Party Quest invitations retain priority over help requests on the shared Party Quest tile.
- Runtime now serves `partyQuestService.js?v=3` and `partyQuestHelpUi.js?v=1`; frozen `notificationActions.js?v=4` and `partyQuestNotificationProjector.js?v=2` were not changed.
- Frozen `src/core/notificationActions.js` remains blob `60a48daa628bc56531395d188a0811711d82a328`.
- Added `scripts/test-party-quest-step11-4.js` covering targeted/broadcast help, wrong-recipient rejection, repeated-response/idempotency guards, multiple household helpers, retraction, cancellation cleanup, delayed stale mutation rejection and HelpUi lifecycle/eligibility behavior.
- Existing Party Quest repository/service loader contracts were aligned to the STEP 11.4 service cache key.
- Final implementation/contract checkpoint before documentation sync: `51256b2506625f7421273d87d0c0f654fdbc432b`.
- `Household Rebuild Contract Tests` run `33044211179`: **SUCCESS**. Logs explicitly report `party quest STEP 11.4 targeted + household help: PASS`, while STEP 11.1–11.3 and the frozen notification contracts remain green.
- Vercel Preview `dpl_CmKCpfPHENmUwjuGzwfRQMXTii7a`: **READY**, branch `agent/household-rebuild-v2`, `target: null`.
- STEP 11.4 real-device targeted/household help smoke is still **pending** and has not been marked accepted.
- STEP 11.3 participant-leave smoke is also still pending; the separate Party Quest toast visual test remains explicitly deferred by the product owner.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — STEP 11.3 leave semantics + ActiveView lifecycle implemented

- Product owner explicitly chose to defer the Party Quest toast iPhone test to later and approved continuing with **STEP 11.3 only**.
- Upgraded `src/modules/tasks/partyQuestService.js` to v1.1.0 with canonical `leaveQuest(questId)` semantics through `PartyQuestRepository.mutateOne()`.
- Leaving now stores the active invitee as `status: left` with `leftAt`; it is no longer conflated with an invitation decline.
- The inviter cannot use participant leave semantics. Owner manual stop remains `cancelQuest()`.
- Quest status recomputes deterministically after leave: another active participant keeps the quest `active`; pending invitees without active participants keep it `pending`; no active/pending invitees closes it as `cancelled`.
- A last-participant leave records an end reason and never fabricates a `completed` Party Quest. Canonical task-driven completion remains reserved for STEP 11.5.
- Refactored `src/modules/tasks/partyQuestActiveView.js` to v6.0.0. It now reads Party Quest state only via `PartyQuestRepository.subscribe()` and delegates leave/end mutations to `PartyQuestService`.
- Removed ActiveView direct Firebase Database refs/updates, `firebase.auth`, `fbFamilyId`, `fbUser` and the name-keyed localStorage avatar fallback.
- Added ActiveView exact repository unsubscribe, subscription-generation stale callback rejection, metadata/context validation and immediate projection/overlay clearing during account/household lifecycle changes.
- Owner **Beëindigen** now delegates to `PartyQuestService.cancelQuest()`; ActiveView has no path that writes `completed`.
- Added `scripts/test-party-quest-step11-3.js`, covering `left`, repeated leave rejection, inviter restriction, status recompute, deferred stale leave rejection, context clear, stale old-household callbacks, service delegation and exact unsubscribe.
- Runtime cache-busts `partyQuestActiveView.js?v=6`, `partyQuestService.js?v=2`, and also serves the toast presentation fix through `utils.js?v=2`.
- Existing Party Quest repository/service loader contract tests were aligned to the v2 service cache key.
- Two intermediate CI runs went red only because old test assertions still expected `partyQuestService.js?v=1`; those assertions were corrected. No Party Quest functional regression was identified by those runs.
- Final implementation/contract checkpoint before documentation sync: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- `Household Rebuild Contract Tests` run `33024009131`: **SUCCESS**.
- Vercel Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7`: **READY**, branch `agent/household-rebuild-v2`, `target: null`.
- STEP 11.3 real-device participant-leave smoke is still **pending** and has not been marked accepted.
- The separate acceptance-toast real-device visual check remains open/deferred by product owner.
- STEP 11.4 and later Party Quest checkpoints were not started at that checkpoint.
- Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328`.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — Party Quest acceptance-toast contrast fix candidate

- Product owner approved fixing the non-blocking Party Quest acceptance-toast visual issue before starting STEP 11.3.
- Root cause confirmed in the shared toast styling: `.toast` uses `background: var(--c-text)` while dark themes intentionally set `--c-text` to a near-white value. Since toast foreground is white, this creates the observed white/near-white bar with unreadable text; emoji such as the handshake remains visible.
- Fixed the shared `showToast()` presentation in `src/core/utils.js` without touching Party Quest state transitions, `PartyQuestService`, `PartyQuestRepository`, frozen `NotificationActions`, or notification persistence/projector behavior.
- The shared toast now forces a dark translucent high-contrast surface with white text, a subtle border/shadow, mobile wrapping, centered multiline text, iOS bottom safe-area spacing, backdrop blur and polite `aria-live` semantics.
- Added `scripts/test-toast-theme-contrast.js` to guard against reintroducing theme-derived white-on-white toast styling and to assert mobile/safe-area/accessibility behavior.
- Toast implementation commit: `ca1d0897b6ad145c88626c5099d9f78f288073d3`.
- Toast contract-test commit: `9475bb348008c2c672e19beaaa2ce6d8076300b1`.
- `Household Rebuild Contract Tests` run `33023131272`: **SUCCESS**.
- Vercel Preview `dpl_AMEwA4YtUuL8JGeuhzDv2nGLpzf6`: **READY**.
- The toast fix remains **open/pending real-device visual verification**; product owner later explicitly chose to defer that visual check.
- STEP 11.2 remains functionally accepted; STEP 10 remains frozen.
- `main`, production Firebase Rules and production deployment remain untouched.

---

## 2026-08-27 — STEP 11.2 real-device functional acceptance; toast UI issue captured

- Product owner completed the first real-device smoke for STEP 11.2 and reported that the Party Quest invitation/acceptance flow works exactly as intended.
- STEP 11.2 is therefore recorded as **functional PASS on real device** in addition to its already-green implementation/contract gate.
- During the acceptance action, a separate visual issue was observed in the confirmation toast: it renders as a mostly empty **white bar**, while the handshake/handdruk icon remains visible.
- This indicates the action itself and icon path work, but the confirmation text and/or toast surface styling is not rendering/readable correctly.
- The toast problem is tracked as a separate non-blocking product/UI fix in `docs/FAMILYAPP-FIX-LIST.md`.
- The issue does **not** reopen frozen STEP 10 Notifications and does **not** invalidate STEP 11.2 functional acceptance.
- `main`, production Firebase Rules and production deployment remain untouched.

---

## 2026-08-27 — STEP 11.2 PartyQuestService + invite/join state machine implemented

- Product owner explicitly approved **GO 11.2 only**.
- Added `src/modules/tasks/partyQuestService.js` v1.0.0 as the Party Quest domain authorization/state-machine layer.
- Service identity is exclusively `HouseholdContext`; it does not use `fbFamilyId`, `fbUser`, direct Firebase Auth or localStorage as identity/persistence authority.
- Party Quest persistence remains exclusively owned by `PartyQuestRepository` at `families/{householdId}/partyQuests/{partyQuestId}`.
- Upgraded `PartyQuestRepository` to v1.1.0 with context-guarded `allocateId()` plus whole-collection `mutateCollection()` transactions for atomic invite creation/duplicate protection.
- Invite creation rechecks the linked task inside the transaction. Only the current UID that is the task creator may invite for an open task.
- Self, task owner, currently assigned users, inactive members and users already pending/active for the same task are excluded from invitation eligibility.
- A declined/revoked participant can be invited again as a fresh invite occurrence. The new occurrence gets an incremented `inviteVersion` and a new deterministic `inviteOccurrenceId` (`<partyQuestId>:<uid>:v<version>`), plus occurrence timestamps.
- Invite responses are UID-authorized: only the current intended invitee can accept/decline its own pending invite. A second response after the first transition is rejected.
- Invite revocation and manual Party Quest stop are inviter-only.
- Manual stop resolves the Party Quest to `cancelled`, never `completed`. Canonical task-driven completion remains reserved for STEP 11.5.
- Reworked `src/modules/tasks/partyQuestInvites.js` as v6.0 presentation/compatibility facade. It reads from `PartyQuestRepository` and delegates create/respond/revoke/cancel mutations to `PartyQuestService`.
- Preserved frozen STEP 10 compatibility methods used by `NotificationActions`: `PartyQuestInvites.getById`, `.respond`, `.revokeInvite`.
- Frozen `src/core/notificationActions.js` was not modified and remains blob `60a48daa628bc56531395d188a0811711d82a328`.
- Final code checkpoint before documentation sync: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- `Household Rebuild Contract Tests` run `33021739099`: **SUCCESS**.
- Vercel deployment `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: **READY** on branch `agent/household-rebuild-v2` (`target: null`, Preview).
- Stable branch Preview remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- Separate owner-transfer **Gezin verlaten** real-device smoke remains open and is not a STEP 11 blocker.
- `main`, production Firebase Rules and production deployment were not changed. Firebase remains on Spark.

---

## Frozen checkpoint reference

- STEP 8 Finance: accepted/frozen 2026-08-24.
- STEP 9 Progression: accepted/frozen 2026-08-24.
- STEP 10 Notifications: explicitly accepted/frozen 2026-08-26.
- STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- STEP 11.1 code checkpoint: `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- STEP 11.2 implementation checkpoint: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- STEP 11.3 implementation/contract checkpoint: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- STEP 11.4 implementation/contract checkpoint: `51256b2506625f7421273d87d0c0f654fdbc432b`.
- Party Quest UX base checkpoint: `1c5b543926055ab647773b8182fa63322f83878e`.
- Party Quest UX latest defer follow-up checkpoint: `0ef7274feea7ddadc86919843bf0a24891214e33`.
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.