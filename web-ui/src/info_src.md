# info_src (web-ui)

> Laatst bijgewerkt: 2026-02-16

## Doel
Frontend React code voor de localhost Copilot UI.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| main.tsx | React bootstrap + stylesheet import | Geimplementeerd |
| App.tsx | Hoofdscherm met connect panel, explorer, chat, actions en detail pane | Geimplementeerd |
| api-client.ts | HTTP + SSE client voor `copilot-api` | Geimplementeerd |
| styles.css | UI layout en styling | Geimplementeerd |

## Belangrijke UX onderdelen
- Connect/disconnect + status
- Explorer met module/entity/microflow/page drilldown
- Chat met tool trace events
- Quick actions met samengestelde workflows
