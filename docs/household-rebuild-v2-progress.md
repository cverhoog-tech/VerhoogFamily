# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`  
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

## Status legend
- `[ ]` not started
- `[-]` in progress
- `[x]` accepted/completed
- `[!]` blocked / needs attention

## Current position — synced 2026-08-29

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
- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression — accepted/frozen 2026-08-24.
- [x] STEP 10 — Notifications — accepted/frozen 2026-08-26.
- [-] STEP 11 — Party quests — in progress.

**Current position:** STEP 11.1–11.8 are implementation/contract complete. STEP 11.6 is fully real-device accepted. STEP 11.7 established the CI compatibility/legacy quarantine. STEP 11.8 produced the integrated served-runtime candidate with full rebuild CI SUCCESS and a READY Vercel Preview. STEP 11.9 remains the bundled real-iPhone acceptance sweep and requires explicit product-owner approval.

**Validation cadence from 2026-08-29:** accelerate completion by bundling remaining low/medium-risk device smokes into meaningful acceptance sweeps instead of testing every subflow separately. Keep separate explicit testing for high-risk/destructive/auth-identity/security/cross-household/finance/idempotency-reward/release-blocking behavior. This changes test cadence only; it does not waive explicit GO approval for new roadmap steps or release gates.

Remaining STEP 11 acceptance items to batch in STEP 11.9: participant leave (11.3), recipient/broadcast help (11.4), and the no-second-XP reward safety observation (11.5). The acceptance-toast visual recheck and Google post-login/startup fix remain separate product follow-ups.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.
- [x] STEP 11.5 reuses frozen `ProgressionStore.awardOnce()`; no second XP authority or direct legacy `awardXP` path was introduced.

### STEP 10 — Notifications
- [x] Explicitly accepted/frozen by product owner on 2026-08-26.
- [x] Canonical household notification state, UID isolation, external iOS push and push-tap routing/de-duplication accepted.
- [x] Frozen checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] Frozen `notificationActions.js` remains exact blob `60a48daa628bc56531395d188a0811711d82a328` through STEP 11.8.

## STEP 11 — Party quests — IN PROGRESS

### STEP 11.1 — Repository foundation — COMPLETE
- [x] Canonical household path and HouseholdContext lifecycle protection.
- [x] Checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`; CI `33019925699` SUCCESS.

### STEP 11.2 — Invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical PartyQuestService + repository authority.
- [x] Transactional ownership/eligibility and occurrence-versioned reinvites.
- [x] Real-device invite/accept PASS.
- [x] Checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`; CI `33021739099` SUCCESS.

### STEP 11.3 — Leave + ActiveView — IMPLEMENTATION/CONTRACT COMPLETE
- [x] `left` semantics, deterministic status recompute and repository/service-backed ActiveView.
- [x] Checkpoint `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`; CI `33024009131` SUCCESS.
- [ ] Real-device participant leave smoke pending; bundle into STEP 11.9 acceptance sweep.

### STEP 11.4 — Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE PARTIAL PASS
- [x] Targeted + household help, eligibility/retraction/idempotency and help UI.
- [x] Real-device targeted-send PASS.
- [ ] Recipient accept/decline and household-broadcast device checks pending; bundle into STEP 11.9.
- [x] Checkpoint `51256b2506625f7421273d87d0c0f654fdbc432b`; CI `33044211179` SUCCESS.

