# Phase 21 — Observability & external beta gate

Status: 🟡 automated observability foundation complete; external beta acceptance remains live-only.

## Implemented

- Provider-independent `FamilyObservability` client layer.
- In-memory bounded diagnostic ring buffer; no persistent telemetry store by default.
- Automatic capture of uncaught errors, unhandled rejections, online/offline, focus/blur, page lifecycle, visibility changes, household context changes, session clears and auth bootstrap transitions.
- UID and household IDs are hashed before entering diagnostics.
- Explicit redaction/omission of names, email, phone, address, message bodies, free-form notes, ingredients, media URLs/tokens and financial amounts/prices.
- Diagnostic snapshots expose only operational metadata needed for support: lifecycle, module/screen, error code/type, hashed context, online/visibility and auth bootstrap state.
- Loader installs observability before application/domain modules so startup failures can be captured.
- Dedicated CI privacy contract prevents future telemetry changes from leaking sensitive family data.

## External beta release gate

Before declaring the multi-household hardening production-ready, verify on real devices/accounts:

1. Google sign-in return on iPhone Safari and installed PWA.
2. Background -> foreground and BFCache resume without blank screens.
3. Offline mutation -> reconnect flush in the original UID/household only.
4. Logout/account switch clears old household runtime state.
5. Three independent households can use the same build without cross-household reads/writes.
6. Removed members lose shared access and presence.
7. Beta diagnostics can identify the failing lifecycle/module without exposing family content or finance data.
8. Firebase Database/Storage production rules match the tested repository rules.
9. Vercel preview/production build identity is recorded during release acceptance.

## Deliberate non-goals

- No third-party telemetry provider is required for the foundation.
- No automatic upload of diagnostics is enabled yet.
- No invisible admin access to household content is introduced.
- User-submitted beta feedback transport/admin console remains part of the separate platform-admin/beta operations work.

Phase 21 remains 🟡 until the live beta/device gates above are demonstrated.