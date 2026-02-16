---
description: Plan en implementeer een nieuwe feature. Gebruik de architect voor planning en de implementer voor code.
argument-hint: <feature naam of beschrijving>
---

## Feature Implementatie Workflow

Je gaat de volgende feature implementeren: $ARGUMENTS

### Stap 1: Planning (Architect Agent)
Gebruik de `architect` agent om:
1. Lees `docs/DECISIONS.md` en relevante `info_*.md` bestanden
2. Bepaal welke bestanden aangemaakt/gewijzigd moeten worden
3. Maak een concreet implementatieplan
4. Documenteer eventuele nieuwe beslissingen in DECISIONS.md

### Stap 2: Implementatie (Implementer Agent)
Gebruik de `implementer` agent om het plan uit te voeren:
1. Schrijf eerst tests
2. Implementeer de code
3. Draai tests: `npm test`
4. Fix tot alles groen is

### Stap 3: Documentatie (Documenter Agent)
Gebruik de `documenter` agent om:
1. Alle geraakte `info_*.md` bestanden bij te werken
2. DECISIONS.md bij te werken indien nodig

### Stap 4: Review (Reviewer Agent)
Gebruik de `reviewer` agent om:
1. Alle nieuwe/gewijzigde code te reviewen
2. Rapporteer bevindingen

### Stap 5: Status Update
Update de "Huidige Status" sectie in CLAUDE.md.
