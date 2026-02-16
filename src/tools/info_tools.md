# info_tools

> Laatst bijgewerkt: 2026-02-16

## Doel
MCP Tool definities. Elk bestand registreert een groep gerelateerde tools die Claude kan aanroepen.

## Bestanden
| Bestand | Doel | Tools | Status |
|---------|------|-------|--------|
| navigation.ts | App-niveau navigatie en discovery | `get_app_info`, `list_modules` | Geimplementeerd |
| domain-model.ts | Domain model inspectie | `get_domain_model`, `get_entity_details`, `get_associations` | Geimplementeerd |
| logic.ts | Microflow/nanoflow inspectie | `list_microflows`, `get_microflow_details`, `list_nanoflows` | Gepland |
| pages.ts | Page/UI inspectie | `list_pages`, `get_page_structure` | Gepland |
| security.ts | Security analyse | `get_security_overview`, `get_entity_access` | Gepland |
| analysis.ts | Quality en dependency analyse | `check_best_practices`, `get_dependencies` | Gepland |

## Hoe het werkt
Elk tools-bestand exporteert een `registerXxxTools(server, mendixClient)` functie.
`src/index.ts` registreert momenteel navigation- en domain-model tools tijdens startup.

## Bekende beperkingen
- `search_model` is nog niet geimplementeerd in `navigation.ts`.
- Output is tekstgebaseerd en geoptimaliseerd voor snelle Claude-analyse, niet voor machine parsing.