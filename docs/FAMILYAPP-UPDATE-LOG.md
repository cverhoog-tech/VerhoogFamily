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

## 2026-08-27 — STEP 11.5 device Test 2 PASS; STEP 11.6 notification scope proposed

- Product owner confirmed STEP 11.5 real-device Test 2 **PASS** and described the result as working perfectly.
- A different accepted Party Quest participant authenticated after the linked Task/Party Quest had already completed and correctly received the durable pending Party Quest XP reward.
- This validates the later-login/offline-participant settlement behavior on a real device.
- STEP 11.5 is not yet marked fully device-accepted because the previously agreed final duplicate-safety smoke remains: reload/reopen as that same participant and verify the same Party Quest XP/reward does not fire a second time.
- Product owner requested richer notifications for collaborative consequences:
  - notify relevant users when another household member completes a Task they were involved in;
  - notify a user when XP is received because of another household member's action.
- This is captured as proposed **STEP 11.6** scope only; STEP 11.6 code has not started and still requires explicit **GO STEP 11.6**.
- Preferred UX direction for 11.6: when one remote action both completes a related Task and grants XP, prefer one richer combined notification over two noisy notifications; suppress self-notifications for the actor; preserve deterministic event identity so reconnect/replay/later login cannot duplicate it.
- STEP 11.6 must reuse the frozen canonical NotificationStore/projector/push architecture and must not create a second notification authority.
- No production deployment, production Firebase Rules, `main`, frozen STEP 8/9/10 authority, or STEP 11.6 code was changed in this checkpoint.

---

## 2026-08-27 — STEP 11.5 device Test 1 PASS

- Product owner confirmed STEP 11.5 real-device Test 1 **PASS** and described the result as working perfectly.
- On the current STEP 11.5 Preview, completing the normal Task linked to a Party Quest correctly ended/removed that Party Quest from the active Party Quest state.
- The maker/current participant received the Party Quest completion XP once as intended.
- This validates the first real-device half of canonical task-driven Party Quest completion + reward settlement.
- STEP 11.5 is **not yet fully device-accepted**: Test 2 still needs to confirm that another accepted participant who was not the current UID at completion receives their durable pending Party Quest reward when they later authenticate, exactly once.
- STEP 11.6 remains not started and still requires explicit approval.
- No code, production Firebase Rules, `main`, frozen STEP 8/9/10 authority or production deployment was changed for this Test 1 status update.

---

## 2026-08-27 — STEP 11.5 canonical completion + durable exactly-once Party Quest rewards implemented

