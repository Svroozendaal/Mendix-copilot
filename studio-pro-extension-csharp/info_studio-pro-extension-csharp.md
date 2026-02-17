# info_studio-pro-extension-csharp

> Laatst bijgewerkt: 2026-02-16

## Doel

C# shell extension voor Mendix Studio Pro 10.x die de bestaande localhost Copilot web UI embedt in een dockable pane.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| WellBased.Copilot.StudioPro10.csproj | Buildconfig + Mendix Extensibility API package (`10.24.15-build.93102`) | Geimplementeerd |
| manifest.json | Studio Pro extension manifest (DLL entry) | Geimplementeerd |
| CopilotConstants.cs | Gedeelde constants voor pane, messaging en poorten | Geimplementeerd |
| CopilotSettings.cs | Valideert/normaliseert poortinstellingen | Geimplementeerd |
| StudioContextPayload.cs | Payloadmodel voor `WB_CONTEXT` berichten | Geimplementeerd |
| StudioContextMapper.cs | Map ActiveDocumentChanged -> context payload | Geimplementeerd |
| StudioContextBridge.cs | WebView message bridge en context push | Geimplementeerd |
| CopilotDockablePaneExtension.cs | Dockable pane extension entrypoint | Geimplementeerd |
| CopilotDockablePaneViewModel.cs | WebView pane viewmodel + lifecycle | Geimplementeerd |
| CopilotMenuExtension.cs | Extensions-menu items (open/close panel) | Geimplementeerd |
| CopilotWebServerExtension.cs | Interne route die wrapper HTML serveert | Geimplementeerd |
| CopilotPanelHtml.cs | Wrapper UI (fallback + iframe embed + postMessage bridge) | Geimplementeerd |
| README.md | Build/install instructies voor Studio Pro 10 | Geimplementeerd |

## Hoe het werkt

1. `CopilotMenuExtension` opent/sluit het pane.
2. `CopilotDockablePaneExtension` maakt een `WebViewDockablePaneViewModel`.
3. Pane laadt interne HTML via `CopilotWebServerExtension`.
4. Wrapper HTML zoekt localhost UI poort en embedt `http://localhost:<port>?embedded=1`.
5. `StudioContextBridge` pusht `WB_CONTEXT` berichten naar de web UI.
6. Web UI hergebruikt bestaande `/api/plan*` en SSE execution flow.

## Afhankelijkheden

- Mendix Extensibility API (`Mendix.StudioPro.ExtensionsAPI`)
- Bestaande Node/TS backend en web-ui processen
- `shared/studio-context.ts` als contractbron (string-contracten identiek)

## Bekende beperkingen

- C# shell leest alleen `ActiveDocumentChanged`; detailselectie binnen editors is best effort.
- Build vereist lokale .NET 8 SDK.
