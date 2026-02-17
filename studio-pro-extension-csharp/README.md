# WellBased Copilot Panel (Studio Pro 10)

C# Mendix Studio Pro extension voor Mendix 10.x die de bestaande localhost Copilot Web UI embedt in een dockable pane.

## Scope

- Niveau B shell: embedt de bestaande web UI in Studio Pro.
- Geen planner/executor duplicatie in de extension.
- Execution blijft via bestaande Node/TS backend:
  - `POST /api/plan`
  - `POST /api/plan/validate`
  - `POST /api/plan/execute`
  - SSE events vanuit de web UI.

## Prerequisites

- Mendix Studio Pro `10.24.x` (getest op `10.24.15`)
- .NET SDK 8.0
- Lokale Copilot backend + web UI (`npm run dev` in repo root)

## NuGet package versie

Voor Studio Pro 10.24.15 gebruikt dit project:

- `Mendix.StudioPro.ExtensionsAPI` `10.24.15-build.93102`

Dit voorkomt dat NuGet naar `11.0.0` doorschuift.

## Configuratie

- Optionele poortinstelling via environment variable:
  - `WB_COPILOT_WEB_UI_PORT`
- Runtime fallback volgorde in pane:
  1. `WB_COPILOT_WEB_UI_PORT`
  2. `localStorage['wb.copilot.webUiPort']`
  3. `5173`
  4. `3000`

Als de UI niet bereikbaar is toont het pane:
`Copilot UI is not running. Start it with: npm run dev`

## Build

```powershell
dotnet build .\studio-pro-extension-csharp\WellBased.Copilot.StudioPro10.csproj -c Release
```

Build output:

- `studio-pro-extension-csharp\bin\Release\net8.0\WellBased_Copilot_StudioPro10.dll`
- `studio-pro-extension-csharp\bin\Release\net8.0\manifest.json`

## Installatie in Studio Pro 10

1. Build de extension.
2. Kopieer `WellBased_Copilot_StudioPro10.dll` en `manifest.json` naar:
   - `%LocalAppData%\Mendix\StudioPro\Extensions\WellBased\CopilotPanel10\`
3. Start Studio Pro met extensibility flags.
4. Open je app.
5. Ga naar:
   - `Extensions -> WellBased_Copilot_StudioPro10 -> Open Panel`

### Snelle helper vanuit repo

Je kunt dit ook in 1 command doen (build + copy naar app `extensions` folder):

```powershell
.\commands\deploy-studio-pro10-panel.ps1 "C:\Pad\Naar\Jouw\MendixAppMap"
```

Het deploy-script verwijdert automatisch een oude legacy map met puntnotatie
(`extensions/WellBased.Copilot.StudioPro10`) om load errors te voorkomen.

## Context bridge

- Extension subscribe op `ActiveDocumentChanged`.
- Stuurt context naar de embedded web UI via webview postMessage:
  - message type `WB_CONTEXT`
  - payload:
    - `selectedType: module|entity|microflow|page|null`
    - `qualifiedName?: string`
    - `module?: string`
- Web UI gebruikt dit als default context voor plan calls.

## Security

- Geen secrets/tokens in deze extension.
- Tokens blijven server-side in Node (`.env` / procesomgeving).
