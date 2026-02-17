# PHASE 2 MASTERPROMPT — Planning & Architecture
## Mendix Studio Pro 10 — Git Changes Extension

---

## Prerequisites

Before running this prompt, confirm:
- Phase 1 has completed successfully
- `./claude/agent-memory/SESSION_STATE.md` shows `NEXT_AGENT: Architect`
- No open blockers in `SESSION_STATE.md`

---

## Instructions for Codex

You are now acting as the **Architect Agent**. Read `./agents/ARCHITECT.md` for your full identity and operating rules.

Your goal in this phase is to produce a complete, unambiguous implementation plan that the Implementer can execute without asking a single question.

---

## Step 1 — Load context

Read in order:
1. `./claude/agent-memory/SESSION_STATE.md`
2. `./claude/agent-memory/DECISIONS_LOG.md`
3. `./PRODUCT_PLAN.md`
4. `./AGENTS.md` — specifically sections 7 (rules) and 8 (target file structure)

Confirm:
```
✓ Context loaded. Extension class: [path]
```

---

## Step 2 — Inspect the existing extension project

Examine the existing `.csproj` file and the extension class identified in Phase 1.

Determine:
- Current .NET target framework version
- Existing NuGet references
- Which interface the extension class implements
- Which methods already exist
- What namespace is used

Output a structured summary:
```
## Existing Project Profile
Target framework: [version]
Existing packages: [list]
Extension interface: [name]
Existing methods: [list]
Namespace: [name]
```

---

## Step 3 — Finalize architecture decisions

Make the following decisions and record each one in `./claude/agent-memory/DECISIONS_LOG.md` using the format from `agents/ARCHITECT.md`.

### Decision 3a — GUID for the dockable pane
Generate a stable GUID for the `ChangesPanel` dockable pane registration. This must be hardcoded (not generated at runtime). Record it in the decisions log.

### Decision 3b — Dockable pane registration method
Confirm the exact method signature for `GetDockablePanes()` in the SP10 ExtensionsAPI. If uncertain, flag as VERIFY.

### Decision 3c — SplitContainer orientation
Decide: horizontal split (file list top, diff bottom) or vertical split (file list left, diff right). Default: vertical (file list left, diff right), matching standard Git clients.

### Decision 3d — ListView column layout
Define the exact columns: name, header text, width in pixels.

### Decision 3e — Async refresh pattern
Confirm the `Task.Run` + `Control.Invoke` pattern is used. No `async void` except for event handlers.

### Decision 3f — LibGit2Sharp PathSpec
Confirm `PathSpec = new[] { "*.mpr", "*.mprops" }` is the correct filter. Note that this means Java changes, custom widgets, and resources will NOT appear — this is intentional.

---

## Step 4 — Produce the implementation plan

Write the full plan to `./claude/agent-memory/DECISIONS_LOG.md`. The plan must include:

### 4a — Exact file list
For every file to be created or modified:
```
File: [path/filename]
Action: CREATE | MODIFY
Purpose: [one sentence]
Depends on: [other files that must exist first]
```

### 4b — Complete class and method signatures
For every class and public method:
```csharp
// GitChangesPayload.cs
public sealed record GitFileChange(
    string FilePath,
    string Status,
    bool IsStaged,
    string DiffText
);

// [all other signatures]
```

### 4c — WinForms control hierarchy
List every control in `ChangesPanel` with its type, name, and parent:
```
ChangesPanel (UserControl)
  ├── pnlTop (Panel)
  │   ├── lblBranch (Label)
  │   └── btnRefresh (Button)
  ├── splitContainer (SplitContainer)
  │   ├── Panel1
  │   │   └── lvChanges (ListView)
  │   └── Panel2
  │       └── rtbDiff (RichTextBox)
  └── lblStatus (Label)
```

### 4d — Color constants
Define the exact `Color` values for each Git status in `ChangesPanel.cs`.

---

## Step 5 — Risk assessment

Identify and document all risks with mitigations. At minimum, address:

- LibGit2Sharp native DLL deployment alongside the Studio Pro extension
- `.mpr` binary diff behavior
- Studio Pro extension loading order (is `CurrentApp` available immediately?)
- Thread safety of `ListView` updates

---

## Step 6 — Sign off

Confirm the plan is complete by writing to `SESSION_STATE.md`:

```
## HANDOFF — Architect — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Implementer
SUMMARY: Architecture plan complete. [X] files to create, [Y] to modify. All decisions logged.
BLOCKERS: none
```

Then output:
```
╔══════════════════════════════════════════╗
║  PHASE 2 COMPLETE — Planning             ║
╠══════════════════════════════════════════╣
║  Decisions recorded: [count]             ║
║  Files planned: [count]                  ║
║  Risks identified: [count]               ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Run: prompts/PHASE_3_IMPLEMENTATION.md  ║
║  Lead agent: Implementer                 ║
╚══════════════════════════════════════════╝
```
