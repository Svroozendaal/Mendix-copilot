# info_studio-pro-extension-csharp

> Last updated: 2026-02-17

## Purpose

Studio Pro 10 extension that shows Git changes for Mendix files in a dockable pane. The pane is fully served by the extension itself and does not require a local dev web server.

## Key files

| File | Purpose |
|---|---|
| `AutoCommitMessage.csproj` | Build config + package references |
| `manifest.json` | Mendix extension manifest (`AutoCommitMessage.dll`) |
| `ExtensionConstants.cs` | Shared pane and route constants |
| `GitChangesDockablePaneExtension.cs` | Dockable pane entrypoint |
| `GitChangesDockablePaneViewModel.cs` | WebView pane view model |
| `GitChangesWebServerExtension.cs` | Internal route that renders panel HTML |
| `GitChangesPanelHtml.cs` | In-extension Git changes UI |
| `GitChangesService.cs` | Reads Git status/diffs via LibGit2Sharp |
| `GitChangesPayload.cs` | DTOs for changes payload |
| `ChangesPanel.cs` | Native WinForms panel implementation |

## Runtime flow

1. Menu opens pane by ID.
2. Pane loads extension route (`autocommitmessage`).
3. Route reads current app path and calls `GitChangesService.ReadChanges(...)`.
4. HTML renders file list, staged status, and selected diff.
5. Refresh reloads the route and fetches current Git state.
