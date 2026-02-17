---
description: Werk alle documentatie bij volgens de documentatiestandaard. Scan de volledige codebase, vul info_*.md aan, valideer skills-taken en ruim verouderde docs op.
argument-hint: <optioneel: specifieke folder>
---

## Documentatie Update

Gebruik de `documenter` agent om alle documentatie bij te werken.

**Scope**: `$ARGUMENTS` (als leeg: scan het hele project)

### Stappen

1. Scan alle codefolders (`src/`, `web-ui/`, `studio-pro-extension/`, `studio-pro-extension-csharp/`, `tests/`) op ontbrekende `info_*.md`.
2. Controleer skills in `.claude/skills/*/SKILL.md` op aanwezigheid van `## Taken` met concrete stappen.
3. Werk verouderde docs bij (`README.md`, `docs/*.md`) op basis van actuele code.
4. Verwijder ongebruikte of verouderde documentatie en tijdelijke artefacten waar veilig.
5. Valideer dat paden, scripts en componentnamen kloppen met de code.
6. Rapporteer:
   - wat is aangepast,
   - welke documentatie nu volledig is,
   - welke hiaten nog openstaan.
