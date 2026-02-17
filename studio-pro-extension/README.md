# WellBased Copilot Panel (Studio Pro 11)

Studio Pro 11 web extension die de bestaande Copilot Web UI in een dockable pane embedt.

## Scope (MVP - niveau B)

- Dockable pane met embedded localhost web UI
- Thin shell: geen eigen planner/executor logica
- Bestaande backend/API blijft leidend:
  - `POST /api/plan`
  - `POST /api/plan/validate`
  - `POST /api/plan/execute`
  - SSE events voor execution

## Prerequisites

- Mendix Studio Pro 11 met Web Extensibility API support
- Node.js 20+
- Root project dependencies geinstalleerd (`npm install` in repo root)

## Configuratie

De pane probeert de Copilot web UI op deze volgorde:

1. `WB_COPILOT_WEB_UI_PORT` (build-time env var)
2. `localStorage['wb.copilot.webUiPort']` (runtime setting)
3. `5173`
4. `3000`

Standaard URL: `http://localhost:<port>?embedded=1`

## Build

Vanuit deze map:

```bash
npm install
npm run build
```

Of vanuit repo root:

```bash
npm run build:studio-pro-extension
```

Build output staat in `studio-pro-extension/dist/`.

## Installatie in Studio Pro

1. Build de extension.
2. Open Studio Pro.
3. Ga naar de Extensions manager.
4. Voeg de lokale extension toe vanuit `studio-pro-extension/` (map met `package.json` en `dist/*`).
5. Herstart Studio Pro indien gevraagd.
6. Open `Extensions -> WellBased Copilot Panel -> Open Panel`.

## Ontwikkel-flow

1. Start backend en web UI in de root:

```bash
npm run dev
```

2. Build extension opnieuw bij wijzigingen:

```bash
npm run build:studio-pro-extension
```

3. Herlaad de extension in Studio Pro.

## Fallback gedrag

Als de web UI niet bereikbaar is, toont het pane:

`Copilot UI is not running. Start it with: npm run dev`

## Security

- Geen tokens of secrets in deze extension
- Secrets blijven server-side in Node (`.env`, backend process)

## Variant

Voor Mendix Studio Pro 10 bestaat een aparte C# shell in:

- `studio-pro-extension-csharp/`
