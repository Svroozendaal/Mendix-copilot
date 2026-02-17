# Studio Pro Integratie

> Laatst bijgewerkt: 2026-02-16

## Doel

Studio Pro integratie draait als niveau B thin shell:

- panel hostt de bestaande localhost web UI
- backend blijft bestaande Node/TS API
- geen secrets in extension code

## Variants

### 1) Studio Pro 11 - web extension

- Locatie: `studio-pro-extension/`
- Technologie: TypeScript + `@mendix/extensions-api`
- Pane embedt localhost UI direct via iframe

### 2) Studio Pro 10 - C# extension shell

- Locatie: `studio-pro-extension-csharp/`
- Technologie: `Mendix.StudioPro.ExtensionsAPI` (C#)
- Pane laadt interne wrapper-pagina die localhost UI embedt via iframe

## API hergebruik (geen duplicatie)

Alle varianten gebruiken dezelfde backend endpoints:

- `POST /api/plan`
- `POST /api/plan/validate`
- `POST /api/plan/execute`
- SSE events voor execute (`command_start`, `command_success`, `command_failed`, `commit_done`, `postcheck_results`, `final`, `error`)

## Context bridge contract

### Message types

- `WB_CONTEXT`
- `WB_CONTEXT_REQUEST`
- `WB_EMBEDDED`

### Payload (`WB_CONTEXT`)

```json
{
  "selectedType": "module|entity|microflow|page|null",
  "qualifiedName": "optional",
  "module": "optional"
}
```

### Bronnen

- Studio Pro 11: active document info uit web extensions API
- Studio Pro 10: `ActiveDocumentChanged` event uit C# extensions API

Bij ontbrekende context: fallback naar `selectedType: null`.

## Embedded UI gedrag

- web UI detecteert embedded mode via `?embedded=1` en/of `WB_EMBEDDED`
- UI toont badge: `Running inside Studio Pro`
- ontvangen `WB_CONTEXT` stuurt sidebar highlight + default plan-context

## Port/fallback gedrag

Panel zoekt localhost UI in volgorde:

1. `WB_COPILOT_WEB_UI_PORT`
2. `localStorage['wb.copilot.webUiPort']`
3. `5173`
4. `3000`

Als niet bereikbaar:

`Copilot UI is not running. Start it with: npm run dev`

## Security

- Geen tokens/secrets in Studio Pro extensions
- Secrets alleen server-side in Node `.env` / process env
