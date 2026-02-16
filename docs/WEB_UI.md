# Web UI (Optie 1.A)

> Laatst bijgewerkt: 2026-02-16

## Doel en scope
Deze fase implementeert een lokale webapp op `localhost` naast Mendix Studio Pro.  
De webapp biedt een gebruiksvriendelijke Copilot-ervaring met:

- chat
- app explorer
- quick actions (`review-module`, `security-audit`, `explain-microflow`)

Dit is nadrukkelijk nog geen Studio Pro extensie. De webapp en API worden wel zo opgezet dat hergebruik in Studio Pro later eenvoudig is.

## Componenten

### 1. Core
De bestaande Mendix Copilot core blijft leidend:

- `MendixClient` (`mendixplatformsdk` + `mendixmodelsdk`)
- bestaande serializers
- bestaande tool-logica/workflows (waar relevant hergebruikt via dezelfde core-methodes)

De core blijft verantwoordelijk voor modeltoegang, heuristische analyse en Claude-vriendelijke tekstoutput.

### 2. API server (`copilot-api`)
Een lokale Node/TypeScript HTTP-laag bovenop de core:

- connect/disconnect/status lifecycle
- REST endpoints voor app/model-inspectie
- chat-runner endpoint met event streaming (SSE)
- change workflow endpoints (`/api/plan`, `/api/plan/validate`, `/api/plan/execute`)

De API vertaalt UI-aanvragen naar core-calls en levert consistente responses (`text` + optionele `meta`).

### 3. Web UI
Een lokale React webapp die de API gebruikt:

- connect panel
- explorer + detailview
- chat met Plan -> Approve -> Execute flow
- execution log met command trace + commit/post-check events
- quick action knoppen

De UI bevat geen Mendix credentials en spreekt alleen met de lokale API.

## Waarom deze scheiding Studio Pro later makkelijker maakt
Deze scheiding voorkomt directe koppeling tussen UI en Mendix SDK objecten:

- UI kent alleen stabiele HTTP contracten
- API kapselt lifecycle, validatie en foutafhandeling af
- core blijft herbruikbaar vanuit meerdere hosts (MCP server, web UI API, later Studio Pro extensie)

Bij Studio Pro integratie kan een panel of embedded webview dezelfde API-contracten aanspreken, of direct dezelfde core-service hergebruiken met minimale mapping.

## Security-afspraken

- Tokens uitsluitend server-side via environment variabelen (`MENDIX_TOKEN`)
- Geen token-opslag in frontend code, local storage of repository
- Geen secrets in logs
- Foutmeldingen blijven veilig en lekken geen credentials
