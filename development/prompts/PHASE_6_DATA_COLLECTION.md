# PHASE 6 MASTERPROMPT — Data Collection & Export
## Mendix Studio Pro 10 — Git Changes Extension

---

## Purpose

Phase 6 extends the Git Changes extension with a **data export capability**. The goal is to collect real-world commit data from developers using the extension so that a commit parser agent can later be trained on this data. The export writes structured JSON files to a shared folder that a separate application monitors.

This phase produces:
1. An "Export Changes" button in the ChangesPanel UI
2. JSON serialization of the full change set with metadata
3. A shared folder structure for the receiving application to read

---

## Prerequisites

Before running this prompt, confirm:
- Phase 1-5 have completed successfully
- The extension builds cleanly and passes all tests
- `SESSION_STATE.md` shows Phase 5 approved
- You have decided on the shared folder path (default: `C:\MendixGitData\exports\`)

---

## Instructions for Codex

You are now acting as the **Architect Agent** (for planning) followed by the **Implementer Agent** (for execution). Switch agents at Step 3.

---

## Step 1 — Load context (Architect)

Read in order:
1. `./claude/agent-memory/SESSION_STATE.md`
2. `./claude/agent-memory/DECISIONS_LOG.md`
3. `./PRODUCT_PLAN.md`

Confirm:
```
✓ Phase 5 approved — base extension is complete
✓ Beginning Phase 6 — Data Collection
```

---

## Step 2 — Architecture decisions (Architect)

Make and record these decisions in `DECISIONS_LOG.md`:

### Decision 6a — Export data structure
Define the exact JSON schema for exported change sets. Must include:
- `timestamp` (ISO 8601 string)
- `projectName` (string — extracted from project directory name)
- `branchName` (string — from GitChangesPayload)
- `userName` (string — from `git config user.name`)
- `userEmail` (string — from `git config user.email`)
- `changes` (array of objects with: `filePath`, `status`, `isStaged`, `diffText`)

Example:
```json
{
  "timestamp": "2025-02-17T14:32:00Z",
  "projectName": "MyMendixApp",
  "branchName": "feature/new-dashboard",
  "userName": "Mister Mo",
  "userEmail": "mo@example.com",
  "changes": [
    {
      "filePath": "MyModule/Domain/Entity.mpr",
      "status": "Modified",
      "isStaged": false,
      "diffText": "Binary file changed — diff not available"
    }
  ]
}
```

### Decision 6b — Export folder structure
Define the shared folder layout:
```
C:\MendixGitData\
├── exports\                    ← Extension writes here
│   └── [timestamp]_[project].json
└── processed\                  ← Receiving app moves files here after reading
    └── [timestamp]_[project].json
```

The extension writes to `exports\`. The receiving app is responsible for moving files to `processed\` once read.

### Decision 6c — File naming convention
Format: `[ISO8601-timestamp]_[projectName].json`
Example: `2025-02-17T14-32-00Z_MyMendixApp.json`
(Note: colons replaced with hyphens for Windows filesystem compatibility)

### Decision 6d — UI placement
Add a button to `ChangesPanel` next to the Refresh button:
- Text: `"Export Changes"`
- Enabled only when: `lvChanges.Items.Count > 0` (there are changes to export)
- Shows success message after export: `"Exported X changes to [path]"`

### Decision 6e — Git user info retrieval
Use LibGit2Sharp to read Git config:
```csharp
var config = repo.Config;
var userName = config.GetValueOrDefault<string>("user.name", "Unknown");
var userEmail = config.GetValueOrDefault<string>("user.email", "unknown@example.com");
```

---

## Step 3 — Switch to Implementer

Write to `SESSION_STATE.md`:
```
## HANDOFF — Architect — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Implementer
SUMMARY: Export architecture defined. JSON schema, folder structure, UI button specified.
BLOCKERS: none
```

**Now switch to Implementer agent.** Read `./agents/IMPLEMENTER.md` and continue below.

---

## Step 4 — Create ExportService.cs (Implementer)

Create a new static service class `ExportService.cs` in the extension project.

Requirements:
- `public static class ExportService`
- Single public method: `public static string ExportChanges(GitChangesPayload payload, string projectPath, string exportFolderPath)`
- Reads Git user name and email from `repo.Config` (handle missing values gracefully)
- Extracts project name from the last directory segment of `projectPath`
- Generates ISO 8601 timestamp (UTC) with colons replaced by hyphens for filename
- Serializes the full export object to JSON using `System.Text.Json.JsonSerializer`
- Writes to `exportFolderPath\exports\[filename].json`
- Creates the `exports\` directory if it does not exist
- Returns the full file path on success
- Throws `IOException` on write failure (caller must catch)

Error handling:
- If `exportFolderPath` does not exist, create it
- If file write fails, let the exception propagate (the UI will catch it)

Run `dotnet build`. Confirm PASS.

Log to `PROGRESS.md`:
```
## ExportService.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 5 — Update ChangesPanel UI (Implementer)

Modify `ChangesPanel.Designer.cs` and `ChangesPanel.cs`:

### Designer changes:
- Add `btnExport` (Button) next to `btnRefresh` in the top panel
- Text: `"📤 Export Changes"`
- Width: 120px
- Enabled: false (initially — will be enabled when changes exist)

### Code-behind changes:
- Add constant: `private const string DEFAULT_EXPORT_FOLDER = @"C:\MendixGitData";`
- Add method: `private void btnExport_Click(object sender, EventArgs e)`
  - Disable `btnExport` during operation
  - Call `ExportService.ExportChanges(lastPayload, projectPath, DEFAULT_EXPORT_FOLDER)` on background thread
  - On success: show message `lblStatus.Text = $"✓ Exported {count} changes to {filePath}"`
  - On error: show message `lblStatus.Text = $"Export failed: {ex.Message}"`
  - Re-enable `btnExport` in finally block
- In `UpdateUI()`: enable `btnExport` only if `payload.Changes.Count > 0`

Thread safety:
- Use `Task.Run` for the export operation (file I/O should not block UI)
- Use `this.Invoke()` for all UI updates from the background thread

Run `dotnet build`. Confirm PASS.

Log to `PROGRESS.md`:
```
## ChangesPanel.cs — MODIFIED — [timestamp]
Build status: PASS
Change: Added Export button and ExportService integration
```

---

## Step 6 — Update the receiving app structure (Implementer)

**Wait — this is a separate app. Do not create code for it yet.** Instead, document the contract.

Create a new file: `./claude/agent-memory/EXPORT_CONTRACT.md`

Content:
```markdown
# Export Data Contract
## Mendix Git Changes Extension → Commit Parser Agent

## Folder watched by receiving app
`C:\MendixGitData\exports\`

## File format
JSON, UTF-8 encoded

## Schema
See Decision 6a in DECISIONS_LOG.md

## Processing protocol
1. Receiving app watches `exports\` folder
2. When a new .json file appears, read it
3. Parse and process the commit data
4. Move the file to `C:\MendixGitData\processed\` (or delete)
5. Never leave files in `exports\` — it will fill up

## Error handling
If a file in `exports\` is malformed JSON:
- Move it to `C:\MendixGitData\errors\` for manual inspection
- Log the error but do not crash the watcher

## Receiving app will be built in Phase 7.
```

---

## Step 7 — Test the export (Implementer)

Perform a code path trace:

1. Developer opens a Git project with changes
2. Clicks Refresh → `lvChanges` populates → `btnExport` becomes enabled
3. Clicks Export Changes → `Task.Run` → `ExportService.ExportChanges()`
4. JSON file written to `C:\MendixGitData\exports\[timestamp]_[project].json`
5. Success message shown in `lblStatus`

Trace potential failures:
- No write permission to `C:\MendixGitData` → `IOException` caught, error shown
- Disk full → `IOException` caught, error shown
- User name/email not in Git config → defaults used ("Unknown", "unknown@example.com")

Document trace results in `REVIEW_NOTES.md` under a new section "Phase 6 Testing".

---

## Step 8 — Write completion

Update `SESSION_STATE.md`:

```
## HANDOFF — Implementer — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Tester
SUMMARY: Export button added. ExportService implemented. Default folder: C:\MendixGitData. Build passing.
BLOCKERS: none
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 6 COMPLETE — Data Collection      ║
╠══════════════════════════════════════════╣
║  New files:      1 (ExportService.cs)    ║
║  Modified files: 2 (Panel Designer + CS) ║
║  Build status:   PASS                    ║
║  Export folder:  C:\MendixGitData        ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Run: prompts/PHASE_7_COMMIT_PARSER.md   ║
║  Lead agent: Architect                   ║
╠══════════════════════════════════════════╣
║  MANUAL TEST:                            ║
║  1. Load extension in Studio Pro 10      ║
║  2. Make local changes, click Refresh    ║
║  3. Click "Export Changes"               ║
║  4. Verify JSON file in C:\MendixGitData ║
╚══════════════════════════════════════════╝
```

---

## Notes

- The receiving app (Phase 7) will be a **separate** application, not part of the Studio Pro extension
- Phase 7 will build a file watcher + commit parser agent that reads the exported JSON files
- This phase does NOT build the parser — only the export side
