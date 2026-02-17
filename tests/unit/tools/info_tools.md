# info_tools (tests/unit)

> Laatst bijgewerkt: 2026-02-16

## Doel
Unit tests voor MCP toolregistratie en toolgedrag.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| analysis.test.ts | Test analyse-tools | Geimplementeerd |
| domain-model.test.ts | Test domain-model tools | Geimplementeerd |
| logic.test.ts | Test logic-tools | Geimplementeerd |
| navigation.test.ts | Test navigatie-tools | Geimplementeerd |
| pages.test.ts | Test page-tools | Geimplementeerd |
| security.test.ts | Test security-tools | Geimplementeerd |

## Hoe het werkt
- Tests controleren registratienamen, schema's en responsegedrag van tool handlers.

## Afhankelijkheden
- `src/tools/*`

## Bekende beperkingen
- Tests richten zich op contract- en handlergedrag, niet op volledige SDK-integratie.
