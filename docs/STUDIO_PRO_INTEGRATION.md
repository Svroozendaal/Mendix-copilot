# Studio Pro Integratie (Vooruitblik)

> Laatst bijgewerkt: 2026-02-16

## Doel
Beschrijven hoe de huidige localhost web UI architectuur later kan landen in een Mendix Studio Pro extensie.

## Verwachte rol van de Studio Pro extensie
Een toekomstige extensie (Extensibility API, C#) kan een Copilot-panel aanbieden met:

- embedded webview (of native UI)
- dezelfde interacties als de huidige web UI (chat, explorer, quick actions)
- lokale communicatie met dezelfde API-contracten

## API-hergebruik
De extensie kan dezelfde endpoints gebruiken als de web UI:

- lifecycle: `POST /api/connect`, `POST /api/disconnect`, `GET /api/status`
- modelinspectie: `GET /api/app-info`, `GET /api/modules`, `GET /api/module/:name/domain-model`, `GET /api/search`
- details: `GET /api/entity/:qualifiedName`, `GET /api/entity/:qualifiedName/associations`, `GET /api/microflow/:qualifiedName`, `GET /api/page/:qualifiedName`
- audits: `GET /api/security`, `GET /api/entity-access/:qualifiedName`, `GET /api/best-practices`, `GET /api/dependencies/:qualifiedName`
- chat/trace: `POST /api/chat` (SSE events)
- change workflow: `POST /api/plan`, `POST /api/plan/validate`, `POST /api/plan/execute`

## Mogelijke extra endpoints voor Studio Pro
Voor diepere IDE-integratie zijn later waarschijnlijk extra API's nodig:

- file/model watcher sync (bijv. wijzigingen in `.mpr` of modeldocumenten)
- open-document deep link in Studio Pro (bijv. navigeer direct naar microflow/page/entity)
- context push vanuit actieve editorselectie naar Copilot (huidige module/document)

## Notitie
Deze specificatie blijft op architectuurniveau. Er is in deze fase nog geen C# extensiecode toegevoegd.

## Prompt 3 readiness
- De huidige Plan -> Approve -> Execute flow in de web UI kan 1-op-1 in een Studio Pro panel worden hergebruikt.
- Alleen de execution backend hoeft later te veranderen (bijv. van lokale/simulated uitvoer naar Studio Pro extensie-acties).
