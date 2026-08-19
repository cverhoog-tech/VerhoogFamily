# Household Rebuild v2 Roadmap

Branch: `agent/household-rebuild-v2`
Baseline main SHA: `997eb0710f512857a3280e776ab38988a7ee5a86`

## Guardrails

- Main remains untouched until explicit approval.
- No production deploy without explicit approval.
- No Firebase production Rules deploy without explicit approval.
- `agent/household-context-foundation` is reference material, not a merge source.
- One canonical auth owner, one authenticated-session bootstrap, one app-reveal pipeline.
- Household data is scoped by `householdId` and `uid` where relevant.
- Firebase is the intended source of truth for shared household data.
- Every realtime subscription must have explicit cleanup/unsubscribe.
- Household switches must not leave stale listeners or stale writes behind.
- Device gate after every functional phase: Vercel branch preview + real iPhone Safari smoke test before continuing.

## Device gate after every functional phase

1. Syntax/static checks.
2. Existing relevant tests.
3. New contract/regression tests.
4. Vercel branch preview.
5. Real iPhone Safari smoke test:
   - cold load;
   - Google login when auth/startup changed;
   - automatic existing session;
   - Home immediately usable;
   - multiple button interactions;
   - navigate between modules;
   - reload;
   - background -> foreground;
   - second reload;
   - no freeze;
   - no white screen;
   - no Safari/WebKit crash.

No next functional phase until the device gate is approved.

## Platform administration and privacy model

Platform administration is separate from household membership/household roles.

### Platform identity

- Platform admin access is tied to an explicit authenticated UID/account, not to a name/email string in client code.
- Platform roles are separate from household roles such as owner/admin/adult/child.
- The client must never be able to self-promote to platform admin.
- Server-verifiable claims / a protected platform-admin registry are the intended authority.
- Admin actions require explicit authorization checks and audit logging.

### Privacy principle

Default platform monitoring uses operational metadata and aggregate health signals, not household content.

Allowed by default examples:
- household technical identifier;
- member count;
- account/household creation date;
- last successful sync / last app activity timestamp where needed for service health;
- app/runtime version;
- active/inactive health state;
- Firebase permission errors;
- sync/rebind failures;
- startup/auth failures;
- crash/error counts;
- module health counters;
- notification delivery health;
- storage/database usage metrics where useful;
- migration/schema version;
- anonymized/aggregated feature usage where deliberately instrumented.

Not visible by default to platform admin:
- task titles/descriptions;
- shopping item names;
- recipes or ingredients;
- meal contents;
- calendar event titles/descriptions;
- financial transaction descriptions/amount details unless a narrowly defined support flow explicitly requires it;
- feed/post content;
- private notes;
- personal messages or other household content.

### Support access

If content-level support access is ever required, it must be a separate explicit mechanism rather than normal admin monitoring:
- household/user consent;
- narrowly scoped purpose;
- time-limited access where practical;
- visible audit entry;
- minimum necessary fields only;
- easy revocation;
- no silent unrestricted browsing of household content.

### Auditability

Platform admin operations should record:
- admin UID;
- action type;
- target household ID where applicable;
- timestamp;
- purpose/reason for sensitive support actions;
- no copied private household payload in the audit record.

## Rebuild phases

### STEP 0 - Stable baseline

- Lock baseline at current main SHA.
- Create rebuild branch from exact baseline.
- Baseline syntax/static tests.
- Baseline branch preview.
- Baseline iPhone Safari smoke test.

### STEP 1 - Authenticated session / startup ownership

Build one canonical `AuthenticatedSessionController` responsible for:
- Firebase auth-state ownership;
- authenticated-session bootstrap;
- household resolution orchestration;
- first-render/app-reveal state;
- generation/stale-bootstrap protection;
- visible recoverable failure state;
- deterministic cleanup on sign-out/account switch.

Remove the legacy localStorage-driven app reveal when the new controller becomes active.

Do not introduce multiple bootstrap/auth/lifecycle owners.

### STEP 2 - HouseholdContext / UID identity / lifecycle contract

- Read-only canonical session/household context.
- `uid`, `householdId`, active member metadata.
- `capture()` / `isCurrent()` stale-context protection.
- Shared/private path helpers.
- Explicit subscription + unsubscribe contract.
- Household switch/rebind semantics.
- No independent Firebase auth ownership in HouseholdContext.

### STEP 2A - Platform admin identity foundation

