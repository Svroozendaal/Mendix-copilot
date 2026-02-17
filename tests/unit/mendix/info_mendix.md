# info_mendix (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor Mendix client- en cachelaag.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| client.test.ts | Test connect/lifecycle en modeltoegangslogica | Geimplementeerd |
| cache.test.ts | Test cachegedrag en invalidatie | Geimplementeerd |

## Hoe het werkt
- Mocks simuleren SDK-responses zodat client/cachegedrag deterministisch testbaar blijft.

## Afhankelijkheden
- `src/mendix/*`
- `tests/mocks/mendix-model.ts`

## Bekende beperkingen
- Geen echte netwerkcalls naar Mendix Platform API in unit-scope.
