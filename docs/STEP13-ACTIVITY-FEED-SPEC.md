# STEP 13 — Activity / Feed

Status: approved for planning / implementation
Branch: `agent/household-rebuild-v2`
Date: 2026-08-30

## Goal

Build one reliable household activity/feed experience without replacing the existing manual social posts.

The Feed combines two deliberately different concepts:

1. **Manual posts** — user-created social content. Existing visual style and existing post/like/comment behavior remain intact.
2. **Activity events** — immutable system/domain updates produced after canonical household actions succeed.

The Feed UI may project both into one chronological timeline, but they must not become one ambiguous write model.

## Architecture contract

### Activity events

Introduce a canonical household-scoped activity-event layer.

Requirements:
- immutable household activity events;
- deterministic event/occurrence identity;
- idempotent producers so reconnects, retries or duplicate callbacks cannot create duplicate activity cards;
- domain producers run only after the corresponding canonical domain mutation succeeds;
- HouseholdContext lifecycle/stale-context protection;
- explicit realtime subscribe/unsubscribe/rebind behavior;
- no second authority for Tasks, Meals, Shopping, Recipes, Party Quests, Progression or Notifications;
- suitable for a later native iOS/Android shell through repository/service boundaries.

Initial event families should include, where meaningful:
- task completion / relevant task updates;
- meal planned;
- shopping completed / recipe ingredients added to a shopping list;
- agenda/calendar activity;
- Party Quest completion and relevant household progression updates;
- other household updates only when they provide useful Feed information.

### Manual posts

Existing manual Feed posts remain social posts and keep their current presentation and interaction model.

Do not convert ordinary manual posts into immutable activity events.

## Activity-card visual taxonomy

System/domain activity cards receive a fixed subtle pastel treatment by event family so the Feed can be scanned quickly.

Direction:
- Tasks: soft mint/green.
- Meals / recipes / meal planning: warm peach or soft orange.
- Shopping: soft yellow.
- Agenda / appointments: soft blue.
- Party Quests / achievements / XP: soft lilac.
- Generic household activity: neutral cream/soft grey.

Rules:
- color belongs to the **event type**, not the member who caused it;
- colors stay light/subtle and premium rather than saturated;
- dark mode gets deliberate muted dark equivalents with sufficient contrast; do not merely reuse light-mode backgrounds;
- manual posts retain their current styling and are visually distinct from system activity cards;
- remove/demo-proof any hardcoded Feed counters or fake activity totals before STEP 13 acceptance.

## Rich tags in manual Feed posts

Support structured references rather than name-only text parsing.

### Member tags

A post may reference one or more household members. Persist the stable UID plus presentation data required for a useful fallback.

Conceptual shape:

```js
{ type: 'member', uid, displayName }
```

The rendered tag should be recognizable and may open the relevant member/profile surface.

### Recipe tags

A post may reference a canonical recipe by stable recipe ID.

Conceptual shape:

```js
{ type: 'recipe', recipeId, title }
```

The rendered tag should be recognizable/clickable and open the recipe where practical.

Tags must survive display-name changes because identity is based on UID/recipe ID rather than only visible text.

## Interactive meal proposals

Add a Feed-native interactive proposal flow, e.g.:

> Shane stelt een maaltijd voor: Tomatensoep op dinsdag — “Zullen we dinsdag soep eten?”

A meal proposal is **not** an immutable activity event while it is awaiting a decision. It is interactive household state with its own deterministic identity and lifecycle.

The proposal should support:
- canonical recipe reference where a recipe is selected;
- proposed date/day;
- optional message;
- intended participant/audience scope where needed;
- explicit approval state;
- decline/alternative response where appropriate;
- realtime state across household devices;
- idempotent approval so repeated taps/reconnects cannot plan the meal twice.

The exact approval policy (for example one required approver versus selected household participants) must be explicit in the service contract rather than inferred by the Feed UI.

## Approved meal -> planning -> shopping flow

After the required approval is reached, FamilyApp should offer a compact confirmation/follow-up flow rather than silently mutating multiple domains.

Desired flow:

`meal proposal -> approval -> confirm planning -> optional ingredient preview -> canonical meal planning -> canonical shopping mutations -> immutable activity result`

### Planning confirmation

Offer:
- **Plan maaltijd**;
- option **Voeg ingrediënten toe aan boodschappenlijst**;
- shopping-list selection when multiple compatible lists exist.

### Ingredient preview

