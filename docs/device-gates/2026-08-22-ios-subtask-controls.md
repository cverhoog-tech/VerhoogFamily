# iPhone device gate — subtask controls

Date: 2026-08-22
Branch: `agent/household-rebuild-v2`

Accepted on a real iPhone by the product owner after the STEP 2B.6/STEP 3 follow-up polish.

Verified presentation:
- editable subtask icon slot renders as a true circle on iOS Safari/PWA;
- completed subtask checkbox remains circular;
- completed-state checkmark is clearly visible with sufficient contrast;
- selected subtask emoji remains centered in the circular icon slot.

Implementation commits leading to the accepted gate:
- `af575ae26715c27aff06560b10ab2bdbfbd73632` — harden iOS subtask control geometry and checkmark contrast;
- `602b8645e19b7ddf99f51ab45fee4bf444d942ef` — bump task detail control stylesheet cache version;
- `912a550c08780402f235a33816efef07619d6d4b` — regression contract for iOS subtask control geometry.

At acceptance, Household Rebuild Contracts and the Vercel preview were green. No merge to `main` and no production deployment were performed as part of this fix.
