# info_web

> Laatst bijgewerkt: 2026-02-16

## Doel
Web-laag voor UI-hosts (localhost en embedded Studio Pro varianten).

## Subfolders
| Folder | Doel |
|--------|------|
| api/ | Lokale HTTP API server voor UI-toegang tot de Mendix Copilot core |

## Ontwerp
- Houdt UI-hosting en API-logica gescheiden van de MCP stdio server.
- Maakt hergebruik richting Studio Pro integratie eenvoudiger via stabiele API-contracten.
- API bevat inspectie-, chat- en change-plan workflows.