### Party Quest UX patch — COMPLETE + REAL-DEVICE PASS
- [x] Multi-start, Arcana icons, canonical task-create handoff and **Later beslissen** all real-device PASS.
- [x] Latest checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`; CI `33052149328` SUCCESS.

### STEP 11.5 — Canonical completion + durable exactly-once rewards — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE 2/3 PASS
- [x] Linked canonical Task is the only completion trigger; manual stop remains cancellation.
- [x] Trusted Firebase Task projection required for completion.
- [x] Deterministic participant snapshot and reward occurrence.
- [x] Frozen `ProgressionStore.awardOnce()` remains XP authority.
- [x] Later-login settlement and stale-context rejection implemented.
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS.
- [x] Device Tests 1/2 PASS.
- [ ] No-second-XP reload observation remains a high-risk idempotency gate; verify during STEP 11.9.

### STEP 11.6 — Notification event extensions — COMPLETE + REAL-DEVICE ACCEPTED
- [x] Ordinary involved-task notification + combined Party Quest completion/XP notification.
- [x] Causal attribution, self-suppression, duplicate suppression and deterministic canonical event identity.
- [x] Checkpoint `b067fc74931e058b9aa2507d5564501e77575114`.
- [x] CI `33124463794` SUCCESS; Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9` READY.
- [x] Real-device Tests 1/2/3 PASS; accepted 2026-08-29.

### STEP 11.7 — Compatibility / legacy guard — COMPLETE
- [x] Product owner explicitly approved **GO STEP 11.7** on 2026-08-29.
- [x] Audited dormant legacy Party Quest prototype files and current served runtime.
- [x] Added `scripts/test-party-quest-step11-7.js` to quarantine legacy name/localStorage/old-XP authority from served runtime and canonical Party Quest modules.
- [x] Guard rejects old localStorage keys, `GroupQuests`/editor/premium dependencies, hardcoded legacy member identities and direct legacy `awardXP` calls in canonical Party Quest modules.
- [x] No automatic migration from legacy display names to canonical Firebase/Auth UIDs.
- [x] Frozen `PartyQuestInvites` facade remains compatible with NotificationActions via `getById`, `revokeInvite`, `respond`; mutations remain PartyQuestService-owned.
- [x] `duoQuests.js` is explicitly preserved as current separate task UX and is not confused with the dormant `groupQuests.js` prototype.
- [x] Code/contract checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`.
- [x] Full CI run `33273125677`: SUCCESS.

### STEP 11.8 — Integrated CI + Preview candidate — COMPLETE
- [x] Product owner explicitly approved **GO STEP 11.8** on 2026-08-29.
- [x] Added `scripts/test-party-quest-step11-8-integration.js` as a final integration contract against the real `api/app.js` rendered shell.
- [x] Repository, Service, ActiveView, HelpUi, CompletionReward, Invites and NotificationProjector are all present exactly once in the served runtime.
- [x] HouseholdContext, Task repository, Progression and Notification authorities are singular and retain the required bootstrap ordering.
- [x] Dormant `groupQuests` prototype scripts are absent while current `duoQuests.js` is retained once.
- [x] Frozen NotificationActions exact blob remains `60a48daa628bc56531395d188a0811711d82a328`.
- [x] Integrated checkpoint `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- [x] Full rebuild CI run `33273749600`: SUCCESS; STEP 11.8 integrated served-runtime candidate PASS plus prior STEP 11, frozen STEP 9/10, auth/startup and general rebuild contracts PASS.
- [x] GitHub status checks for Vercel and Household Rebuild Contracts both SUCCESS on the same checkpoint.
- [x] Vercel Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq`: READY, target Preview, commit `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- [x] Candidate URL `https://verhoog-family-569s2vs54-cverhoog-techs-projects.vercel.app` returns HTTP 200 with expected served shell.
- [x] Preview error/fatal runtime-log scan found no entries for the candidate deployment.

### STEP 11.9 — Bundled real-iPhone acceptance sweep — NOT STARTED
- [ ] Explicit product-owner approval required.
- [ ] Validate the remaining high-value Party Quest device paths against the exact STEP 11.8 Preview candidate and close STEP 11 only after accepted evidence.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Google login post-auth handoff/startup follow-up remains open pending real-device resolution.

## Running product/fix backlog
**Open main items: 7** — see `docs/FAMILYAPP-FIX-LIST.md`.

## Later roadmap phases
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate.
- [ ] STEP 17 — Store distribution readiness.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Tasks, Progression and Notifications remain canonical authorities.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Accelerated validation mode: bundle non-critical device checks; keep high-risk/destructive/security/auth/idempotency/release-blocking checks explicit.
- Every meaningful update synchronizes current TODO, this tracker and update log.
