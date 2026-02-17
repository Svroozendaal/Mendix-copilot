# PRODUCT PLAN
## Mendix Studio Pro 10 — Git Changes Extension

---

## Vision

A lightweight, native dockable pane inside Mendix Studio Pro 10 that gives developers instant visibility into their uncommitted Git changes — without leaving the IDE. The panel mirrors the familiar "Changes" view of Studio Pro but is fully developer-controlled, extensible, and designed as the data foundation for an AI-powered commit message generator in a future phase.

---

## Problem Statement

Mendix developers working with Git-based projects currently have to:
- Switch to an external Git client (SourceTree, GitKraken, terminal) to see what changed
- Or rely on Studio Pro's built-in Changes tab, which cannot be extended or read programmatically

There is no programmatic way within a Studio Pro extension to access version control data. This extension solves that by reading Git state directly from the filesystem using LibGit2Sharp, bypassing the limitation entirely.

---

## Phase 1 (Current) — Git Changes Viewer

### Goal
Display uncommitted Git changes in a native dockable pane inside Studio Pro 10.

### Functional Requirements

| # | Requirement | Priority |
|---|---|---|
| F1 | Show all uncommitted changes (.mpr and .mprops files) | Must have |
| F2 | Display file name, relative path, and status (Modified / Added / Deleted / Renamed) | Must have |
| F3 | Show whether each file is staged or unstaged | Must have |
| F4 | Show a text diff for each selected file | Must have |
| F5 | Show "Binary file changed" for .mpr files (no raw diff) | Must have |
| F6 | Manual refresh button | Must have |
| F7 | Show current branch name | Must have |
| F8 | Graceful message when project is not a Git repo | Must have |
| F9 | Graceful message when no changes are present | Must have |

### Technical Requirements

| # | Requirement |
|---|---|
| T1 | Studio Pro 10 ExtensionsAPI only — no SP11 APIs |
| T2 | WinForms UserControl as dockable pane |
| T3 | LibGit2Sharp 0.30.0 for Git reading |
| T4 | Git operations on background thread, UI on main thread |
| T5 | PathSpec filtered to *.mpr and *.mprops |
| T6 | No auto-refresh — user-initiated only |
| T7 | All errors caught and displayed as human-readable messages |

### Deliverables

- `GitChangesPayload.cs` — data transfer objects
- `GitChangesService.cs` — Git reading service
- `ChangesPanel.cs` + `ChangesPanel.Designer.cs` — WinForms UI
- Updated existing extension class with `GetDockablePanes()`
- Updated `.csproj` with LibGit2Sharp dependency

---

## Phase 2 (Future) — AI Commit Message Generator

### Goal
Use the Git changes data from Phase 1 as input to an AI model that generates a descriptive, context-aware commit message.

### Planned additions
- "Generate commit message" button in the ChangesPanel
- Serialization of `GitChangesPayload` to JSON
- API call to Claude (Anthropic API) with changes as context
- Generated message shown in an editable text field
- One-click commit with the generated message

### Data contract (prepared in Phase 1)
The `GitChangesPayload` already captures everything Phase 2 needs:
- `BranchName` — feature/fix context for the AI
- `Changes[].FilePath` + `Changes[].Status` — what changed
- `Changes[].DiffText` — the actual content changes

No changes to `GitChangesPayload.cs` or `GitChangesService.cs` will be needed in Phase 2. Only the UI and a new API layer are added.

---

## Architecture Overview

```
Studio Pro 10 (ExtensionsAPI)
└── ChangesPanel (WinForms dockable pane)
    ├── [Refresh Button] ──► GitChangesService.ReadChanges(projectPath)
    │                             └── Repository.Discover(path)         [LibGit2Sharp]
    │                             └── repo.RetrieveStatus(options)      [LibGit2Sharp]
    │                             └── repo.Diff.Compare(...)            [LibGit2Sharp]
    │                             └── returns GitChangesPayload
    ├── ListView (files)   ◄── GitChangesPayload.Changes
    └── RichTextBox (diff) ◄── GitFileChange.DiffText (selected row)
```

---

## Constraints

- **Studio Pro 10 only** — the ExtensionsAPI surface is fixed to SP10
- **Git only** — SVN and Team Server are explicitly out of scope
- **.mpr is binary** — meaningful diff is not possible; this is by design
- **No web technologies** — no WebView2, no HTML, no JavaScript in the extension
- **Additive only** — existing extension code must not be broken

---

## Success Criteria (Phase 1)

The extension is considered complete when:

1. The dockable pane opens in Studio Pro 10 without errors
2. On refresh, all uncommitted .mpr/.mprops changes appear in the list with correct status and color
3. Selecting a file shows the diff (or binary notice) in the right pane
4. Opening a non-Git project shows the correct "not a Git repo" message
5. Opening a project with no changes shows "no changes" message
6. `dotnet build` completes without errors or warnings about missing native DLLs
7. LibGit2Sharp native DLLs are present in the build output
