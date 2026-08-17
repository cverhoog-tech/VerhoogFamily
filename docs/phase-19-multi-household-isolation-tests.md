# Phase 19 — Automated multi-household isolation tests

Status: 🟡 automated isolation substantially proven; real-device and live three-household acceptance remains deferred.

## Goal

Prove that the current architecture can support multiple independent households without data leakage when users sign in, switch household context, reconnect after offline work, or receive realtime updates.

The automated target is stricter than a two-user happy path: at least three unrelated household identities must remain isolated across both client persistence and Firebase authorization.

## Three-household identities

The Phase 19 contract uses three independent pairs:

- `alpha-user` / `alpha-household`
- `beta-user` / `beta-household`
- `gamma-user` / `gamma-household`

No pair shares membership with another household.

## Client persistence isolation

`tests/family-data-store-three-household-switch.test.js` proves that:

- the same record IDs may exist independently in all three households;
- shared pending writes retain both UID and householdId ownership;
- private pending writes retain UID ownership;
- reconnecting Beta cannot flush Alpha or Gamma writes;
- reconnecting Gamma cannot flush Alpha or Beta writes;
- each original context must flush its own queue;
- the queue is only empty after all three contexts have flushed themselves.

This extends the existing two-context `family-data-store-pending-context.test.js` regression.

## Firebase authorization matrix

`tests/database-rules-three-household-matrix.test.mjs` creates all three households in the Realtime Database emulator and checks every canonical member-shared collection currently granted general household-member access:

- tasks
- partyQuests
- shoppingLists
- recipes
- mealPlans
- calendar
- finance
- feed
- achievements
- notes

It also checks:

- members
- presence
- activity
- notifications
- private user preferences
- unknown shared collections
- direct family-root reads

For each authenticated household identity the test proves:

1. own household reads succeed;
2. own canonical shared writes succeed where the current product contract permits member writes;
3. every equivalent read/write against the other two households fails;
4. another UID's private data is inaccessible;
5. family-root reads remain denied so child-level rules cannot be bypassed;
6. unknown shared collections remain denied.

## Realtime and context-switch regression gate

`.github/workflows/multi-household-isolation.yml` groups the critical context/rebind contracts into one dedicated CI gate:

- HouseholdContext
- pending writes
- Tasks
- Shopping
- Calendar
- Recipes
- Meal Planning
- Activity
- Feed
- Notifications
- Finance
- Progression
- Profile / Presence
- three-household RTDB matrix

The purpose is not to replace module-specific CI. It gives the project one explicit multi-household safety signal for changes that touch shared runtime or persistence.

## Why Phase 19 remains yellow

Automated evidence can prove deterministic isolation contracts, but it cannot fully replace live lifecycle acceptance. Before Phase 19 becomes ✅ we still require:

- three real independent Firebase households;
- account switching on actual browser sessions;
- iPhone Safari/PWA lifecycle validation;
- offline/reconnect behavior on real devices;
- confirmation that deployed production Firebase rules match the audited repository rules;
- removal or explicit retirement of remaining legacy runtime paths that are only covered indirectly by compatibility guards.

## Production interpretation

A green Phase 19 workflow means a change has not violated the known automated multi-household contract. It does not by itself certify the entire release for production; the real-device/live gates remain part of the final release definition.
