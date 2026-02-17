---
description: Review code kwaliteit en documentatie. Controleert patronen, tests, en info_*.md bestanden.
argument-hint: <optioneel: specifiek pad of bestand>
---

## Code Review

Gebruik de `reviewer` agent om een grondige review te doen.

**Scope**: $ARGUMENTS (als leeg: review alle recente wijzigingen)

### Review stappen:
1. Identificeer welke bestanden recent gewijzigd zijn (gebruik `git diff` of scan de src/ folder)
2. Review elke gewijzigde file volgens de checklist in de reviewer agent
3. Check of alle `info_*.md` bestanden up-to-date zijn
4. Check of tests bestaan en slagen
5. Geef een samenvatting met ✅ ⚠️ 🔴 ratings
