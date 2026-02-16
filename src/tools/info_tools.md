# info_tools

> Laatst bijgewerkt: 2026-02-16

## Doel
MCP Tool definities. Elk bestand registreert een groep gerelateerde tools die Claude kan aanroepen. Tools zijn de primaire interface waarmee Claude het Mendix model bevraagt.

## Bestanden
| Bestand | Doel | Tools | Status |
|---------|------|-------|--------|
| navigation.ts | App-niveau navigatie | `list_modules`, `get_app_info`, `search_model` | 📋 Gepland |
| domain-model.ts | Domain model inspectie | `get_domain_model`, `get_entity_details`, `get_associations` | 📋 Gepland |
| logic.ts | Microflow/nanoflow inspectie | `list_microflows`, `get_microflow_details`, `list_nanoflows` | 📋 Gepland |
| pages.ts | Page/UI inspectie | `list_pages`, `get_page_structure` | 📋 Gepland |
| security.ts | Security analyse | `get_security_overview`, `get_entity_access` | 📋 Gepland |
| analysis.ts | Quality & dependency analyse | `check_best_practices`, `get_dependencies` | 📋 Gepland |

## Hoe het werkt
Elk bestand exporteert een `registerXxxTools(server, mendixClient)` functie die wordt aangeroepen vanuit `src/index.ts`.

## Bekende beperkingen
- Tool descriptions moeten kort maar precies zijn — Claude kiest tools op basis hiervan
- Output moet beknopt zijn om context window te sparen
