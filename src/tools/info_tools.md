# info_tools

> Laatst bijgewerkt: 2026-02-16

## Doel
MCP Tool definities. Elk bestand registreert een groep gerelateerde tools die Claude of Codex kan aanroepen.

## Bestanden
| Bestand | Doel | Tools | Status |
|---------|------|-------|--------|
| navigation.ts | App-niveau navigatie en discovery | `get_app_info`, `list_modules`, `search_model` | Geimplementeerd |
| domain-model.ts | Domain model inspectie | `get_domain_model`, `get_entity_details`, `get_associations` | Geimplementeerd |
| logic.ts | Microflow/nanoflow inspectie | `list_microflows`, `get_microflow_details`, `list_nanoflows` | Geimplementeerd |
| pages.ts | Page/UI inspectie | `list_pages`, `get_page_structure` | Geimplementeerd |
| security.ts | Security analyse | `get_security_overview`, `get_entity_access` | Geimplementeerd |
| analysis.ts | Quality en dependency analyse | `check_best_practices`, `get_dependencies` | Geimplementeerd |

## Hoe het werkt
Elk tools-bestand exporteert een `registerXxxTools(server, mendixClient)` functie.
`src/index.ts` registreert alle toolgroepen tijdens startup.

Tool output gebruikt dezelfde serializers als de localhost API/core-laag, zodat tekstrepresentatie consistent blijft over hosts.

## Bekende beperkingen
- `search_model` matcht op naam/qualified name (geen full expression search).
- `check_best_practices` en `get_dependencies` gebruiken heuristieken en kunnen false positives/negatives geven.
- Tool output is tekstgebaseerd en geoptimaliseerd voor snelle LLM analyse, niet voor machine parsing.
