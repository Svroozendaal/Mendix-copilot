# info_planner

> Laatst bijgewerkt: 2026-02-16

## Doel
Plannerlogica voor natural-language naar ChangePlan conversie.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| contextCollector.ts | Verzamelt plancontext uit prompt/API-context | Geimplementeerd |
| intentClassifier.ts | Classificeert wijzigingsintenties | Geimplementeerd |
| planFromNaturalLanguage.ts | Hoofdflow NL -> ChangePlan DSL | Geimplementeerd |

## Hoe het werkt
- Prompt en context worden eerst geclassificeerd.
- Context collector verrijkt target- en moduleinformatie.
- Plan generator produceert schema-conforme ChangePlan output.

## Afhankelijkheden
- `src/change-planner/dsl/*`
- `src/change-planner/prompts/*`

## Bekende beperkingen
- Intentclassificatie is rule-based en kan ambigu prompts conservatief afhandelen.
