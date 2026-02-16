---
description: Werk alle documentatie bij. Scant de codebase en zorgt dat info_*.md bestanden actueel zijn.
argument-hint: <optioneel: specifieke folder>
---

## Documentatie Update

Gebruik de `documenter` agent om alle documentatie bij te werken.

**Scope**: $ARGUMENTS (als leeg: scan het hele project)

### Stappen:
1. Scan alle folders in src/ voor `info_*.md` bestanden
2. Controleer of elke code-folder een `info_*.md` heeft — maak aan als het ontbreekt
3. Vergelijk de documentatie met de actuele code — update wat verouderd is
4. Check docs/ARCHITECTURE.md — klopt het nog met de huidige structuur?
5. Check docs/DECISIONS.md — zijn er ongedocumenteerde beslissingen?
6. Rapporteer wat er bijgewerkt is
