---
name: testing
description: Teststrategie en patronen voor deze codebase. Gebruik bij toevoegen of wijzigen van tests, bij regressie-analyse en bij valideren van codewijzigingen.
---

# Testing Skill

## Doel

Zorg dat wijzigingen aantoonbaar correct blijven via consistente unit tests en snelle regressiechecks.

## Taken

1. Bepaal testscope:
   - unit tests,
   - contractvalidatie,
   - regressie op bestaande features.
2. Voeg tests toe in de juiste map onder `tests/unit/*`.
3. Test zowel succespad als foutpad.
4. Voorkom over-mocking: mock op servicegrenzen, niet op elk intern detail.
5. Run minimaal:
   - `npm run typecheck`
   - `npm run test:ci`
6. Werk testdocumentatie (`tests/info_tests.md` of relevante `info_*.md`) bij.

## Richtlijnen

- Gebruik Vitest (`vitest.config.ts`).
- Houd testnamen beschrijvend en gedraggericht.
- Test nieuwe gedeelde contracten expliciet (zoals `shared/studio-context.ts`).
