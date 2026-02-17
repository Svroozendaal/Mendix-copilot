# info_mocks

> Laatst bijgewerkt: 2026-02-16

## Doel
Gedeelde testmocks en mock-builders voor unit tests.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| mendix-model.ts | Mock modeldata en helper-builders voor Mendix-gerelateerde tests | Geimplementeerd |

## Hoe het werkt
- Unit tests importeren gedeelde mock builders om duplicatie te vermijden.

## Afhankelijkheden
- `tests/unit/*`

## Bekende beperkingen
- Mocks dekken alleen testscenario's die momenteel in unit-tests voorkomen.
