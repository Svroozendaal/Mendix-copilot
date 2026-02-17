# Project Overzicht

> Laatst bijgewerkt: 2026-02-16

## Doel

Dit document geeft een volledig overzicht van:

- waar onderdelen in de codebase staan,
- welke functionaliteiten elk onderdeel bevat,
- hoe onderdelen samenwerken.

## Top-level map

| Pad | Inhoud | Functionaliteit |
|-----|--------|-----------------|
| `src/` | Herbruikbare backend/core | MCP host, localhost API, planner/executor, Mendix SDK integratie |
| `web-ui/` | React frontend | Explorer, quick actions, plan/validate/execute UI, SSE log |
| `shared/` | Gedeelde hostcontracten | `WB_CONTEXT`, `WB_CONTEXT_REQUEST`, `WB_EMBEDDED` |
| `studio-pro-extension/` | Studio Pro 11 shell (TS) | Dockable panel met embedded localhost UI + context bridge |
| `studio-pro-extension-csharp/` | Studio Pro 10 shell (C#) | Dockable panel met embedded localhost UI + context bridge |
| `commands/` | PowerShell helper scripts | Local dev start en Studio Pro 10 deploy-automation |
| `tests/` | Unit/manual tests | Contract-, serializer-, planner-, executor- en API-validatie |
| `docs/` | Systeemdocumentatie | Architectuur, beslissingen, integratiehandleidingen, standaarden |
| `.claude/` | Agent/command/skill configuratie | Ontwikkelworkflow voor architectuur, implementatie, test en documentatie |

## Backend (`src/`)

### Kernmodules

| Pad | Functionaliteit |
|-----|-----------------|
| `src/index.ts` | MCP server entrypoint |
| `src/core/copilot-core.ts` | Gedeelde service-laag voor modelvragen |
| `src/config/index.ts` | Omgevingsconfig en defaults |
| `src/mendix/client.ts` | Mendix working copy lifecycle en modeltoegang |
| `src/mendix/serializers/*` | Modeldata -> leesbare tekst/meta |

### Planning en uitvoering

| Pad | Functionaliteit |
|-----|-----------------|
| `src/change-planner/planner/*` | NL prompt -> ChangePlan DSL |
| `src/change-planner/dsl/*` | DSL schema en commandtypes |
| `src/change-executor/validator.ts` | Planvalidatie en risico-/conflictregels |
| `src/change-executor/executor.ts` | Execute orchestration (simulated mode) |
| `src/change-executor/builders/*` | Commandbuilders voor entity/microflow/CRUD |

### API laag

| Pad | Functionaliteit |
|-----|-----------------|
| `src/web/api/app.ts` | Express routes en middleware |
| `src/web/api/schemas.ts` | Zod inputvalidatie |
| `src/web/api/chat-runner.ts` | Tooling/chatflow met SSE |
| `src/web/api/session-manager.ts` | Connect/disconnect/status lifecycle |
| `src/web/api/handlers.ts` | Gestandaardiseerde API responses |

### MCP registraties

| Pad | Functionaliteit |
|-----|-----------------|
| `src/tools/*` | MCP tools (navigatie, logic, pages, security, analysis) |
| `src/resources/*` | MCP resources (`mendix://app/overview`) |
| `src/prompts/*` | MCP prompts (`review-module`, `security-audit`, `explain-microflow`) |

## Frontend (`web-ui/`)

| Bestand | Functionaliteit |
|---------|-----------------|
| `web-ui/src/App.tsx` | Hoofdscherm met tabs: Explorer, Chat, Actions |
| `web-ui/src/api-client.ts` | HTTP + SSE client naar localhost API |
| `web-ui/src/styles.css` | Layout/styling |

### Belangrijke UI-functionaliteiten

- Connect/disconnect met Mendix app.
- Explorer voor modules/entities/microflows/pages.
- Quick actions (review/security/explain).
- Plan -> Validate -> Execute flow met approval token.
- SSE execution-log en samenvatting.
- Embedded detectie + contextsync via `window.postMessage`.

## Studio Pro shells

### Studio Pro 11 (`studio-pro-extension/`)

- TypeScript web extension.
- Registreert dockable pane + extensions menu.
- Embedt localhost UI in iframe.
- Context bridge op active document changes.

### Studio Pro 10 (`studio-pro-extension-csharp/`)

- C# Mendix extension met:
  - `DockablePaneExtension`
  - `MenuExtension`
  - `WebServerExtension` (wrapper HTML)
  - `IWebView` messaging
- Context sync via `ActiveDocumentChanged` event.
- Wrapper toont fallback als localhost UI niet bereikbaar is.

## Gedeeld contextcontract (`shared/`)

| Contract | Doel |
|----------|------|
| `WB_CONTEXT` | Push van actuele Studio Pro context |
| `WB_CONTEXT_REQUEST` | Vraag vanuit UI om huidige context |
| `WB_EMBEDDED` | Handshake voor embedded mode |

Payloadvelden:
- `selectedType`: `module` \| `entity` \| `microflow` \| `page` \| `null`
- `qualifiedName?`
- `module?`

## Tests (`tests/`)

| Pad | Dekking |
|-----|---------|
| `tests/unit/mendix/` | Client/cache |
| `tests/unit/serializers/` | Serializer output |
| `tests/unit/tools/` | MCP toolcontracten |
| `tests/unit/web-api/` | Schema + response helpers |
| `tests/unit/change-planner/` | Planner/DSL |
| `tests/unit/change-executor/` | Validator/executor |
| `tests/unit/shared/` | Gedeelde contextcontracten |
| `tests/mocks/` | Herbruikbare mockdata |

## Build en run

| Command | Doel |
|---------|------|
| `npm run dev` | Start localhost API + web UI |
| `npm run build:backend` | Build backend/core |
| `npm run build:ui:web` | Build localhost web UI |
| `npm run build:ui:studio-pro-11` | Build Studio Pro 11 extension |
| `npm run build:ui:studio-pro-10` | Build Studio Pro 10 extension (vereist .NET 8) |
| `npm run test:ci` | Run unit tests |
| `.\commands\start-copilot.ps1` | Start localhost API + web UI met `.env` loading |
| `.\commands\deploy-studio-pro10-panel.ps1 "<MendixAppFolder>"` | Build + kopieert extension-bestanden naar Mendix app |

## Securitygrenzen

- Secrets/tokens alleen server-side (`.env`, Node proces).
- Geen tokens in frontend of Studio Pro extension code.
- Studio Pro shells zijn thin UI-hosts, geen eigen planner/executor implementatie.
