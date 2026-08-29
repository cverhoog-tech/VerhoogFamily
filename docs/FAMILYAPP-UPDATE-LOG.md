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

## 2026-08-29 — STEP 11.8 integrated CI + Preview candidate COMPLETE

- Product owner explicitly approved **GO STEP 11.8**.
- Scope was the integrated release-candidate check for the current Party Quest stack, not new product behavior.
- Added `scripts/test-party-quest-step11-8-integration.js`.
- The new contract executes the real `api/app.js` loader and verifies the final served HTML rather than only inspecting source injection strings.
- It proves the current canonical Party Quest layers are each served exactly once: `PartyQuestRepository`, `PartyQuestService`, `PartyQuestActiveView`, `PartyQuestHelpUi`, `PartyQuestCompletionReward`, `PartyQuestInvites` and `PartyQuestNotificationProjector`.
- It verifies singular canonical dependencies/authorities and safe bootstrap order for HouseholdContext, Task repository, ProgressionStore/Runtime and NotificationStore/Events/Actions.
- It re-verifies dormant pre-rebuild Party Quest prototype files (`groupQuests.js`, `groupQuestEditor.js`, `groupQuestPremium.js`) are absent from the rendered application while current `duoQuests.js` remains served exactly once.
- It re-verifies frozen `src/core/notificationActions.js` exact blob `60a48daa628bc56531395d188a0811711d82a328`.
- Integrated STEP 11.8 checkpoint: `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- Full `Household Rebuild Contract Tests` run `33273749600`: **SUCCESS**. Logs explicitly report `party quest STEP 11.8 integrated served-runtime candidate: PASS`, together with STEP 11.3 leave, 11.4 help, 11.5 exactly-once rewards, 11.6 notifications, 11.7 legacy compatibility, UX patch, frozen STEP 9 progression, frozen STEP 10 notifications/push, auth/startup and the broader rebuild suite all PASS.
- Expected simulated `NETWORK_DOWN` / `WRITE_FAILED` warnings remain failure-path fixtures whose tests PASS; they are not deployment failures.
- GitHub combined status for the exact candidate reports both `Household Rebuild Contracts` and `Vercel` as **success**.
- Vercel Preview candidate: `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq`, state **READY**, target Preview, Git commit `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- Exact candidate URL: `https://verhoog-family-569s2vs54-cverhoog-techs-projects.vercel.app`.
- Server-side fetch of the candidate root returned HTTP **200** and the expected rendered FamilyApp shell.
- Preview runtime scan for `error`/`fatal` logs on that deployment found no entries in the checked window.
- No product runtime logic, Firebase Rules, production deployment or `main` was changed as part of the STEP 11.8 integration guard itself.
- STEP 11.8 is **COMPLETE**. STEP 11.9 remains the bundled real-iPhone acceptance sweep and requires explicit product-owner approval.

---

## 2026-08-29 — STEP 11.7 compatibility/legacy guard COMPLETE; full CI green

- Product owner explicitly approved **GO STEP 11.7** and asked to continue under accelerated validation mode.
- Audited the dormant legacy Party Quest prototype (`groupQuests.js`, `groupQuestEditor.js`, `groupQuestPremium.js`, `groupQuestVault.js`) against current runtime wiring and canonical Party Quest modules.
- Audit confirmed the old name/localStorage/legacy-XP prototype is not the current Party Quest runtime authority. `duoQuests.js` is a separate currently served Task UX module and must not be confused with/quarantined as the old `groupQuests.js` prototype.
- Chose a CI quarantine boundary rather than adding another runtime layer or attempting an unsafe name-to-UID migration.
- Added `scripts/test-party-quest-step11-7.js`.
- The new guard fails CI if dormant legacy Party Quest files are reintroduced through served runtime entrypoints.
- The guard fails CI if canonical Party Quest modules begin depending on legacy localStorage keys (`fam_group_quests_v001`, `fam_group_members_v001`, `fam_active_member_id`), legacy `GroupQuests`/editor/premium authorities, hardcoded prototype member names, localStorage Party Quest state, or direct legacy `awardXP(...)` behavior.
- The guard explicitly preserves the frozen `PartyQuestInvites` compatibility surface required by NotificationActions: `getById`, `revokeInvite`, `respond`, while verifying mutations still delegate through `PartyQuestService`.
- No automatic migration from legacy display-name identities to Firebase/Auth UIDs was introduced.
- Frozen `src/core/notificationActions.js` was reverified exact SHA/blob `60a48daa628bc56531395d188a0811711d82a328`.
- STEP 11.7 code/contract checkpoint: `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`.
- Full `Household Rebuild Contract Tests` run `33273125677`: **SUCCESS**. The log explicitly reports `party quest STEP 11.7 legacy compatibility guard: PASS` and also re-runs STEP 11.3 leave, STEP 11.4 help, STEP 11.5 exactly-once rewards, STEP 11.6 notifications, frozen STEP 9 progression, frozen STEP 10 notification/push, auth/startup and other rebuild contracts successfully.
- Expected simulated `NETWORK_DOWN` / `WRITE_FAILED` warnings in reward/progression failure-path fixtures remained PASS and are not production failures.
- STEP 11.7 changed only `scripts/test-party-quest-step11-7.js`; no served runtime/product code changed. Therefore no isolated device smoke was needed for this substep.

---

## 2026-08-29 — STEP 11.6 fully real-device accepted; accelerated validation mode adopted