Introduce the platform-admin security boundary without building the full dashboard yet:
- platform role separate from household role;
- admin authority bound to the owner's authenticated personal UID via server-verifiable authorization;
- no client self-elevation;
- platform permission helper/API contract;
- audit-event contract for admin actions;
- privacy classification defining operational metadata vs household content;
- tests proving a normal household admin is not a platform admin;
- tests proving platform status never grants implicit household-content read access.

This phase must not make startup dependent on the admin subsystem. A platform-admin session is still an ordinary authenticated FamilyApp session plus optional platform capabilities.

### STEP 3 - Tasks core

- Household-scoped task repository.
- UID identity.
- Explicit realtime bind/unbind.
- Mutations through repository boundary.
- Current working UI retained.

### STEP 4 - Recipes

- Shared Firebase source of truth.
- Create/edit/delete realtime.
- Household switch/rebind.
- Listener cleanup.

### STEP 5 - Meals

- Household-bound MealPlanStore.
- Stable recipe references.
- Realtime sync/rebind.

### STEP 6 - Agenda

- Household-scoped calendar source of truth.
- Explicit rebind and cleanup.
- Meal-plan integration only after Meals is stable.

### STEP 7 - Shopping

- Keep current main grocery-add behavior/freeze fix as baseline.
- Household realtime shopping repository.
- Recipe/meal projection to shopping after core sync is stable.

### STEP 8 - Finance

- Explicit shared-vs-private data classification.
- Household-scoped finance state where appropriate.
- Transaction synchronization.
- Reset semantics.

### STEP 9 - Progression / XP / achievements

- Canonical UID progression store.
- Idempotent reward mutations.
- Achievement projection.
- Legacy XP state no longer authoritative.

### STEP 10 - Notifications

- Canonical household notification store.
- Per-UID read/dismiss state.
- Domain-event projection.
- One household listener with cleanup.
- Push delivery kept separate from notification state.

### STEP 11 - Party quests

Migrate after Tasks + Progression + Notifications are stable:
- invites;
- join/leave;
- help requests;
- completion;
- rewards;
- notifications;
- idempotency.

### STEP 12 - Profile / presence / avatars

- UID-based profile identity.
- Household-member presentation.
- Avatar sync/cache.
- Exactly one presence binding per active session/context.
- Safe household switch cleanup.

### STEP 13 - Activity / feed

- Immutable household activity events.
- Domain producers.
- Dedupe/idempotency.
- Feed presentation.
- Realtime interaction state where appropriate.

### STEP 14 - Search / autocomplete

- Search index scoped to current household.
- Clear/rebuild on context switch.
- No stale data from previous households.

### STEP 14A - Platform operations dashboard

Build the actual owner/admin platform after module data contracts are stable enough to expose health metrics safely.

Dashboard goals:
- list households by opaque/technical ID and optional display label only where justified;
- service-health status per household;
- member count and schema/migration state;
- last sync/health timestamps;
- auth/startup/runtime error summaries;
- module-level sync health;
- notification-delivery health;
- aggregate usage/operational metrics that were intentionally instrumented;
- support-case/audit view.

Privacy requirements:
- dashboard APIs expose a dedicated sanitized admin projection, never raw household roots;
- operational metrics are calculated/stored separately from content where practical;
- no generic `read any family path` permission for platform admins;
- private/content fields are absent from the normal admin response, not merely hidden in UI;
- content-level support access, if ever added, uses explicit consent and a separate audited capability.

### STEP 15 - Firebase Rules hardening

Only after canonical client paths are stable:
- shared collection allowlist;
- notification rules;
- append-only activity rules;
- FCM token rules;
- owner immutability;
- removed-member matrix;
- storage path audit;
- platform-admin rules limited to dedicated sanitized platform/operations data rather than unrestricted household content.

Emulator/tests first. No production Rules deploy without explicit approval.

### STEP 16 - Legacy cleanup

- Retire my/partner authorities.
- Remove unused bridges/stores/listeners.
- Remove guest-mode remnants.
- Consolidate runtime wiring.
- Remove deprecated duplicate assets/code after proving they are unused.
- Simplify fragile `api/app.js` string-injection wiring when safe.

## Admin architecture decision

The owner/platform-admin capability must be orthogonal to household membership:

`Firebase authenticated user -> SessionContext -> optional PlatformCapabilities`

and separately:

`SessionContext -> active HouseholdContext -> household role/capabilities`

A platform admin therefore does not automatically become a member of or gain raw content access to every household.

The normal monitoring path is:

`household/runtime -> sanitized operational telemetry -> platform operations store/API -> owner dashboard`

not:

`owner dashboard -> unrestricted read of families/{householdId}`.
