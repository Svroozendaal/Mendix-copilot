# info_change-executor (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor validator- en executorlogica van ChangePlan uitvoering.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| validator.test.ts | Valideert planregels, conflicts en approval checks | Geimplementeerd |
| executor.test.ts | Test execution flow en preview output in simulated mode | Geimplementeerd |

## Hoe het werkt
- Tests valideren dat plannen voorspelbaar door validator/executor lopen.

## Afhankelijkheden
- `src/change-executor/*`
- `src/change-planner/dsl/*`

## Bekende beperkingen
- Geen echte Mendix write/commit assertions zolang mode simulated blijft.
