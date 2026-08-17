# Phase 16 — Search / autocomplete / AI context migration

Status: 🟡 architecture and automated isolation implemented; live browser/device/multi-household acceptance remains deferred.

## Goal

Search, autocomplete and future AI features must never become an alternate data-access layer. They may only consume data that has already been resolved by a canonical UID/household-bound domain service.

## SearchContextService

`src/core/searchContextService.js` is the central read-only boundary.

It captures the current `HouseholdContext` token `{ uid, householdId }`, validates every contributing service against that same context, and rejects stale continuation with `SEARCH_CONTEXT_CHANGED`.

It never reads Firebase directly and owns no persistence.

Current searchable sources:

- household tasks via `TaskSharedData`
- household recipes via `RecipeStore`
- current user's accessible shopping lists via `ShoppingLists`
- household calendar via `CalendarSharedLive`

The global search UI in `src/core/search.js` is now only a presentation/navigation facade over this service. Search-result strings are HTML-escaped before rendering.

## Autocomplete

Static vocabularies such as grocery names and ingredient examples remain safe application data.

Household-derived history is no longer read directly from `shopData` or `recipesData`. `autocompleteContextBridge.js` asks `SearchContextService` for history-backed suggestions. When context-bound services are unavailable or still rebinding, autocomplete falls back to static vocabulary only rather than stale household globals.

## AI context contract

Any future AI feature should call `SearchContextService.buildAiContext()` rather than scraping globals or Firebase paths.

The builder has an explicit allowlist:

- `tasks`
- `recipes`
- `calendar`
- `shopping`
- `members`

Every payload includes its source scope:

```js
{
  scope: {
    uid,
    householdId
  }
}
```

The following are deliberately excluded by default and cannot be requested through the current allowlist:

- finance data
- notes
- notification contents
- private progression
- drafts
- arbitrary Firebase paths

This is a data-minimisation boundary, not just a UI convention.

## Notes are intentionally excluded

The existing notes runtime still uses legacy mutable `noteData` and name-based author state. Although `notes` exists in `FamilyDataContract`, there is not yet a hardened context-bound notes service that can prove household/private scope.

For that reason Phase 16 removes Notes from global Search and AI context rather than treating an unsafe projection as canonical. Notes can be reintroduced once their persistence/runtime is migrated to the same UID/household contract.

## Account/household switching

A source contributes data only when its own status reports the same UID and householdId as current `HouseholdContext`. During an Alpha → Beta switch, stale Alpha service snapshots therefore produce no search/history/AI results. Once Beta services rebind, only Beta data becomes visible.

## Automated proof

- `tests/search-context-rebind.test.js`
  - Alpha search and AI context
  - context switch while services are still Alpha
  - stale Alpha results rejected
  - Beta rebind exposes only Beta data
  - private shopping history stays current-UID scoped
  - excluded AI categories are ignored

- `tests/search-context-adoption.test.js`
  - no raw Firebase or legacy identity authority in SearchContextService
  - global Search no longer reads domain globals directly
  - autocomplete bridge no longer reads shopping/recipe globals directly
  - explicit AI allowlist and Notes exclusion
  - required runtime loader ordering

CI workflow: `.github/workflows/search-context-contract.yml`.

## Deferred acceptance gates

Before marking this phase ✅:

1. switch between real accounts/households while Search is open and verify no previous-household flash;
2. verify shopping and recipe autocomplete on two devices;
3. exercise search with three isolated live households;
4. when an actual AI-backed feature is introduced, verify the server/API boundary also accepts only the scoped allowlisted context rather than client-supplied arbitrary household data;
5. reintroduce Notes only after a hardened Notes service exists.
