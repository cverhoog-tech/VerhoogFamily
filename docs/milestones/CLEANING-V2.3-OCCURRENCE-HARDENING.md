# Cleaning V2.3 — Occurrence adjustment & hardening

Status: **GREEN RUNTIME CANDIDATE — REAL-DEVICE ACCEPTANCE REQUIRED**

## Runtime candidate
- SHA: `c1f152e26f4efbde2cb0df8be4fc32a986eedc73`
- CI: Household Rebuild Contract Tests run `34595267730` — SUCCESS
- Immutable preview: `https://verhoog-family-9yxvuexwq-cverhoog-techs-projects.vercel.app`
- Branch: `agent/household-rebuild-v2`
- `main` was not modified.

## Scope
V2.3 adds contextual controls to the existing concrete Cleaning turn detail sheet:
- Later deze week
- Ander moment / persoon
- Doorschuiven of overslaan when a turn is incomplete
- Manual date, time and assignee changes
- Projection synchronization to existing Task/Calendar projections
- Completion/exception logging for skipped/carried-forward turns

## Architecture preserved
- `CleaningOccurrence` remains canonical.
- Existing Cleaning V2 repository is reused.
- Existing Cleaning V2 detail sheet remains the only popup owner.
- No second raw Firebase `value` listener.
- No MutationObserver.
- No document-wide click owner.
- No polling/interval runtime.
- No generic TaskDetailPopup.
- Accepted primary `cleaningScreen.js` remains version `2.0.0` and was not modified for V2.3.
- Accepted V2.2.1 visual bridge marker remains `2.2.1`; V2.3 companions expose their own `2.3.0` versions.

## Safety / consistency hardening
- HouseholdContext capture/isCurrent guard around writes.
- Household-id conflict guard.
- Archived-room guard.
- Pending collaboration guard prevents schedule/assignee mutation while handoff/help is unresolved.
- Firebase transaction around canonical occurrence mutation.
- Per-occurrence busy guard against duplicate taps.
- `v23Revision` increments on canonical mutations.
- Active-member validation for manual reassignment.
- Projection sync after canonical mutation, never the reverse.

## Real-device acceptance gate
Test on iPhone using the immutable runtime candidate:
1. Open an incomplete Cleaning turn.
2. `Later deze week` moves the turn and projections without duplicate entries.
3. `Ander moment / persoon` changes date/time/assignee and the change survives reopening.
4. `Doorschuiven` closes the current incomplete turn and records the exception/history.
5. `Deze keer overslaan` closes the current turn without marking it completed.
6. With an open transfer/help request, V2.3 mutation controls are blocked until collaboration resolves.
7. Rapid double taps do not create duplicate writes/history.
8. Switching account/household does not leak or apply a stale write.
9. Cleaning remains smooth on iPhone and the existing supplies/collaboration/history UI still works.
10. Light/dark UI remains readable.

Do not promote this milestone to `main` until explicit real-device acceptance.