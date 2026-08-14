# FamilyApp Google Calendar sync setup

FamilyApp can sync appointments created in the FamilyApp Agenda to a Google Calendar.

## Current scope

- Direction: FamilyApp -> Google Calendar.
- OAuth connection is per browser/device and per Google account.
- Only local FamilyApp create/edit/delete actions trigger Google API calls.
- Firebase realtime snapshots from another household device do not trigger Google writes.
- Meal-plan projections are not sent to Google Calendar.
- Imported ICS events are not automatically pushed to Google.

## Google Cloud setup

1. Enable the Google Calendar API in the Google Cloud project used for the OAuth client.
2. Configure the OAuth consent screen.
3. While the OAuth app is in testing, add the FamilyApp testers as OAuth test users.
4. Create or reuse a Web application OAuth 2.0 client.
5. Add this authorized redirect URI:

   `https://YOUR-FAMILYAPP-DOMAIN/api/google-calendar-callback`

For local development, add the matching localhost callback separately if needed.

## Vercel environment variables

Set these values for the environment that serves FamilyApp:

- `GOOGLE_CALENDAR_CLIENT_ID` — Google OAuth Web client ID.
- `GOOGLE_CALENDAR_CLIENT_SECRET` — matching OAuth client secret.
- `GOOGLE_CALENDAR_TOKEN_SECRET` — a long random secret used only by FamilyApp to encrypt the refresh-token cookie. Use at least 32 random bytes.
- `GOOGLE_CALENDAR_REDIRECT_URI` — optional when the deployed origin can be inferred correctly. Recommended value: `https://YOUR-FAMILYAPP-DOMAIN/api/google-calendar-callback`.

After changing Vercel environment variables, redeploy the production deployment.

## Runtime behavior

The OAuth callback exchanges Google's authorization code server-side. The Google refresh token is encrypted with AES-256-GCM and stored in a Secure, HttpOnly, SameSite=Lax cookie. It is never exposed to FamilyApp JavaScript or localStorage.

The browser stores only non-secret preferences locally:

- selected Google calendar ID/label;
- automatic-sync enabled/disabled.

Each synced FamilyApp appointment stores a per-user Google mapping in its existing shared record under `googleSync`, including `calendarId` and `eventId`. This lets later edits/deletes target the same Google event without creating duplicates.

## Acceptance test

1. Open Agenda and scroll to the Google Agenda card.
2. Choose **Google Agenda koppelen** and approve access.
3. Return to FamilyApp and choose the desired writable calendar.
4. Create a new FamilyApp appointment.
5. Confirm it appears once in Google Calendar.
6. Edit the same appointment in FamilyApp and confirm the same Google event changes instead of a duplicate being created.
7. Delete the FamilyApp appointment and confirm its linked Google event is removed.
8. On the second household phone, confirm incoming Firebase updates do not create duplicate Google events.

## Later household-wide option

A true household-wide Google Calendar connection, where either family member can update one shared Google credential from any device, should use central server-side credential storage plus authenticated household authorization. Do not put plaintext Google refresh tokens in Firebase or browser storage.
