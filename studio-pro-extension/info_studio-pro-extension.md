# info_studio-pro-extension

Laatst bijgewerkt: 2026-02-16

## Doel

Deze map bevat de Mendix Studio Pro 11 web extension `WellBased Copilot Panel`.
De extension is bewust een thin shell die de bestaande localhost web UI embedt.

## Inhoud

- `package.json`: extension manifest (`mendixComponent.entryPoints`) en build scripts
- `scripts/build.mjs`: bundelt main/UI entrypoints naar `dist/`
- `src/main/index.ts`: registreert dockable pane + extensions menu + context bridge
- `src/ui/dockablepane.ts`: hostt embedded localhost UI in een iframe met fallback
- `src/shared/context.ts`: contract en type guards voor `WB_CONTEXT` messaging
- `README.md`: prerequisites, build en installatie in Studio Pro 11

## Samenwerking met rest van repo

- Hergebruikt bestaande `web-ui` zonder duplicatie van planner/executor
- Houdt secrets buiten de extension (alleen localhost URL en context messaging)
- Stuurt context naar web UI via `window.postMessage`
- Voor Studio Pro 10 staat een aparte C# shell in `../studio-pro-extension-csharp/`
