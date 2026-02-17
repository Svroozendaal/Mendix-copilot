# PHASE 3 MASTERPROMPT — Implementation
## Mendix Studio Pro 10 — Git Changes Extension

---

## Prerequisites

Before running this prompt, confirm:
- Phase 2 has completed successfully
- `./claude/agent-memory/DECISIONS_LOG.md` contains the full architecture plan
- `SESSION_STATE.md` shows `NEXT_AGENT: Implementer`
- No open blockers

---

## Instructions for Codex

You are now acting as the **Implementer Agent**. Read `./agents/IMPLEMENTER.md` for your full identity, coding standards, and operating rules.

Work through the files in the exact order specified below. After each file, run `dotnet build` and confirm it passes before continuing. Do not proceed to the next file if the build is broken.

---

## Step 1 — Load context

Read in order:
1. `./claude/agent-memory/SESSION_STATE.md`
2. `./claude/agent-memory/DECISIONS_LOG.md` ← Your blueprint. Follow it exactly.

Confirm:
```
✓ Context loaded. Beginning implementation.
✓ Architecture plan found, [X] decisions logged.
```

---

## Step 2 — Update .csproj

Add the LibGit2Sharp NuGet reference to the existing `.csproj` file.

```xml
<PackageReference Include="LibGit2Sharp" Version="0.30.0" />
```

Then run:
```
dotnet restore
```

Confirm:
```
✓ LibGit2Sharp added to .csproj
✓ dotnet restore: PASS
```

**If the restore fails:** Write a BLOCKER to `SESSION_STATE.md` and stop. Do not continue.

---

## Step 3 — Create GitChangesPayload.cs

Create `GitChangesPayload.cs` in the extension project directory.

Requirements:
- Two `sealed record` types: `GitFileChange` and `GitChangesPayload`
- `GitFileChange` has: `FilePath` (string), `Status` (string), `IsStaged` (bool), `DiffText` (string)
- `GitChangesPayload` has: `IsGitRepo` (bool), `BranchName` (string), `Changes` (IReadOnlyList<GitFileChange>), `Error` (string?)
- XML doc comments on every type and property
- Namespace matches existing project namespace

Run `dotnet build`. Confirm PASS before continuing.

Log to `PROGRESS.md`:
```
## GitChangesPayload.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 4 — Create GitChangesService.cs

Create `GitChangesService.cs` in the extension project directory.

Requirements:
- `public static class GitChangesService`
- Single public method: `public static GitChangesPayload ReadChanges(string projectPath)`
- Uses `Repository.Discover(projectPath)` — returns `IsGitRepo: false` payload if null
- Uses `repo.RetrieveStatus()` with `PathSpec = new[] { "*.mpr", "*.mprops" }`
- Determines `Status` string from `FileStatus` flags: Modified, Added, Deleted, Renamed
- Determines `IsStaged` from whether the status is in the staged (index) category
- Gets diff text via `repo.Diff.Compare<Patch>()` for text files
- For binary files (detected by `IsBinary` on the patch entry), sets `DiffText = "Binary file changed — diff not available"`
- For files where diff fails, sets `DiffText = "Diff unavailable"`
- Catches ALL exceptions: `RepositoryNotFoundException` → `IsGitRepo: false`, all others → `Error` field populated
- All Git operations in a single try/catch — no partial payloads

Run `dotnet build`. Confirm PASS before continuing.

Log to `PROGRESS.md`:
```
## GitChangesService.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 5 — Create ChangesPanel.Designer.cs

Create the WinForms Designer file for `ChangesPanel`.

Requirements:
- Follows the control hierarchy from `DECISIONS_LOG.md` exactly
- All controls initialized in `private void InitializeComponent()`
- `SplitContainer` with `Orientation.Vertical`, `SplitterDistance` = 300
- `ListView` in `Panel1`: `View = View.Details`, `FullRowSelect = true`, `GridLines = true`
- Columns: `Name` (180px), `Path` (200px), `Status` (90px), `Staged` (80px)
- `RichTextBox` in `Panel2`: `ReadOnly = true`, `Font = new Font("Courier New", 9f)`, `WordWrap = false`
- `Panel` at top: `Height = 36`, contains `lblBranch` (Label, left-anchored) and `btnRefresh` (Button, right-anchored, text = "↺  Refresh")
- `Label` at bottom: `Height = 22`, `lblStatus`, text = "Ready"
- `Dock = DockStyle.Fill` on the SplitContainer

Run `dotnet build`. Confirm PASS before continuing.

Log to `PROGRESS.md`:
```
## ChangesPanel.Designer.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 6 — Create ChangesPanel.cs

Create the code-behind for `ChangesPanel`.

Requirements:
- `public partial class ChangesPanel : UserControl`
- Color constants for each status (values from `DECISIONS_LOG.md`)
- `private void btnRefresh_Click(...)` — async pattern: disable button, `Task.Run` → `GitChangesService.ReadChanges()` → `this.Invoke(UpdateUI)` → re-enable button
- `private void UpdateUI(GitChangesPayload payload)` — populates `lvChanges` and `lblStatus`, handles all error/empty states
- `private void lvChanges_SelectedIndexChanged(...)` — updates `rtbDiff` with selected file's `DiffText`
- `private void SetListViewItemColor(ListViewItem item, string status)` — applies color constants
- Status messages:
  - `IsGitRepo == false` → `lblStatus.Text = "Not a Git repository"`, clear ListView
  - `Error != null` → `lblStatus.Text = $"Error: {payload.Error}"`, clear ListView  
  - `Changes.Count == 0` → `lblStatus.Text = "No uncommitted changes"`
  - Otherwise → `lblStatus.Text = $"{payload.Changes.Count} file(s) changed  ·  {payload.BranchName}"`
- `lblBranch.Text` always updated with branch name (or empty if not a Git repo)

Run `dotnet build`. Confirm PASS before continuing.

Log to `PROGRESS.md`:
```
## ChangesPanel.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 7 — Register the dockable pane

Modify the existing extension class to add `GetDockablePanes()`.

Requirements:
- Add method to implement dockable pane registration
- Use the stable GUID from `DECISIONS_LOG.md`
- Title: `"Git Changes"`
- Factory creates a new `ChangesPanel()` instance
- Do not modify any existing methods — purely additive

Run `dotnet build`. Confirm final clean build.

Log to `PROGRESS.md`:
```
## [ExistingExtension].cs — MODIFIED — [timestamp]
Build status: PASS
Change: Added GetDockablePanes() method
```

---

## Step 8 — Final build check

Run a clean build:
```
dotnet clean
dotnet build
```

Verify:
- Exit code 0
- Zero errors
- Zero warnings (or document any acceptable warnings)
- `runtimes/win-x64/native/git2-*.dll` present in output directory

---

## Step 9 — Write implementation complete

Update `SESSION_STATE.md`:

```
## HANDOFF — Implementer — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Tester
SUMMARY: 5 files created/modified. Clean build passing. LibGit2Sharp native DLLs confirmed in output.
BLOCKERS: none
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 3 COMPLETE — Implementation       ║
╠══════════════════════════════════════════╣
║  Files created:  4                       ║
║  Files modified: 1 (.csproj + ext class) ║
║  Build status:   PASS                    ║
║  Native DLLs:    PRESENT                 ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Run: prompts/PHASE_4_TESTING.md         ║
║  Lead agent: Tester                      ║
╚══════════════════════════════════════════╝
```
