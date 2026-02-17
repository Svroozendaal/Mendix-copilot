# info_change-planner (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor ChangePlan planning (schema, intentclassificatie en NL-conversie).

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| changePlan.schema.test.ts | Schema-validatie van DSL | Geimplementeerd |
| intentClassifier.test.ts | Intentdetectie op promptinput | Geimplementeerd |
| planFromNaturalLanguage.test.ts | End-to-end planner output tests | Geimplementeerd |

## Hoe het werkt
- Testset borgt stabiele planner-output bij verschillende prompts en contexten.

## Afhankelijkheden
- `src/change-planner/*`

## Bekende beperkingen
- Rule-based planner: testdekking volgt expliciete regels, niet model-gedreven AI-variatie.
