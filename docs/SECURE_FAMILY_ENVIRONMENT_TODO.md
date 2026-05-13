# Secure Family Environment Roadmap

Doel: de app geschikt maken voor gezinnen die live samen werken, elkaars updates zien en toch volledig gescheiden blijven van andere gezinnen.

## Fase 1 - Identity en Family Space foundation
- [x] Centrale avatar/profile state introduceren.
- [ ] Centrale current user store maken.
- [ ] Family space model toevoegen: `familyId`, `members`, `roles`, `inviteCode`.
- [ ] Alle lokale data koppelen aan een `familyId`.
- [ ] Data model normaliseren voor feed, taken, agenda, notities, boodschappen.

## Fase 2 - Backend keuze en database
Aanbevolen: Supabase.

Waarom:
- Auth ingebouwd.
- Realtime subscriptions.
- Row Level Security.
- Postgres database.
- Storage voor avatars/foto uploads.
- Goede gratis startlaag.

Database tabellen:
- `families`
- `family_members`
- `profiles`
- `feed_posts`
- `feed_comments`
- `tasks`
- `calendar_events`
- `notes`
- `shopping_items`
- `media_uploads`

## Fase 3 - Beveiliging
- [ ] Supabase Auth toevoegen.
- [ ] Row Level Security policies per `family_id`.
- [ ] Alleen leden van dezelfde familie mogen data lezen/schrijven.
- [ ] Invite codes met expiry.
- [ ] Rollen: `owner`, `parent`, `child`.
- [ ] Optioneel: client-side encryptie voor privé notities.

## Fase 4 - Realtime sync
- [ ] Feed posts realtime tonen.
- [ ] Comments realtime tonen.
- [ ] Likes/reactions realtime syncen.
- [ ] Taken realtime afronden/toewijzen.
- [ ] Agenda realtime updates.
- [ ] Online presence tonen.

## Fase 5 - Multi-family / SaaS readiness
- [ ] Nieuwe gebruiker kan eigen gezin maken.
- [ ] Gebruiker kan via invite bij gezin komen.
- [ ] Iedere familie ziet alleen eigen omgeving.
- [ ] Admin beheer voor gezinsleden.
- [ ] Export/delete data per gezin.

## Belangrijk architectuurprincipe
Geen enkele module mag globale data opslaan zonder `familyId`.

Fout:
```js
localStorage.setItem('posts', JSON.stringify(posts));
```

Goed:
```js
localStorage.setItem(`familyapp:${familyId}:posts`, JSON.stringify(posts));
```

Later vervang je localStorage door Supabase queries met dezelfde `familyId`.

## Eerste technische stap
Maak een `familyEnvironmentStore` die nu nog localStorage gebruikt, maar dezelfde API krijgt als de latere backend laag.

Daarna kunnen modules alvast veilig refactoren zonder direct alle backend code te schrijven.
