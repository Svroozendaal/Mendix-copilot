# Decisions Log
## Project: Mendix Studio Pro 10 Git Changes Extension
## Decision 5.5a - mx.exe location discovery - 2026-02-17 21:28:55
- Check PATH entries for mx.exe first.
- Query Studio Pro install locations from Windows Registry under HKLM/HKCU (32-bit and 64-bit views).
- Fall back to Program Files and Program Files (x86) Mendix installation folders.
- If unresolved, raise: "Studio Pro 10 not detected: mx.exe not found."
## Decision 5.5b - model diff strategy - 2026-02-17 21:28:55
- For .mpr changes, generate working and HEAD JSON dumps via mx.exe dump-mpr.
- HEAD .mpr is reconstructed from Git blob content when available.
- Missing side (new/deleted file) is represented as an empty model dump.
- Compare dump sections (Entities, Pages, Microflows) structurally.
## Decision 5.5c - UI exposure of model changes - 2026-02-17 21:28:55
- Extend GitFileChange payload with ModelChanges.
- WinForms panel shows grouped model changes in a TreeView below file list when .mpr is selected.
- Embedded panel view also renders grouped model changes for active row.
## Decision 5.5d - performance and failure behavior - 2026-02-17 21:28:55
- All heavy work remains off the UI thread by keeping GitChangesService execution under existing Task.Run usage.
- MPR model extraction is best effort; failures do not block file-level change visibility.
- Temporary files are always cleaned up in finally blocks.
## Decision 5.5e - MPR v2 handling - 2026-02-17 21:28:55
- Phase 5.5 stays with dump-mpr based extraction and does not implement mprcontents XML diffing.
- MPR v2 optimized path remains a future phase item.
## Phase 5.5 file plan - 2026-02-17 21:28:55
Files created:
- studio-pro-extension-csharp/MxToolService.cs
- studio-pro-extension-csharp/MendixModelDiffService.cs
- studio-pro-extension-csharp/MendixModelChange.cs
Files modified:
- studio-pro-extension-csharp/GitChangesService.cs
- studio-pro-extension-csharp/GitChangesPayload.cs
- studio-pro-extension-csharp/ChangesPanel.cs
- studio-pro-extension-csharp/ChangesPanel.Designer.cs
- studio-pro-extension-csharp/GitChangesPanelHtml.cs
