# STEP 6 Agenda — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: accepted on real iPhone/PWA on 2026-08-23
Accepted preview: `https://verhoog-family-rnbmapd5x-cverhoog-techs-projects.vercel.app`
Accepted branch HEAD: `580489cb4f0cbe5ab6e5b3ef045e4e82ab7306a0`

## Acceptance result

The product owner confirmed on a real iPhone/PWA that the hardened STEP 6 Agenda add flow works correctly.

Verified behavior:
- selecting a day in Agenda and opening `+ Toevoegen` pre-fills that selected date in the appointment sheet;
- the visible `Toevoegen` button successfully creates the appointment;
- the add sheet no longer becomes inert because of competing add-sheet wrappers;
- the accepted runtime keeps `CalendarSharedLive` as the final owner of Agenda add/edit/save/delete interactions;
- the primary Agenda add/save button is bound directly to the canonical submit path;
- the submit button is reset after both success and failure;
- calendar bootstrap and facade cache versions were bumped for iPhone/PWA clients.

## Accepted architecture

- canonical source: `families/{householdId}/calendarEvents`;
- identity authority: `HouseholdContext`;
- exact realtime listener teardown on context change;
- stale callback rejection after account/household switches;
- only same-household Firebase legacy paths may be reconciled;
- local/AppState calendar data is never migration authority;
- Meals remain a virtual Agenda projection and are not duplicated as normal calendar records;
- Google Calendar integration remains downstream of the canonical local-mutation contract.

## Regression coverage

The rebuild suite covers:
- cross-household A → B switching;
- stale A callback rejection after B is active;
- isolated create/edit/delete;
- immutable household/creator/schema fields;
- UID + household scoped cache;
- selected-day → open sheet → date prefill → tap primary button → canonical create flow;
- button reset on success and failure;
- canonical Agenda ownership over legacy family-root sync.

Household Rebuild Contracts and Vercel were green on the accepted branch HEAD. No merge to `main`, production deployment or production Firebase Rules deployment was performed.