- Product owner explicitly approved **GO STEP 11.5**. Scope remained STEP 11.5 only; STEP 11.6 notification-event extensions were not started.
- Reworked Party Quest completion around the accepted architecture rather than the legacy `rewardsClaimed` bridge.
- `PartyQuestService` is now v1.3.0 and adds `completeFromTask(questId)` plus `markRewardSettled(questId, occurrenceId)` through `PartyQuestRepository` only.
- Party Quest completion is now driven only by the linked canonical Task being completed. Manual Party Quest stop still means cancellation and cannot fabricate a completed state.
- Added a canonical-task trust guard: in the served app, completion requires `TaskHouseholdRepository.status().ready === true` with a source beginning with `firebase`. A household-cache/local placeholder projection may not finalize a Party Quest.
- Completion occurrence is deterministic/versioned as `partyQuest:<partyQuestId>:completion:v1`.
- Completion captures the inviter plus invitees who are actually `active` at completion time. Pending/declined/revoked/left participants do not receive the completion reward.
- Any still-pending Party Quest invitations are revoked and open Party Quest help requests are retracted when canonical task-driven completion settles.
- Each eligible participant gets a durable `rewardSettlements/{uid}` row in the Party Quest with `status: pending`, occurrence, deterministic reward key and XP amount. These rows are work/diagnostic state only and are explicitly **not** progression authority.
- `partyQuestCompletionReward.js` is now v4.0.0. It observes `PartyQuestRepository`, delegates Party Quest mutations to `PartyQuestService`, and delegates XP exclusively to frozen `ProgressionStore.awardOnce()`.
- The deterministic ProgressionStore key remains `partyQuest:<partyQuestId>`. Because progression is UID-scoped, each participant can use the same stable Party Quest key without sharing XP state; retaining the old successful key also prevents duplicate XP if an earlier bridge had already awarded it.
- Removed the old preclaim-before-XP failure mode. There is no direct `rewardsClaimed` transaction before progression anymore.
- If XP fails, the Party Quest settlement remains `pending`, so a later scan can retry rather than permanently losing the reward.
- If XP succeeds but the app crashes before the Party Quest settlement can be acknowledged, retry is safe: `ProgressionStore.awardOnce()` rejects the duplicate increment, `hasReward()` confirms the canonical reward, and the pending settlement converges to `settled` without duplicate XP or duplicate completion celebration.
- Offline participants no longer miss Party Quest XP. Their household-scoped pending settlement remains until that UID later has an authenticated session, at which point the same worker settles it through the frozen ProgressionStore.
- Household/account lifecycle safety is retained: the worker captures HouseholdContext, owns exact repository unsubscribe/generation guards, and refuses delayed old-context settlement acknowledgement after an account or household switch.
- Removed legacy authority from the worker: no direct Party Quest Firebase database writes, no `rewardsClaimed`, no direct `awardXP`, no `PartyQuestActiveView.endQuest`, no `fbFamilyId`, no `fbUser`, and no localStorage authority.
- Runtime now serves `partyQuestService.js?v=4` and `partyQuestCompletionReward.js?v=4`. Frozen `progressionStore.js?v=1`, `progressionRuntime.js?v=2`, `notificationActions.js?v=4` and `partyQuestNotificationProjector.js?v=2` remain unchanged.
- Added `scripts/test-party-quest-step11-5.js` covering canonical task-source enforcement, deterministic completion, participant selection, pending settlements, retry after reward failure, crash-after-XP convergence, offline-participant later settlement and stale account/household rejection.
- Updated the frozen STEP 9 deterministic progression producer audit to exercise the new v4 bridge semantics while preserving its original requirement: Party Quest rewards must keep one deterministic progression key and failed canonical XP writes must remain recoverable.
- Final code/contract checkpoint before documentation sync: `6263dd5882253f78d7afa8eafa34f7757f836a3d`.
- Full `Household Rebuild Contract Tests` run `33110105234`: **SUCCESS**. Logs explicitly report `party quest STEP 11.5 completion + exactly-once rewards: PASS`, `STEP 9 deterministic progression producer contract: PASS`, `STEP 9 canonical progression store contract: PASS`, all STEP 10 notification contracts PASS, and prior STEP 11.2–11.4/UX contracts PASS.
- Frozen `src/core/notificationActions.js` was rechecked after STEP 11.5 and remains exact blob `60a48daa628bc56531395d188a0811711d82a328`.
- Vercel Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf`: **READY**, `target: null`, commit `6263dd5882253f78d7afa8eafa34f7757f836a3d`; branch alias remains `verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- STEP 11.5 is **implementation/contract complete, real-device acceptance pending**.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — Google post-login handoff fix candidate implemented; full CI green

- Product owner approved fixing backlog item #7 on `agent/household-rebuild-v2` only.
- Successful popup auth now hands the authenticated user to the existing `AuthenticatedSessionController`; same-UID popup/observer bootstraps share one household bootstrap and the existing controller remains the single auth/session/startup authority.
- Code/contract checkpoint: `f10e198fd144caa62427c78609f1295780707ef4`; CI `33069878758`: **SUCCESS**.
- Real-device follow-up remains open as a separate product fix.

---

## 2026-08-27 — “Later beslissen” device PASS; Google post-login freeze captured

- Product owner confirmed Party Quest UX Test 3 **PASS**: explicit **Later beslissen** works on a real device.
- The Party Quest UX patch is therefore real-device accepted for multi-start, Arcana icons, canonical new-task handoff and invite deferral.
- A separate Google post-auth/startup UI regression was captured for product-fix follow-up.

---

## 2026-08-27 — Party Quest UX Tests 1/2 PASS; explicit “Later beslissen” follow-up implemented

- UX Test 1 real-device PASS: **＋ Nieuwe Party Quest** works while another Party Quest exists and chooser icons are meaningful.
- UX Test 2 real-device PASS: **Nieuwe quest maken** uses the canonical task creator and returns with the new task preselected.
- Explicit **Later beslissen** was added without PartyQuestService mutation; invite remains pending and same-session auto-reprompt is occurrence-scoped.
- Checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`; CI `33052149328` SUCCESS.

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
- Party Quest UX latest checkpoint: `0ef7274feea7ddadc86919843bf0a24891214e33`.
- STEP 11.5 implementation/contract checkpoint: `6263dd5882253f78d7afa8eafa34f7757f836a3d` (CI `33110105234` SUCCESS; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf` READY; device Tests 1/2 PASS, duplicate-safety Test 3 pending).
- Google post-login handoff fix candidate checkpoint: `f10e198fd144caa62427c78609f1295780707ef4`.
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.
