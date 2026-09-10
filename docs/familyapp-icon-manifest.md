# FamilyApp Icon Manifest

Canonical visual direction for the global FamilyApp icon system.

## Visual split

- **Person + Tasks:** premium purple/gold RPG/progression family.
- **Shopping, Recipes, Meals, Agenda, Finance, Social and other domain UI:** premium colorful FamilyApp utility family.
- **Bottom navigation and More menu:** excluded from this migration unless explicitly approved later.

## Utility style principles

- warm premium light-fantasy object illustration;
- readable at 24–44 px;
- colorful object is primary, purple/gold treatment is secondary;
- subtle depth, highlight and shadow;
- dark mode gets a deeper purple tile, restrained glow and gold rim;
- light mode keeps a soft pearl/lilac tile with subtle gold detail;
- SVG symbols use direct fills/strokes for external-`use` Safari compatibility;
- one canonical registry + one resolver; no per-screen icon ownership.

## Current semantic utility families

### Shopping / groceries

`utilityShopping`, `utilityCart`, `utilityCategory`, `utilityDairy`, `utilityCheese`, `utilityEggs`, `utilityBread`, `utilityFruit`, `utilityBanana`, `utilityBerries`, `utilityCitrus`, `utilityVegetable`, `utilityTomato`, `utilityPotato`, `utilityBroccoli`, `utilityMeat`, `utilityChicken`, `utilityFish`, `utilityPantry`, `utilityRice`, `utilityPasta`, `utilityDrinks`, `utilitySoda`, `utilityCoffee`, `utilityTea`, `utilitySnacks`, `utilityFrozen`.

### Household / care / baby / pets

`utilityHousehold`, `utilityDetergent`, `utilityToiletPaper`, `utilityCare`, `utilityShampoo`, `utilityBaby`, `utilityDiapers`, `utilityPet`.

### Electronics

`utilityElectronics`, `utilityLaptop`, `utilityPhone`, `utilityMonitor`, `utilityKeyboard`, `utilityMouse`, `utilityHeadphones`, `utilityCharger`, `utilityCable`, `utilityBattery`, `utilityController`, `utilityCamera`, `utilitySpeaker`, `utilityWatch`.

### Home / furniture

`utilityHome`, `utilitySofa`, `utilityChair`, `utilityBed`, `utilityPlant`.

### Travel / transport

`utilityTravel`, `utilityCar`, `utilityTrain`, `utilityPlane`, `utilitySuitcase`, `utilityPassport`, `utilityTicket`, `utilityHotel`, `utilityFuel`, `utilityParking`, `utilityTaxi`, `utilityBus`, `utilityBike`, `utilityBackpack`.

### Recipes / meals

`utilityRecipe`, `utilityMeal`, `utilityLunch`, `utilityDinner`, `utilityCalendar`.

## Resolver fallback hierarchy

For shopping/winkel-items the resolver uses:

1. normalized product name → specific semantic icon;
2. legacy emoji metadata → semantic icon;
3. category → category icon;
4. `utilityGeneric` fallback.

This allows existing Firebase records to render with the new system without rewriting stored data, while new product names automatically receive more specific artwork.

## Expansion rule

New icons must be added in this order:

1. SVG symbol in `src/ui/icons/assets/familyapp-colorful-icons.svg`;
2. semantic key in `src/ui/icons/familyAppIconRegistry.js`;
3. domain mapping in `familyAppUtilityIconResolver.js` or the relevant domain resolver;
4. classifier vocabulary only when the domain meaning/category/default quantity also changes.

Do not hard-code new SVG/emoji presentation inside feature renderers.
