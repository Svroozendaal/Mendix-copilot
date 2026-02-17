# Mendix Copilot

Mendix Copilot is opgesplitst in een herbruikbare backend-core met drie UI-hosts:

1. Localhost web UI
2. Studio Pro 11 dockable panel (TypeScript web extension)
3. Studio Pro 10 dockable panel (C# extension shell)

Alle hosts gebruiken dezelfde backend execution-flow:

- `POST /api/plan`
- `POST /api/plan/validate`
- `POST /api/plan/execute`
- SSE execution events

## Structuur

```text
mendix-copilot/
|- src/                           # backend/core + MCP + localhost API
|- web-ui/                        # localhost React UI
|- shared/                        # gedeeld bridge contract (WB_CONTEXT, etc.)
|- studio-pro-extension/          # Studio Pro 11 web extension (TS)
|- studio-pro-extension-csharp/   # Studio Pro 10 extension shell (C#)
|- commands/                      # PowerShell helper scripts (start/deploy)
|- docs/                          # architectuur en integratiedocumentatie
|- tests/                         # unit en manual tests
```

## Vereisten

- Node.js 20+
- Mendix PAT (`MENDIX_TOKEN`)
- Voor Studio Pro 10 extension build: .NET SDK 8.0

## Installatie

```bash
npm install
```

## Configuratie

Server-side variabelen (Node proces):

```bash
MENDIX_TOKEN=your_pat_token
MENDIX_APP_ID=your_app_id
MENDIX_BRANCH=main
COPILOT_API_PORT=8787
COPILOT_API_HOST=127.0.0.1
COPILOT_APPROVAL_TOKEN=change-me
```

Frontend variabele:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8787
```

Studio Pro panel poort override:

```bash
WB_COPILOT_WEB_UI_PORT=5173
```

Belangrijk: secrets blijven server-side, nooit in extension/frontend hardcoden.

## Development

Start backend API + localhost web UI:

```bash
npm run dev
```

Of via PowerShell helper:

```powershell
.\commands\start-copilot.ps1
```

Compatibiliteit:

```powershell
.\start-copilot.ps1
```

## Build matrix

```bash
npm run build:backend            # Node/TS backend + MCP code
npm run build:ui:web             # localhost web UI
npm run build:ui:studio-pro-11   # Studio Pro 11 extension
npm run build:ui:studio-pro-10   # Studio Pro 10 C# extension
npm run build:all-hosts          # alles in 1 command
```

## Studio Pro hosts

### Studio Pro 11 (TypeScript)

- Map: `studio-pro-extension/`
- Install/build instructies: `studio-pro-extension/README.md`

### Studio Pro 10 (C# shell)

- Map: `studio-pro-extension-csharp/`
- Install/build instructies: `studio-pro-extension-csharp/README.md`
- Snelle deploy helper:

```powershell
.\commands\deploy-studio-pro10-panel.ps1 "C:\Pad\Naar\Jouw\MendixAppMap"
```

## API gedrag

De embedded Studio Pro hosts dupliceren geen planner/executor.
De web UI (los of embedded) roept dezelfde localhost API aan:

- planning: `/api/plan`
- validatie: `/api/plan/validate`
- execute: `/api/plan/execute`
- streaming: SSE in browser UI

## Documentatie

- Architectuur: `docs/ARCHITECTURE.md`
- Beslissingen: `docs/DECISIONS.md`
- Studio Pro integratie: `docs/STUDIO_PRO_INTEGRATION.md`
- Web UI: `docs/WEB_UI.md`
- Documentatiestandaard: `docs/DOCUMENTATION_STANDARD.md`
- Volledig projectoverzicht: `docs/PROJECT_OVERVIEW.md`
- Development workflow: `docs/DEVELOPMENT.md`
- Codex setup: `docs/HOW-TO-USE-CODEX.md`

## Licentie

MIT
