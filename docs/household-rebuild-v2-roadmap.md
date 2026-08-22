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
- All new architecture must remain compatible with a later iOS and Android store distribution layer; avoid web-only coupling where a platform-neutral service/domain boundary is practical.

## Prototype end goal / release gate

The household rebuild is not complete merely because one household works correctly. A core end goal of this prototype is that **multiple independent families can use FamilyApp safely at the same time**, while the product owner has a **personal platform-admin capability** for diagnostics and beta operations without unrestricted access to private household content.

The detailed acceptance contract lives in `docs/multi-family-prototype-acceptance.md` and is part of this roadmap.

### Multi-family acceptance

Before the prototype is called multi-family ready:
- every shared domain record must be scoped to exactly one `householdId`;
- every user-private record must be UID-scoped;
- account switch/logout/reconnect must not leak stale state or writes between users/households;
- removed members must lose access according to Firebase Rules;
- core modules must use household/UID-aware repository/service boundaries;
- negative cross-household tests must exist for sensitive modules;
- at least three independent test households must pass signup/join/use/logout/relogin/refresh/reconnect without data overlap.

### Personal platform-admin acceptance

Platform administration is a separate capability tied to the product owner's authenticated personal UID through server-verifiable authorization.

By default the admin may see only sanitized operational information needed to run and debug the beta, such as:
- opaque household ID and member count;
- app/runtime/schema version;
- last activity/sync timestamps;
- startup/auth/sync/permission error codes;
- listener/rebind/pending-write health;
- device/browser/PWA context needed for technical reproduction;
- module health, notification delivery health and intentionally collected aggregate usage signals.

The normal admin surface must **not** expose raw household content such as task text, shopping items, recipes, meal contents, calendar text, feed/comments, private notes, uploads or detailed financial content.

If content-level debugging is ever required, it must be a separate, consent-based, minimum-scope, audited and preferably time-limited support mechanism. Platform-admin status alone must never grant generic raw access to `families/{householdId}`.

### Cross-cutting implementation rule

Multi-family isolation and privacy-safe diagnostics are not deferred until the end. Each migrated module must add the relevant UID/household lifecycle and isolation tests as it is completed. STEP 14A then assembles the sanitized operational projection/dashboard, STEP 15 proves the security boundary, and STEP 16 removes any legacy authority that could bypass it.

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

## Store-ready architecture principle

FamilyApp remains web/PWA-first during the rebuild, but the domain/data architecture must be suitable for later distribution through the Apple App Store and Google Play without a second backend rewrite.

### Architectural separation

Keep these boundaries explicit:

`UI / platform shell -> application services -> repositories/domain -> Firebase/backend`

The web/PWA shell must not become the only place where business rules live. Authentication orchestration, household context, task mutations, notifications, progression, finance rules and other core behavior should expose platform-neutral service/repository contracts where practical.

A later iOS/Android shell may therefore reuse the same backend contracts and domain semantics, whether implemented with a native framework or a hybrid bridge.

### Native/store capabilities to preserve room for

Do not design current modules in a way that blocks later support for:
- native push notifications and device-token lifecycle;
- universal links / app links and deep-link routing;
- share sheet / platform sharing;
- camera/photo/file pickers through permission-minimized adapters;
- native badges and notification actions;
- background/foreground lifecycle handling;
- secure device credential/token storage;
- platform-specific authentication providers;
- app version / minimum-supported-version controls;
- release channels such as TestFlight/internal testing;
- optional widgets/shortcuts later, without moving domain logic into them.

### Authentication/store readiness

- The canonical authenticated-session controller remains platform-neutral at its core.
- Google Sign-In must be an authentication adapter/command, not the owner of FamilyApp startup.
- Before an iOS App Store release, login options must be reviewed against the then-current Apple Login Services rules. If Google or another third-party login is used for the primary FamilyApp account, provide an Apple-compliant equivalent login option where required.
- Account creation and account deletion must have explicit backend lifecycle semantics; deletion must not merely clear local state.
- Account deletion must account for household ownership, membership, shared data ownership, audit retention and legal/financial retention requirements before destructive deletion.
- Sign-out, revocation and account deletion are separate operations.

### Privacy and data minimization

Store readiness reinforces the platform-admin privacy model:
- collect only data required for an explicit FamilyApp purpose;
- classify shared household data, user-private data, operational telemetry and platform-admin metadata separately;
- permission prompts must be contextual and purpose-specific;
- avoid requesting broad Photos/Contacts/Location access when picker/share mechanisms can accomplish the task;
- maintain a data inventory that can later map directly to App Store privacy disclosures and Google Play Data Safety declarations;
- maintain retention/deletion rules per data category;
- analytics/telemetry SDKs are dependencies that require explicit privacy review, not invisible implementation details.

### App-like quality

A future App Store binary must not be treated as merely a website wrapped in a WebView. The native/store release should provide a deliberate app experience and native integration where it materially improves FamilyApp, while preserving the same core product and backend.

The current premium mobile UI, offline/reconnect behavior, realtime household collaboration, notifications, deep links and platform lifecycle integration should collectively form an app-like experience rather than a thin website wrapper.

### User-generated household content

Because families can create tasks, posts/feed activity, recipes, profile information and other shared content, store-readiness review must classify which areas count as user-generated/shared content and what safety controls are proportionate to the product model.

For any area that becomes open/social beyond a private household, reassess moderation/report/block requirements before release. Private-household-only behavior should remain technically separated from any future public/community features.

### Store-readiness review gate

At the end of every relevant phase, add a lightweight architecture check:
- Did this phase introduce browser-global assumptions into domain logic?
- Can the repository/service contract be called from a future native shell?
- Are permissions/data collection minimized?
- Are deep-link/push/lifecycle entry points representable without duplicating business logic?
- Does the feature have deterministic authenticated/offline/reconnect behavior?

A dedicated final store-readiness phase will still be required before submission because Apple/Google policies and SDK/OS requirements change over time.

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

Store-readiness note: keep the controller independent from Google-specific UI so Apple/other native auth adapters can enter through the same canonical session pipeline later.

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
- admin authority bound to the product owner's authenticated personal UID via server-verifiable authorization;
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
- Keep notification state independent from web-only APIs so native APNs/FCM delivery and native notification actions can be attached later.

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
- device/browser/PWA context required for technical reproduction where deliberately collected;
- aggregate usage/operational metrics that were intentionally instrumented;
- beta cohort / feature-flag state;
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

### STEP 17 - Store distribution readiness

This is a deliberate release-preparation phase, not a backend rewrite.

Re-check the then-current Apple App Store and Google Play requirements before implementation/submission.

Planned work:
- choose/validate the iOS/Android shell strategy based on the state of the product at that time;
- native signing/bundle identifiers/build pipeline;
- production-grade app icons, launch assets and store metadata;
- TestFlight / Google internal testing pipeline;
- native push registration and deep links;
- secure token/credential storage appropriate to each platform;
- native lifecycle/background integration;
- Apple-compliant login option(s) if required by the current login mix;
- in-app account deletion and complete backend deletion workflow;
- privacy policy/support/legal surfaces;
- Apple privacy disclosures and Google Play Data Safety inventory;
- permission purpose strings and permission audit;
- accessibility/device-layout review;
- crash/stability instrumentation;
- review account/demo path for store reviewers;
- store-review checklist against then-current policies;
- ensure the delivered app is sufficiently app-like and not merely a repackaged website.

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
