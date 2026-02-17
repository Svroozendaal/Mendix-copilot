# info_web-api (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor web API schema's en route helpers.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| schemas.test.ts | Test Zod request-validatie voor API endpoints | Geimplementeerd |
| handlers.test.ts | Test helperfuncties voor consistente API responses | Geimplementeerd |

## Hoe het werkt
- Schema tests borgen inputcontracten.
- Handler tests borgen outputvorm en foutpadgedrag.

## Afhankelijkheden
- `src/web/api/*`

## Bekende beperkingen
- Geen echte HTTP server- of SSE runtime tests in unit-scope.
