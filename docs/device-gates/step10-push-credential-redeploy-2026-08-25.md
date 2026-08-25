# STEP 10 push credential redeploy checkpoint

Date: 2026-08-25
Branch: `agent/household-rebuild-v2`

Purpose: trigger a fresh Vercel Preview deployment after the Firebase Admin SDK service-account Preview environment variables were replaced by the product owner.

No secret values are stored in this repository. This checkpoint does not change runtime behavior.

Second credential refresh confirmed by the product owner after re-copying `client_email` and the complete `private_key` from the same newly generated Firebase Admin SDK JSON and verifying project ID `verhoog-family`.

Acceptance remains open until a real background/closed-PWA push reaches the iPhone and the remaining STEP 10 device gates pass.
