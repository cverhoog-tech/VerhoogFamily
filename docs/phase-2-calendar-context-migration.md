# Phase 2 — Calendar HouseholdContext migration

Date: 2026-08-15

## Goal
Make Agenda household-safe without replacing the existing calendar UI. Firebase/FamilyDataStore remains the source of truth; legacy UI modules only render/project state.

## Implemented

### CalendarSharedLive v2
- Removed `fbUser` / `fbFamilyId` as identity authority.
- Every bind captures `{uid, householdId}` from `HouseholdContext`.
- Shared realtime subscription retains an unsubscribe handle.
- Household/account change calls `stop()` and binds a fresh subscription.
- Stale callbacks are ignored after a context switch.
- Writes reject with `CALENDAR_CONTEXT_CHANGED` when their captured context is no longer current.
- New records carry `createdBy`, `updatedBy`, `householdId` and `attendeeUids`.
- Local `calData` remains a renderer/cache projection, not the authoritative store.
- Legacy `families/{householdId}/cal` is migration-only fallback and is never ongoing authority.

### Google Calendar sync v1.1
- Uses `HouseholdContext` instead of direct auth globals.
- Per-user Google preference key remains UID-scoped.
- Local mutation events must match both `userId` and `familyId`.
- Delayed Google API responses are ignored after account/household switches.
- Mapping writes use the same captured UID and are persisted through `CalendarSharedLive.save()`.
- Pending sync timers are cancelled on context/session changes.

### Meal plan integration
`calendarMealPlanIntegration.js` remains read-only. MealPlanStore stays the source of truth and Agenda only projects planned meals visually. It does not write calendar records.

### Runtime cache safety
`calendar.js` now loads:
- `calendarSharedLive.js?v=3`
- `calendarGoogleSync.js?v=2`

## Automated evidence
- `tests/calendar-context-rebind.test.js`
  - Alpha subscription binds.
  - Alpha subscription detaches on Alpha -> Beta switch.
  - stale Alpha callback cannot project into Beta.
  - Beta save carries Beta `updatedBy` and `householdId`.
- `tests/calendar-context-adoption.test.js`
  - no direct `fbUser` / `fbFamilyId` authority in the shared live layer.
  - Google sync uses HouseholdContext and validates mutation context.
  - meal-plan calendar integration remains read-only.

GitHub Actions run: `31904904965`.

## Remaining release gates
- Real-device create/edit/delete on two household members.
- Refresh/reopen and offline/reconnect on iPhone/PWA.
- External Google Calendar OAuth and sync acceptance on a real account.
- Three-household live isolation acceptance remains part of the global release gate.

Agenda remains 🟡 until those live/device gates are completed; automated architectural hardening is complete for this tranche.
