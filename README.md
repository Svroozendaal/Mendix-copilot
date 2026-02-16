# Mendix Copilot

Mendix Copilot bestaat nu uit twee lokale gebruiksvormen op dezelfde core:

- MCP server (Claude/Codex integratie)
- Localhost web UI + `copilot-api` (explorer, quick actions, plan/approval chat flow)

De core blijft hetzelfde: `MendixClient` + serializers + Mendix Platform/Model SDK.

## Features

- App discovery: `get_app_info`, `list_modules`, `search_model`
- Domain model: `get_domain_model`, `get_entity_details`, `get_associations`
- Logic: `list_microflows`, `get_microflow_details`, `list_nanoflows`
- Pages: `list_pages`, `get_page_structure`
- Security: `get_security_overview`, `get_entity_access`
- Analyse: `check_best_practices`, `get_dependencies`
- MCP resource: `mendix://app/overview`
- MCP prompts: `review-module`, `explain-microflow`, `security-audit`
- Localhost API endpoints + SSE chat runner
- React web UI met connect panel, explorer, quick actions en Plan -> Approve -> Execute flow

## Vereisten

- Node.js 20+
- Een Mendix Personal Access Token (PAT)
- App ID van de Mendix app (optioneel als je alleen handmatig connect in UI/API wilt meegeven)
- Toegang tot de juiste branch (default: `main`)

## Installatie

```bash
npm install
```

## Configuratie (server-side)

Gebruik environment variabelen op de machine waar de Node server draait:

```bash
MENDIX_TOKEN=your_pat_token
MENDIX_APP_ID=your_app_id          # optioneel voor API connect default
MENDIX_BRANCH=main                 # optioneel, default main
COPILOT_API_PORT=8787              # optioneel
COPILOT_API_HOST=127.0.0.1         # optioneel
COPILOT_CHAT_STEP_TIMEOUT_MS=120000   # optioneel
COPILOT_CHAT_TOTAL_TIMEOUT_MS=240000  # optioneel
COPILOT_APPROVAL_TOKEN=change-me      # optioneel, vereist voor /api/plan/execute
```

Voor de web UI:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8787
```

Belangrijk:
- Tokens blijven server-side.
- Zet nooit tokens in frontend code of repositorybestanden.

## Localhost web UI starten

Snelle start (laadt `.env` en start alles):

```powershell
.\start-copilot.ps1
```

Als PowerShell execution policy blokkeert:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-copilot.ps1
```

Handmatig via npm:

```bash
npm run dev
```

Dit start:
- `copilot-api` (default `http://127.0.0.1:8787`)
- React web UI (default `http://127.0.0.1:5173`)

In de UI kun je:
1. Connecten met appId + branch
2. Modules/entities/microflows/pages verkennen
3. Security overview en best-practices draaien
4. In Chat een wijziging plannen, preview beoordelen, approven en execution events volgen

## Change Planning API (nieuw)

Lokale API ondersteunt nu een ChangePlan workflow:

- `POST /api/plan` -> NL vraag naar ChangePlan DSL + preview
- `POST /api/plan/validate` -> validatie + warnings/errors + preview
- `POST /api/plan/execute` -> approval + execution pipeline (SSE streaming, momenteel simulated mode)

`/api/plan/execute` vereist altijd `approvalToken`.  
Bij destructive plannen is ook `confirmText` verplicht en moet exact matchen met de target-string.

SSE events voor execute:
- `command_start`
- `command_success`
- `command_failed`
- `commit_done`
- `postcheck_results`
- `final`

## MCP server starten (oude flow blijft bestaan)

Development watch:

```bash
npm run dev:mcp
```

Build + run:

```bash
npm run build
node dist/index.js --app-id "your_app_id" --branch "main"
```

CLI fallback voor appId/branch werkt nog steeds voor de MCP server.

## Belangrijke scripts

```bash
npm run dev            # API + web UI
npm run dev:api        # alleen API
npm run dev:web        # alleen web UI
npm run dev:mcp        # MCP server watch
npm run test:ci
npm run typecheck
npm run typecheck:web
npm run build
```

## Claude Code setup (MCP)

```bash
claude mcp add mendix-copilot -- node dist/index.js --app-id "your_app_id" --branch "main"
claude mcp list
```

## Codex setup (MCP)

```bash
codex mcp add mendix-copilot -- node dist/index.js --app-id "your_app_id" --branch "main"
codex mcp list
```

## Waar vind je App ID en PAT?

1. App ID:
- Open Mendix Developer Portal.
- Ga naar je app.
- Open de General pagina.
- Kopieer de App ID.

2. Personal Access Token:
- Ga naar Mendix user settings.
- Maak een nieuwe PAT aan met API toegang.
- Zet de token in `MENDIX_TOKEN`.

Extra stap-voor-stap voor Codex staat in `docs/HOW-TO-USE-CODEX.md`.

## Handmatige testflows

- MCP server: `tests/MANUAL-TEST.md`
- Web UI + API: `tests/MANUAL-WEB-UI.md`

## Architectuur en roadmap

- Architectuur: `docs/ARCHITECTURE.md`
- Web UI ontwerp: `docs/WEB_UI.md`
- Studio Pro integratievooruitblik: `docs/STUDIO_PRO_INTEGRATION.md`
- MVP plan: `docs/MVP-PLAN.md`
- Development workflow: `docs/DEVELOPMENT.md`

## Licentie

MIT
