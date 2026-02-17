# Documentatiestandaard

> Laatst bijgewerkt: 2026-02-16

## Doel

Deze standaard definieert hoe documentatie in dit project wordt geschreven, bijgewerkt en gevalideerd.

## Basisregels

1. Schrijf in het Nederlands.
2. Schrijf concreet en technisch, zonder vage formuleringen.
3. Gebruik overal exacte paden en scriptnamen.
4. Gebruik datumveld:
   - `> Laatst bijgewerkt: YYYY-MM-DD`

## Verplichte documentatie op projectniveau

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/STUDIO_PRO_INTEGRATION.md`
- `docs/WEB_UI.md`

## Verplichte folderdocumentatie

- Elke folder met broncode (`.ts`, `.tsx`, `.js`, `.mjs`, `.cs`) bevat een `info_*.md`.
- Minimaal verplichte secties:
  - `## Doel`
  - `## Bestanden`
  - `## Hoe het werkt`
  - `## Afhankelijkheden`
  - `## Bekende beperkingen`

## Skills-documentatie

- Elke skill in `.claude/skills/*` heeft een `SKILL.md`.
- Frontmatter bevat minimaal:
  - `name`
  - `description`
- Elke skill bevat een expliciete `## Taken` sectie met uitvoerbare stappen.

## Wijzigingsregels

- Elke codewijziging vereist een bijbehorende documentatiecheck.
- Architectuurwijzigingen komen in `docs/DECISIONS.md`.
- Nieuwe folders krijgen direct een `info_*.md`.

## Opschoningsregels

- Verwijder tijdelijke artefacten (logs, tmp-folders) die niet nodig zijn voor runtime of documentatie.
- Verwijder of update verouderde documentatie direct.

## Definitie van klaar (documentatie)

- Geen ontbrekende `info_*.md` in codefolders.
- Skills voldoen aan `SKILL.md` + `## Taken`.
- README en docs-map weerspiegelen actuele structuur.
- Datums zijn bijgewerkt.
