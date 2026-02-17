# info_dsl

> Laatst bijgewerkt: 2026-02-16

## Doel
Definieert het ChangePlan DSL-contract dat tussen planner en executor wordt uitgewisseld.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| changePlan.schema.ts | Zod schema en types voor ChangePlan payloads | Geimplementeerd |
| commandTypes.ts | Command-type definities en mapping helpers | Geimplementeerd |

## Hoe het werkt
- Planner produceert een ChangePlan volgens dit schema.
- Executor valideert en verwerkt uitsluitend schema-conforme plannen.

## Afhankelijkheden
- `src/change-planner/planner/*`
- `src/change-executor/*`

## Bekende beperkingen
- DSL dekt alleen huidige MVP commandset; uitbreiding vereist schema-update + tests.
