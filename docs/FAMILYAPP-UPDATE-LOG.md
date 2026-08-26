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
- Direct Preview fetch of `src/core/utils.js?v=1` returned HTTP 200 and served the corrected toast code. Vercel response uses `Cache-Control: public, max-age=0, must-revalidate`, so the updated asset is revalidated instead of relying on a permanently stale copy.
- The toast fix remains **open/pending real-device visual verification** until the product owner confirms the acceptance toast is readable on iPhone. It must not be marked closed before that check.
- STEP 11.2 remains functionally accepted; STEP 10 remains frozen; STEP 11.3 remains not started.
- `main`, production Firebase Rules and production deployment remain untouched.

---

## 2026-08-27 — STEP 11.2 real-device functional acceptance; toast UI issue captured

- Product owner completed the first real-device smoke for STEP 11.2 and reported that the Party Quest invitation/acceptance flow works exactly as intended.
- STEP 11.2 is therefore recorded as **functional PASS on real device** in addition to its already-green implementation/contract gate.
- During the acceptance action, a separate visual issue was observed in the confirmation toast: it renders as a mostly empty **white bar**, while the handshake/handdruk icon remains visible.
- This indicates the action itself and icon path work, but the confirmation text and/or toast surface styling is not rendering/readable correctly.
- The toast problem is tracked as a separate non-blocking product/UI fix in `docs/FAMILYAPP-FIX-LIST.md`.
- The issue does **not** reopen frozen STEP 10 Notifications and does **not** invalidate STEP 11.2 functional acceptance.
- STEP 11.3 remains **not started** and still requires explicit product-owner approval.
- `main`, production Firebase Rules and production deployment remain untouched.

---

## 2026-08-27 — STEP 11.2 PartyQuestService + invite/join state machine implemented

- Product owner explicitly approved **GO 11.2** only. STEP 11.3 and later checkpoints were not started.
- Added `src/modules/tasks/partyQuestService.js` v1.0.0 as the Party Quest domain authorization/state-machine layer.
- Service identity is exclusively `HouseholdContext`; it does not use `fbFamilyId`, `fbUser`, direct Firebase Auth or localStorage as identity/persistence authority.
- Party Quest persistence remains exclusively owned by `PartyQuestRepository` at `families/{householdId}/partyQuests/{partyQuestId}`.
- Upgraded `PartyQuestRepository` to v1.1.0 with context-guarded `allocateId()` plus whole-collection `mutateCollection()` transactions for atomic invite creation/duplicate protection.
- Invite creation rechecks the linked task inside the transaction. Only the current UID that is the task creator may invite for an open task.
- Self, task owner, currently assigned users, inactive members and users already pending/active for the same task are excluded from invitation eligibility.
- A declined/revoked participant can be invited again as a fresh invite occurrence. The new occurrence gets an incremented `inviteVersion` and a new deterministic `inviteOccurrenceId` (`<partyQuestId>:<uid>:v<version>`), plus occurrence timestamps.
- Invite responses are UID-authorized: only the current intended invitee can accept/decline its own pending invite. A second response after the first transition is rejected.
- Invite revocation and manual Party Quest stop are inviter-only.
- Manual stop now resolves the Party Quest to `cancelled`, never `completed`. Canonical task-driven completion remains reserved for STEP 11.5.
- Reworked `src/modules/tasks/partyQuestInvites.js` as v6.0 presentation/compatibility facade. It reads from `PartyQuestRepository` and delegates create/respond/revoke/cancel mutations to `PartyQuestService`; it no longer owns direct Party Quest Firebase transactions/listeners.
- Preserved frozen STEP 10 compatibility methods used by `NotificationActions`: `PartyQuestInvites.getById`, `.respond`, `.revokeInvite`.
- Frozen `src/core/notificationActions.js` was not modified and remains blob `60a48daa628bc56531395d188a0811711d82a328`.
- Runtime serves `partyQuestInvites.js?v=6`, `partyQuestRepository.js?v=2` and `partyQuestService.js?v=1`; the frozen notification runtime remains downstream.
- Added `scripts/test-party-quest-service.js` with authorization, duplicate invite, double-response, wrong-recipient, non-inviter revoke, occurrence-aware reinvite and stale account/household mutation negative coverage.
- Final code checkpoint before documentation sync: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- `Household Rebuild Contract Tests` run `33021739099`: **SUCCESS**.
- Vercel deployment `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: **READY** on branch `agent/household-rebuild-v2` (`target: null`, Preview).
- Direct deployment URL returned HTTP 200 and served the expected HouseholdContext → PartyQuestRepository → PartyQuestService → frozen notification chain.
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
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.