# FamilieApp v023 — Deploy instructies

## Wat is er nieuw in v023?

### Visueel (upgrade van v022)
- Stat tiles met echte foto-achtergronden (Level / Streak / Party)
- Party tile met avatars (SK / ES / SH)
- Prioriteit badges op quest cards: Laag / Normaal / Hoog
- Voortgangsbalk per dag-groep
- Betere glasmorphism cards met backdrop-blur
- Raid & Dungeon cards met "Start raid" / "Start dungeon" knop
- Donkere full-screen detail modal (behouden van v022)
- Subquests met XP per stap
- Beloningen sectie (XP / Discipline / Homekeeping)
- Group Quest popup

### Functioneel
- Prioriteit (laag/normaal/hoog) opgeslagen per quest (index [12])
- Party modal toegevoegd
- XP berekend op basis van type + prioriteit
- Laundry afbeelding toegevoegd
- Data migratie van v021/v022 automatisch

## Stappen

1. Upload `v023.js` en `v023.css` naar je repo root (naast v022.js / v022.css)

2. Zoek in `index.html` de plek waar v022 geladen wordt.
   Waarschijnlijk iets als:
   ```html
   <link rel="stylesheet" href="v022.css">
   <script src="v022.js"></script>
   ```
   Vervang dit door:
   ```html
   <link rel="stylesheet" href="v023.css">
   <script src="v023.js"></script>
   ```

3. Als v022 inline in index.html staat (geen aparte tag):
   - Zoek op `__famV022` in index.html
   - Vervang het hele script block door de inhoud van v023.js
   - Vervang de bijbehorende <style> door de inhoud van v023.css

4. Commit & push → Vercel deployt automatisch

## Data
- LocalStorage key: `fam_tasks_v023`
- Leest automatisch v022/v021 data als fallback
- Geen dataverlies bij upgrade

## Afbeeldingen
De app gebruikt Unsplash URLs. Wil je eigen renders gebruiken?
Vervang de URL's in v023.js bij de `I = { ... }` variabelen bovenin het bestand.
