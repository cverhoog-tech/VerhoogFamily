# FamilyApp — Multi-family prototype acceptance contract

Date: 2026-08-22
Branch: `agent/household-rebuild-v2`

## Product end goal

The household rebuild is not complete when one family works well. A core end goal of this prototype is that **multiple independent families can use FamilyApp safely at the same time**, while the product owner has a **personal platform-admin capability** for diagnostics and beta operations that does not grant unrestricted access to private household content.

This is a cross-cutting acceptance gate for the rebuild and sits alongside the existing UI, architecture and future store-readiness goals.

## A. Multi-family ready prototype

The prototype is considered multi-family ready only when:

- every authenticated user is identified by Firebase UID;
- every shared domain record is scoped to exactly one `householdId`;
- user-private records are UID-scoped;
- two or more households can use the same module concurrently without seeing or overwriting each other's data;
- account switching on one device cannot expose cached state from the previous account;
- logout removes/rebinds realtime listeners and sensitive runtime state deterministically;
- household switching/reconnect cannot flush pending writes into the wrong household;
- removed members lose read/write access according to Firebase Rules;
- invites can only join the intended household and cannot be reused outside their lifecycle rules;
- core modules use household/UID-aware repositories or services rather than global/single-family authority;
- negative cross-household security tests exist for every sensitive module;
- refresh, reconnect and real-device tests prove household isolation in normal usage.

### Minimum prototype acceptance test

Before calling the prototype multi-family ready, test at least three independent households (Alpha, Beta, Gamma) with separate accounts. The test must prove:

1. Alpha users only see Alpha household data.
2. Beta users only see Beta household data.
3. Gamma remains isolated from both.
4. Account switch on the same device leaves no visible stale data.
5. Logout/login and reload retain the correct household context.
6. Offline/reconnect does not write data into another household.
7. A removed member is denied access.
8. Core flows continue to work on the real iPhone/PWA build.

## B. Personal platform-admin capability

The product owner must have a platform-admin role tied to their **personal authenticated UID** through a server-verifiable authorization source such as protected admin registry/custom claims.

Rules:

- platform admin is separate from household owner/admin roles;
- no name or email string in frontend code may grant admin access;
- a normal household owner can never self-promote to platform admin;
- platform admin does not automatically become a member of every household;
- platform admin does not get a generic `read families/{householdId}` capability;
- every privileged admin action is authorized server-side and auditable.

## C. What the admin may see by default

The admin dashboard may expose **sanitized operational/diagnostic data** that helps find and fix bugs, for example:

- opaque household technical ID;
- optional non-sensitive household display label where justified;
- member count;
- household/account creation timestamps;
- last successful app activity / sync timestamp;
- current app/runtime/schema/migration version;
- browser/device/PWA context needed to reproduce technical issues;
- startup/auth errors and error codes;
- Firebase permission errors;
- listener/rebind failures;
- failed/pending write counts and sanitized failure metadata;
- module health status (`healthy`, `attention`, `broken`);
- notification delivery health;
- storage/database usage metrics where useful;
- feature-flag / beta-cohort state;
- crash/error fingerprints and timestamps;
- intentionally instrumented aggregate feature-usage metrics.

Diagnostic telemetry should contain identifiers and technical context only to the extent required to troubleshoot the product.

## D. What the admin must NOT see by default

The normal admin dashboard must not expose raw household content such as:

- task titles, descriptions or checklist text;
- shopping item names;
- recipes, ingredients or meal content;
- calendar titles/descriptions;
- feed/post/comment text;
- private notes or messages;
- financial transaction descriptions or detailed amounts;
- uploaded household photos/files;
- other private household content not required for operational health.

These fields must be absent from the normal admin API/projection, not merely hidden with CSS.

## E. Privacy-safe support mode

If a bug genuinely cannot be diagnosed from sanitized telemetry, any future content-level support access must be a separate support mechanism with:

- explicit household/user consent;
- a specific support reason/case;
- minimum necessary scope (specific module/record/fields);
- read-only access by default;
- time-limited access where practical;
- visible audit logging;
- easy revocation;
- no unrestricted household browsing.

For the first multi-family prototype, sanitized diagnostics are the default and preferred path. Content access is not a prerequisite unless a concrete debugging case proves it necessary.

## F. Admin dashboard v1 acceptance scope

A useful privacy-safe first admin console should provide:

1. platform overview: number of households/users and beta health;
2. household list: technical ID, member count, createdAt, last activity, health;
3. household technical detail: app/schema version, module health, sync/error summaries, device/browser context;
4. error/support timeline with sanitized error codes and timestamps;
5. beta cohort / feature flag visibility;
6. audit log for privileged admin actions;
7. no raw household-content browser.

## G. Data minimization / retention

Before broader beta use:

- every telemetry field must have a documented debugging/operations purpose;
- avoid storing payload/content when an error code, entity type/id and technical context are enough;
- define limited retention for diagnostic data;
- do not copy private household content into logs or audit records;
- separate operational telemetry from household-domain data;
- privacy disclosures should accurately describe collected operational data before external rollout.

## H. Roadmap integration

This acceptance contract affects several existing steps:

- **STEP 2A** — build the personal platform-admin identity/security foundation.
- **STEP 3–14** — make every core module genuinely household/UID scoped with clean lifecycle/rebind behavior.
- **STEP 14A** — build the sanitized platform operations/admin dashboard described above.
- **STEP 15** — prove Firebase/Storage rules enforce household isolation and admin privacy boundaries.
- **STEP 16** — remove legacy single-family/global authorities that could bypass those boundaries.
- **Cross-cutting** — add multi-household isolation/lifecycle tests as modules are completed rather than waiting until the end.

## Final prototype gate

The household rebuild prototype is only ready for a broader family beta when both are true:

1. **Multi-family isolation:** multiple independent families can use the app concurrently without cross-household state, access or write leakage.
2. **Privacy-safe owner operations:** the personal platform admin can diagnose household/app health using sanitized operational data without unrestricted access to private family content.
