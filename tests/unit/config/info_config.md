# info_config (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor configuratieparsing en defaults.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| config.test.ts | Test env/CLI parsing en fallbackgedrag | Geimplementeerd |

## Hoe het werkt
- Test varianten op env en argumentcombinaties voor stabiele startupconfig.

## Afhankelijkheden
- `src/config/*`

## Bekende beperkingen
- Test geen OS-specifieke shell quoting varianten.