- Product owner completed the final STEP 11.6 reload/replay smoke as account B and confirmed **no duplicate** combined Party Quest completion + XP notification appeared.
- STEP 11.6 real-device sequence is complete: ordinary involved-Task notification PASS; combined Party Quest completion+XP notification PASS; no duplicate ordinary notification PASS; reload/reconnect replay no duplicate combined notification PASS.
- STEP 11.6 is **COMPLETE + REAL-DEVICE ACCEPTED**.
- The replay observation validates notification-event idempotency only; STEP 11.5's separate no-second-XP reward observation remains pending for the later bundled acceptance sweep.
- Product owner requested a faster path through the remaining roadmap and specifically asked to stop doing so many separate micro-tests.
- Adopted **accelerated validation mode**: bundle low/medium-risk device checks into meaningful checkpoint/end-of-phase sweeps, while keeping destructive/auth/security/cross-household/finance/idempotency-reward/release-blocking checks explicit.
- Explicit GO approval for each new roadmap step and production/release gate remains unchanged.
- Remaining STEP 11.3 leave, STEP 11.4 recipient/broadcast help and STEP 11.5 no-duplicate XP checks are deferred to the bundled STEP 11 acceptance sweep unless they become blockers earlier.

---

## 2026-08-28/29 — STEP 11.6 notification extensions implementation + device acceptance

- Added deterministic ordinary involved-Task completion events through canonical `NotificationStore.publishToUidsOnce()`.
- Ordinary Task recipients are actual collaborators only; self is excluded.
- Party Quest participants are excluded from the ordinary event so they receive one richer combined Party Quest completion + XP notification instead of duplicate noise.
- Causal attribution names the original linked-Task completer even if another UID technically finalizes the Party Quest.
- Existing canonical event actor/push authorization semantics remain intact.
- Found and fixed a startup lifecycle edge case in `HouseholdDomainNotificationProjectorV2` where an immediate same-context HouseholdContext callback could wipe the freshly established Task repository baseline.
- Code/contract checkpoint `b067fc74931e058b9aa2507d5564501e77575114`.
- Full CI `33124463794`: SUCCESS.
- Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9`: READY, Preview target.
- Frozen `NotificationActions` remained exact blob `60a48daa628bc56531395d188a0811711d82a328`.
- Real-device Tests 1/2/3 subsequently passed and STEP 11.6 was accepted 2026-08-29.

---

## 2026-08-27 — STEP 11.5 device Tests 1/2 PASS

- Test 1 PASS: completing the linked canonical Task correctly closed the active Party Quest and awarded the current participant XP once.
- Test 2 PASS: another accepted participant authenticated later and correctly received the durable pending Party Quest XP reward.
- Final no-second-XP reload observation remains pending as a reward/idempotency safety gate and is now scheduled for the bundled STEP 11 acceptance sweep.

---

## 2026-08-27 — STEP 11.5 canonical completion + durable exactly-once Party Quest rewards implemented

- Product owner explicitly approved **GO STEP 11.5**.
- Party Quest completion is driven only by the linked canonical Task being completed; manual stop remains cancellation.
- Trusted live Firebase Task projection is required; cache-only state cannot finalize a Party Quest.
- Deterministic completion occurrence captures inviter + active participant UIDs.
- `rewardSettlements/{uid}` are durable work/diagnostic state only; frozen `ProgressionStore.awardOnce()` remains XP authority.
- Failed XP remains retryable; post-XP/pre-ack crash converges without duplicate XP; offline participants settle on later authenticated session.
- Code/contract checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf` READY.
- Frozen NotificationActions remained unchanged.

---

## 2026-08-27 — Google post-login handoff fix candidate implemented

- Successful popup auth now hands the authenticated user to the existing `AuthenticatedSessionController`; same-UID popup/observer bootstraps share the canonical startup pipeline.
- Candidate checkpoint `f10e198fd144caa62427c78609f1295780707ef4`; CI `33069878758` SUCCESS.
- Real-device PWA verification remains open as a separate product fix.

---

## 2026-08-27 — Party Quest UX patch real-device accepted

- Multi-start + Arcana icons PASS.
- Canonical `TaskDetailPopup.openCreate()` handoff PASS.
- Explicit **Later beslissen** PASS; invite remains pending with session-only auto-reprompt suppression.
- Latest UX checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`; CI `33052149328` SUCCESS.

---

## Frozen checkpoint reference

- STEP 8 Finance: accepted/frozen 2026-08-24.
- STEP 9 Progression: accepted/frozen 2026-08-24.
- STEP 10 Notifications: explicitly accepted/frozen 2026-08-26.
- STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- Frozen `notificationActions.js` blob through STEP 11.8: `60a48daa628bc56531395d188a0811711d82a328`.
- STEP 11.1 checkpoint: `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- STEP 11.2 checkpoint: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- STEP 11.3 checkpoint: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- STEP 11.4 checkpoint: `51256b2506625f7421273d87d0c0f654fdbc432b`.
- Party Quest UX checkpoint: `0ef7274feea7ddadc86919843bf0a24891214e33`.
- STEP 11.5 checkpoint: `6263dd5882253f78d7afa8eafa34f7757f836a3d` (CI `33110105234` SUCCESS; device Tests 1/2 PASS; no-duplicate-XP safety observation pending for bundled acceptance).
- STEP 11.6 checkpoint: `b067fc74931e058b9aa2507d5564501e77575114` (CI `33124463794` SUCCESS; Preview READY; real-device accepted).
- STEP 11.7 checkpoint: `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b` (CI `33273125677` SUCCESS; compatibility quarantine).
- STEP 11.8 integrated candidate: `3f01b3f2265c88dcc6480e7458d16cb21da2a146` (CI `33273749600` SUCCESS; Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq` READY; HTTP 200; no error/fatal runtime logs in scan).
- Google post-login handoff fix candidate: `f10e198fd144caa62427c78609f1295780707ef4`.
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.
