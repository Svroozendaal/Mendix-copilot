# info_builders

> Laatst bijgewerkt: 2026-02-16

## Doel
Command builders voor de change-executor. Zet ChangePlan commando's om naar uitvoerbare executor-commando's.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| crudGenerator.ts | Bouwt CRUD-gerelateerde command payloads | Geimplementeerd |
| entityBuilder.ts | Bouwt entity-wijzigingscommando's | Geimplementeerd |
| microflowBuilder.ts | Bouwt microflow-wijzigingscommando's | Geimplementeerd |

## Hoe het werkt
- Validator bepaalt of een plan uitvoerbaar is.
- Executor gebruikt deze builders om per command-type een concrete uitvoeringstaak op te bouwen.

## Afhankelijkheden
- `src/change-planner/dsl/*`
- `src/change-executor/executor.ts`

## Bekende beperkingen
- Pipeline draait momenteel in simulated mode.
