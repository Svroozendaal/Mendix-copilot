# info_serializers (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor serializer output van Mendix modeldata.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| domain-model.test.ts | Test serialisatie van entities/associaties | Geimplementeerd |
| microflow.test.ts | Test serialisatie van microflowstappen | Geimplementeerd |
| page.test.ts | Test serialisatie van pagestructuur | Geimplementeerd |
| security.test.ts | Test serialisatie van securityoverzicht | Geimplementeerd |

## Hoe het werkt
- Elke serializer wordt getest op leesbaarheid, fallbackgedrag en kernvelden.

## Afhankelijkheden
- `src/mendix/serializers/*`

## Bekende beperkingen
- Output blijft heuristisch; tests valideren kernverwachtingen, geen volledige modeldump.
