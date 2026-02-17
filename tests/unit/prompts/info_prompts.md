# info_prompts (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor MCP promptregistraties en promptinhoud.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| prompts.test.ts | Controleert promptnamen, parameters en kerntemplategedrag | Geimplementeerd |

## Hoe het werkt
- Testset bewaakt contractstabiliteit van promptoutput naar MCP clients.

## Afhankelijkheden
- `src/prompts/*`

## Bekende beperkingen
- Test niet alle tekstuele nuances; focus ligt op contract en kerninstructies.
