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

## 2026-08-29 — STEP 11.6 combined Party Quest completion + XP notification device PASS

- Product owner confirmed the second STEP 11.6 real-device smoke **PASS** and reported that it behaved exactly as specified.
- Scenario: account A and account B were both active participants in a Party Quest; account A completed the linked canonical Task.
- Account B then opened Notifications and received one combined Party Quest notification naming the completion context and the XP reward.
- No second ordinary Task-completed notification appeared for the same action, validating the intended duplicate suppression between ordinary involved-Task events and Party Quest completion events.
- This confirms the richer combined completion+XP presentation path on a real device.
- STEP 11.6 is now **device 2/3 PASS**. One final reload/reopen replay smoke remains: account B must reopen/reload and confirm the same combined notification is not duplicated.
- STEP 11.5 still separately retains its previously agreed no-second-XP Test 3; the upcoming reload observation may only close that older gate if the observed reward/toast behavior genuinely establishes no duplicate XP for the same occurrence.
- No product code, `main`, production Firebase Rules or production deployment was changed for this status update.

---

## 2026-08-28 — STEP 11.6 real-device Test 1 PASS

- Product owner confirmed the first STEP 11.6 real-device smoke **PASS** and reported that it worked exactly as intended.
- Scenario: account A completed an ordinary Task in which account B was actually involved.
- Account B received the intended related-task completion notification through the existing notification experience.
- This validates the new ordinary involved-task notification path on a real device, including collaborator targeting and practical presentation behavior.
- STEP 11.6 remains partially device-verified rather than fully accepted: the remaining Test 2 must validate the richer combined **Party Quest completed + XP** notification to another accepted participant.
- STEP 11.5 still separately has its final reload/no-duplicate reward Test 3 pending; this 11.6 pass does not silently close that gate.
- No product code, `main`, production Firebase Rules or production deployment was changed for this status update.

---

## 2026-08-28 — STEP 11.6 involved Task completion + Party Quest XP notifications implementation/contract green

- Product owner explicitly approved **GO STEP 11.6** after requesting notifications when another household member completes a Task the user was involved in and/or causes the user to receive XP.
- Scope remained notification-event extensions only. STEP 11.7 was not started.
- Added `NotificationEvents.taskCompleted(...)` with deterministic type/key `task.completed.involved:<taskId>:<occurrence>:<completedByUid>` through canonical `NotificationStore.publishToUidsOnce()`.
- Ordinary Task completion recipients are actual collaborators only: creator/owner, assignees and accepted ordinary helpers. The actual completer is excluded to avoid self-notification noise.
- Party Quest participants for the same completed Task are excluded from that ordinary completion event so one action does not create both an ordinary Task-completion notification and a Party Quest notification for the same person.
- Extended Party Quest completion projection to send one richer targeted notification containing both completion context and the participant XP reward.
- Causal attribution is preserved: when the UID that technically finalizes the Party Quest differs from the UID that actually completed the linked Task, the notification names the original task completer from canonical completion metadata.
- Both the technical event publisher and the original task completer are excluded from the Party Quest recipient audience where they differ, preventing self-noise.
- Existing canonical event actor/push authorization semantics remain intact: the authenticated technical publisher creates the canonical event, while presentation metadata may refer to the original completer.
- No push backend/server change was required. The existing trusted sender already reads canonical events, resolves targeted audiences dynamically, validates caller == event actor and excludes the actor server-side.
- Frozen `NotificationActions` was not modified and remains exact blob `60a48daa628bc56531395d188a0811711d82a328`.
- No new NotificationStore, XP authority, direct Firebase notification path, token store or localStorage authority was introduced.
- During the new 11.6 regression test, a real startup lifecycle edge case was found in `HouseholdDomainNotificationProjectorV2`: repository subscriptions can synchronously establish a baseline before the immediate same-context `HouseholdContext.subscribe()` callback runs; the old callback then reset that baseline, allowing the first real Task transition after startup to be missed.
- Fixed that issue in `HouseholdDomainNotificationProjectorV2` v1.2.1 with a context-identity guard. The immediate same-context callback no longer clears fresh baselines, while actual UID/household/revision changes still reset state.
- `notificationExperience.js` is now v1.1.1; `partyQuestNotificationProjector.js` is v3.0.1.
- Served cache keys now include `notificationEvents.js?v=3`, `notificationExperience.js?v=2`, `householdDomainNotificationProjectorV2.js?v=2` and `partyQuestNotificationProjector.js?v=3`. Frozen `notificationActions.js?v=4`, NotificationStore, push sender, ProgressionStore and STEP 11.5 completion/reward runtime remain unchanged.
- Added `scripts/test-party-quest-step11-6.js` covering deterministic ordinary completion identity, exact collaborators, Party Quest duplicate suppression, combined completion+XP presentation, original-completer attribution, publisher/completer self-suppression, replay de-duplication, startup baseline lifecycle and stale HouseholdContext rejection.
- Existing notification/Party Quest phase guards were updated only where they intentionally asserted the old projector/bootstrap version. Their original lifecycle, auth, push, progression and state-machine assertions remain in place.
- Final code/contract checkpoint: `b067fc74931e058b9aa2507d5564501e77575114`.
- Full `Household Rebuild Contract Tests` run `33124463794`: **SUCCESS**. Logs explicitly report `party quest STEP 11.6 involved completion + XP notifications: PASS`, STEP 11.5 exactly-once rewards PASS, all frozen STEP 10 notification/push tests PASS, frozen STEP 9 progression tests PASS, and prior STEP 11/UX contracts PASS.
- Vercel Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9`: **READY**, `target: null`, commit `b067fc74931e058b9aa2507d5564501e77575114`. Stable branch alias remains `verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- STEP 11.6 is **implementation/contract complete; real-device notification verification pending**.
- Administrative guard: STEP 11.5 device Tests 1 and 2 are PASS, but the separately agreed Test 3 (reload/reopen the second participant and confirm no duplicate XP/reward) is still pending and must not be silently marked accepted.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — STEP 11.5 device Test 2 PASS; STEP 11.6 notification scope proposed