Before writing, show what will happen where practical:
- ingredient will be added;
- ingredient already exists and can be skipped;
- compatible existing item quantity can be increased/merged;
- user can exclude individual ingredients before confirmation.

The shopping integration must use the canonical Shopping service/repository. The Feed must not directly write shopping records.

Avoid blind duplication. Reuse the Shopping domain's normalization/category/unit behavior where available.

### Result events

Only after canonical operations succeed should immutable activity events be emitted, for example:
- `meal.planned`;
- `shopping.ingredientsAdded` when ingredients were actually added/merged.

The Feed may present these related outcomes compactly, e.g. “Tomatensoep is gepland voor dinsdag · 6 ingrediënten toegevoegd aan Weekboodschappen”, without inventing success before the underlying domains confirm it.

## STEP 13 execution plan

### STEP 13.1 — Activity repository / schema / lifecycle
- [ ] Define canonical household `activityEvents` repository and schema.
- [ ] Deterministic event IDs / occurrence keys.
- [ ] Immutable-write contract.
- [ ] HouseholdContext capture/current guards.
- [ ] Exact subscription cleanup and household rebind.
- [ ] Contract tests for isolation, lifecycle and duplicate suppression.

### STEP 13.2 — Domain producers
- [ ] Task producer(s).
- [ ] Meal producer(s).
- [ ] Shopping producer(s).
- [ ] Agenda producer(s) where useful.
- [ ] Party Quest/progression producer(s) where useful.
- [ ] Producers run after canonical success and do not become second domain authorities.
- [ ] Idempotency tests for retries/reconnects.

### STEP 13.3 — Unified Feed presentation
- [ ] Project manual `feedPosts` + immutable activity events into one chronological Feed.
- [ ] Preserve existing manual-post visuals/interactions.
- [ ] Implement pastel event-family card taxonomy + dark-mode equivalents.
- [ ] Remove hardcoded/demo Feed totals and fake counters.
- [ ] Keep event cards readable and compact on mobile.

### STEP 13.4 — Rich tagging
- [ ] Member tagging by UID.
- [ ] Recipe tagging by recipe ID.
- [ ] Tag selection UX in composer.
- [ ] Click/open behavior.
- [ ] Realtime/render behavior after member/profile/recipe changes.

### STEP 13.5 — Meal proposals + approval + shopping handoff
- [ ] Canonical interactive meal-proposal state/service.
- [ ] Proposal composer from Feed with recipe/date/message/audience.
- [ ] Approval/decline/alternative response model.
- [ ] Explicit approval policy.
- [ ] Exactly-once transition from accepted proposal to meal-planning confirmation.
- [ ] Optional “add ingredients to shopping list”.
- [ ] Shopping-list chooser when relevant.
- [ ] Ingredient preview with add/skip/merge/exclude behavior.
- [ ] Canonical Meal and Shopping services perform mutations; Feed does not bypass them.
- [ ] Successful results produce deterministic immutable activity events.

### STEP 13.6 — Interaction and compatibility contracts
- [ ] Preserve existing manual post likes/comments.
- [ ] Decide per activity/proposal type which interactions are appropriate.
- [ ] Verify avatar/member presentation uses canonical UID identity.
- [ ] Verify legacy Feed paths cannot create duplicate authority.
- [ ] Verify no duplicate proposal/action/activity on reload/reconnect.

### STEP 13.7 — Integrated acceptance
- [ ] Syntax/static checks.
- [ ] STEP 13 contract/regression tests.
- [ ] Full relevant rebuild CI.
- [ ] Vercel branch Preview.
- [ ] Bundled real-iPhone acceptance sweep.
- [ ] Two-device realtime check for Feed activity, tags and meal proposal approval.
- [ ] Explicit duplicate/idempotency check for meal approval + ingredient handoff.
- [ ] Update central TODO, progress tracker and update log before STEP 13 is closed.

## Acceptance principles

STEP 13 is not complete merely because cards render.

Acceptance requires:
- real canonical domain events, not fake/demo counters;
- no duplicate events on retries/reconnects;
- household isolation;
- clean listener lifecycle;
- existing manual posts still work as before;
- pastel event taxonomy works in light and dark mode;
- structured member and recipe tags work;
- meal proposal approval cannot schedule twice;
- ingredient handoff cannot silently duplicate shopping data;
- Feed never claims a meal or shopping mutation succeeded before its canonical service confirms success.
