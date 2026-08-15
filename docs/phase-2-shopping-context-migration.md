# Fase 2/5 — Shopping HouseholdContext-migratie

Datum: 2026-08-15
Status: architectuur/context-hardening uitgevoerd; live device/PWA acceptance blijft uitgestelde release-gate.

## Doel

Maak Winkelen/Boodschappen multi-household veilig zonder een tweede shoppingstore te introduceren. De bestaande `ShoppingLists` + `FamilyDataStore` combinatie blijft de bron van waarheid, maar identity, lifecycle en mutaties lopen nu via `HouseholdContext`.

## Gevonden risico's

- `ShoppingLists.booted` kon een household-switch overleven waardoor subscriptions niet opnieuw bonden.
- Shared/private shopping subscriptions werden niet bewaard en dus niet expliciet losgekoppeld.
- Late callbacks uit een vorig household konden zonder context-token doorlopen.
- De actieve lijstvoorkeur gebruikte één globale localStorage-key.
- `shop.js` en `foodAddBridge.js` schreven een volledige `shopData`-projectie naar localStorage / `HouseholdRepository`, waardoor naast Firebase een tweede authority kon ontstaan.
- Recipe → shopping commands hadden geen captured UID/household-context.
- Shopping receipt → Finance kon vanuit een oude modal na een account/household-switch worden bevestigd.
- `groceryQuickAddModal.js` bleek daadwerkelijk afgebroken/incompleet te zijn en werd niet door CI syntax-gecheckt.

## Uitgevoerde hardening

### ShoppingLists v0.500

- captured `{uid, householdId}` per binding;
- `sharedUnsub` en `privateUnsub` worden bewaard;
- `stop()` detacht beide listeners en wist de huidige shoppingprojectie;
- `rebind()` op `familyapp:household-context-changed`;
- `familyapp:session:cleared` stopt subscriptions;
- stale callbacks worden genegeerd;
- create/add/toggle/delete/clear gebruiken context assertions;
- stale mutations geven `SHOPPING_CONTEXT_CHANGED`;
- actieve lijstvoorkeur is nu gescoped als `familyapp_active_shopping_list_v2:{uid}:{householdId}`.

### Legacy UI/add bridges

- `shop.js` is read-model/UI compatibility, niet meer persistence authority;
- geen `familyapp_food_shop_v001` write meer vanuit `shop.js`;
- geen `HouseholdRepository.write('groceries', ...)` meer vanuit `shop.js`;
- `FoodAddBridge` delegeert toevoegen uitsluitend naar `ShoppingLists.addItem`;
- `FoodAddBridge.persistShop()` is alleen nog compatibility projection event/no-op.

### Quick Add

- het beschadigde `groceryQuickAddModal.js` is volledig hersteld;
- gebruikt `GroceryProductClassifier` voor categorie, icoon en standaardhoeveelheid;
- ondersteunt o.a. food, huishoudelijk, elektronica en wonen vanuit dezelfde classifier;
- gebruiker kan voorgestelde hoeveelheid/categorie aanpassen;
- schrijft uitsluitend via `ShoppingLists.addItem`;
- captured HouseholdContext voorkomt doorlopen na account/household-switch;
- Quick Add wordt nu door CI op syntax gecontroleerd.

### Recipe → shopping

`ShoppingListService` v1.2:
- captured HouseholdContext;
- UID wordt op records geschreven als `createdBy`/`updatedBy`;
- stale async commands stoppen met `SHOPPING_CONTEXT_CHANGED`.

### Shopping receipt → Finance

`ShoppingReceiptFinance` v1.2:
- context wordt vastgelegd bij openen;
- context wordt opnieuw gevalideerd vóór bevestiging en na write;
- idempotency source ID bevat household: `{householdId}:{listKey}`;
- finance transaction bevat `whoUid` en `householdId`;
- oude naamgebaseerde `myName`-identity is uit deze writeflow verwijderd.

## Automatische regressietests

- `tests/shopping-context-rebind.test.js`
  - Alpha bindt shared/private subscriptions;
  - switch naar Beta detacht Alpha;
  - Beta bindt opnieuw;
  - handmatig afgevuurde stale Alpha callback kan geen Beta `shopData` muteren;
  - actieve lijstvoorkeur is UID/household-scoped.

- `tests/shopping-context-adoption.test.js`
  - verbiedt herintroductie van legacy shopping localStorage/repository authority in actieve shoppinglagen;
  - vereist HouseholdContext in shopping commands;
  - vereist context-safe Quick Add;
  - vereist household-scoped receipt idempotency en UID/household metadata.

De bestaande pending-write, account-switch, removed-member en invite lifecycle suites blijven naast deze checks draaien.

## Nog uitgesteld / release-gate

Niet als mislukt beschouwd, maar later nog live valideren:
- twee echte telefoons met dezelfde household shoppinglijst realtime;
- logout/account-switch op een echt toestel terwijl Winkelen openstaat;
- offline toevoegen/checken → reconnect;
- receipt → Finance end-to-end in de echte UI;
- drie onafhankelijke live households zonder shopping-overlap;
- iPhone Safari/PWA acceptance.

Daarom blijft Shopping voorlopig 🟡 tot de live acceptance-gate is uitgevoerd, ondanks dat de architecture/context-hardening automatisch is bewezen.
