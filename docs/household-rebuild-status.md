# Household rebuild v2 — status

_Last updated: 2026-08-22_

Primary branch: `agent/household-rebuild-v2`

## Current phase

### STEP 2B.5 — Brand / app identity

Status: **mostly complete; final approved crest asset handoff still open**

Done:
- Canonical app-icon runtime exists.
- Manifest / Apple touch / favicon paths are centralized through the same-origin brand endpoint.
- Login and PWA/browser shell use the canonical brand pipeline.
- iPhone Safari PWA behavior has been exercised during this phase.

Open:
- Wire the final approved white/gold crest with the single purple diamond into the canonical brand endpoint/assets. The runtime still references the earlier v4 asset path/version.
- Final real-device Add-to-Home-Screen acceptance after that asset swap.

### STEP 2B.6A — Task category/content icons

Status: **accepted / complete**

Done:
- Canonical `TaskCategoryIcons` route is active.
- 12 task categories use the central registry/renderer.
- Detail popup no longer competes with a second category-artwork route during normal use.
- Per-category visual scaling normalizes perceived icon size.
- Compact and detail views share the same semantic category system.
- iPhone UI-scale centering fixes accepted at 100% / 120%.
- Completed-subtask checkmark centering accepted.

### STEP 2B.6B — Help / party / status icon migration

Status: **closed by product decision — keep previous presentation**

Decision:
- The attempted centralized help/status visual migration was rejected visually.
- The migration was fully reverted.
- Existing Help needed / collaboration / party/status presentation remains the approved version.
- Do not migrate these controls again unless a new visual design is explicitly approved first.

### STEP 2B.6C — Detail / create action controls

Status: **accepted / complete**

Done:
- Subtask delete uses canonical `utilityTrash` artwork.
- Task delete uses canonical `utilityTrash` artwork.
- Bookmark/save uses canonical `utilityBookmark` artwork.
- Create-task confirmation uses canonical `utilityCheck` artwork.
- Alignment contracts added for iOS/Safari and global UI scale.
- Remaining inline popup icons were audited.
- Existing close, metadata calendar, recurrence shield, completion/reopen/lock, help crest and collaboration link are deliberate exceptions because changing them would alter previously approved presentation.
- Regression contract test added in `scripts/test-task-detail-icon-contract.js` to protect these accepted boundaries.
- Live iPhone Safari smoke test accepted by product owner on 2026-08-22.

### STEP 2B.6 — Overall

Status: **accepted / frozen baseline**

Decision:
- 2B.6A accepted.
- 2B.6B closed with the previous presentation intentionally preserved.
- 2B.6C accepted after live iPhone testing.
- Treat the current task icon/detail/create presentation as a frozen baseline for the next rebuild phase.

## Next work

1. Finish STEP 2B.5 by swapping in the final approved white/gold crest with the single purple diamond.
2. Re-test login branding and Add to Home Screen on iPhone Safari.
3. Freeze STEP 2B.5 together with the already frozen STEP 2B.6 baseline.
4. Start the next household-rebuild step from that accepted baseline.

## Guardrails

- No changes to Firebase task data model during icon/UI work.
- No changes to task completion or XP semantics during icon/UI work.
- No bottom-nav or More-menu icon migration as part of this phase.
- Prefer central semantic registry/resolver paths over duplicate inline artwork when a visual migration has been approved.
- Preserve explicitly accepted legacy presentation where a migration was visually rejected.