- Product owner confirmed STEP 11.5 real-device Test 2 **PASS** and described the result as working perfectly.
- A different accepted Party Quest participant authenticated after the linked Task/Party Quest had already completed and correctly received the durable pending Party Quest XP reward.
- This validates the later-login/offline-participant settlement behavior on a real device.
- STEP 11.5 is not yet marked fully device-accepted because the previously agreed final duplicate-safety smoke remains: reload/reopen as that same participant and verify the same Party Quest XP/reward does not fire a second time.
- Product owner requested richer notifications for collaborative consequences:
  - notify relevant users when another household member completes a Task they were involved in;
  - notify a user when XP is received because of another household member's action.
- This was captured as proposed **STEP 11.6** scope and was subsequently approved/implemented in the checkpoint above.
- Preferred UX direction: when one remote action both completes a related Task and grants XP, prefer one richer combined notification over two noisy notifications; suppress self-notifications for the actor; preserve deterministic event identity so reconnect/replay/later login cannot duplicate it.
- STEP 11.6 must reuse the frozen canonical NotificationStore/projector/push architecture and must not create a second notification authority.
- No production deployment, production Firebase Rules, `main` or frozen STEP 8/9/10 authority was changed in this checkpoint.

---

## 2026-08-27 — STEP 11.5 device Test 1 PASS

- Product owner confirmed STEP 11.5 real-device Test 1 **PASS** and described the result as working perfectly.
- On the current STEP 11.5 Preview, completing the normal Task linked to a Party Quest correctly ended/removed that Party Quest from the active Party Quest state.
- The maker/current participant received the Party Quest completion XP once as intended.
- This validates the first real-device half of canonical task-driven Party Quest completion + reward settlement.
- STEP 11.5 was not yet fully device-accepted at this point; later-login and duplicate-safety checks remained.
- No code, production Firebase Rules, `main`, frozen STEP 8/9/10 authority or production deployment was changed for this Test 1 status update.

---

## 2026-08-27 — STEP 11.5 canonical completion + durable exactly-once Party Quest rewards implemented

- Product owner explicitly approved **GO STEP 11.5**. Scope remained STEP 11.5 only; STEP 11.6 notification-event extensions were not started at that checkpoint.
- Reworked Party Quest completion around the accepted architecture rather than the legacy `rewardsClaimed` bridge.
- `PartyQuestService` v1.3.0 adds task-driven completion plus post-award settlement acknowledgement through `PartyQuestRepository` only.
- Party Quest completion is driven only by the linked canonical Task being completed. Manual Party Quest stop still means cancellation and cannot fabricate a completed state.
- Completion requires the trusted live Firebase Task projection; a household-cache/local placeholder projection may not finalize a Party Quest.
- Completion occurrence is deterministic/versioned as `partyQuest:<partyQuestId>:completion:v1`.
- Completion captures the inviter plus invitees who are actually `active` at completion time. Pending/declined/revoked/left participants do not receive the completion reward.
- Any still-pending Party Quest invitations are revoked and open Party Quest help requests are retracted when canonical task-driven completion settles.
- Each eligible participant gets a durable pending `rewardSettlements/{uid}` row. These rows are work/diagnostic state only and are not progression authority.
- `partyQuestCompletionReward.js` v4.0.0 delegates XP exclusively to frozen `ProgressionStore.awardOnce()` using deterministic reward key `partyQuest:<partyQuestId>` within each UID-scoped progression store.
- Removed the old preclaim-before-XP failure mode. Failed XP leaves the settlement pending; crash after XP but before acknowledgement retries without duplicate XP.
- Offline participants keep their pending settlement until that UID later authenticates.
- Household/account lifecycle guards reject delayed old-context settlement work.
- Code/contract checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; full CI `33110105234`: **SUCCESS**; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf`: **READY**.
- Frozen `src/core/notificationActions.js` remained blob `60a48daa628bc56531395d188a0811711d82a328`.
- `main`, production Firebase Rules and production deployment remained untouched.

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
- STEP 11.6 implementation/contract checkpoint: `b067fc74931e058b9aa2507d5564501e77575114` (CI `33124463794` SUCCESS; Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9` READY; device Tests 1/2 PASS, reload/replay Test 3 pending).
- Google post-login handoff fix candidate checkpoint: `f10e198fd144caa62427c78609f1295780707ef4`.
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.
