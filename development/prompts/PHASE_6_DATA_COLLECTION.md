# PHASE 6 MASTERPROMPT - Data Collection and Export
## Mendix Studio Pro 10 - Git Changes Extension

---

## Purpose

Phase 6 adds export capability to collect real-world Git change data from Studio Pro users.
The extension writes structured JSON files to a shared folder for the future parser app in Phase 7.

This prompt is intentionally multi-agent and must use the full quality pipeline.

---

## Agent Execution Order

Follow this order exactly:
1. Memory (preflight)
2. Architect
3. Implementer
4. Tester
5. Reviewer
6. Prompt Refiner
7. Memory (closeout)

---

## Prerequisites

Before running this prompt, confirm:
- Phase 5.5 implementation is complete.
- `dotnet build` passes in the extension solution.
- No open blockers in session memory.
- A default export root is chosen (`C:\MendixGitData`).

---

## Path Resolution Rule (must do first)

This repository may use either `./.claude/agent-memory/` or `./claude/agent-memory/`.

At runtime:
1. If `./.claude/agent-memory/SESSION_STATE.md` exists, use `./.claude/agent-memory/` as `MEMORY_ROOT`.
2. Else use `./claude/agent-memory/` as `MEMORY_ROOT`.
3. Use `MEMORY_ROOT` consistently for all memory writes in this phase.

---

## Step 1 - Memory Preflight

Active agent: **Memory**

Read:
1. `MEMORY_ROOT/SESSION_STATE.md`
2. `MEMORY_ROOT/DECISIONS_LOG.md`
3. `MEMORY_ROOT/PROGRESS.md`
4. `MEMORY_ROOT/REVIEW_NOTES.md`
5. `./AGENTS.md` (sections 3, 6, 7)
6. `./PRODUCT_PLAN.md`

Confirm:
```
[OK] Memory loaded
[OK] Beginning Phase 6 - Data Collection and Export
```

If blockers exist, append a blocker note to `SESSION_STATE.md` and stop.

Write handoff:
```
## HANDOFF - Memory - [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Architect
SUMMARY: Phase 6 preflight complete. Context synchronized.
BLOCKERS: none
```

---

## Step 2 - Architecture and Contracts

Active agent: **Architect**

Read:
1. `./agents/architect.md`
2. `MEMORY_ROOT/SESSION_STATE.md`
3. `MEMORY_ROOT/DECISIONS_LOG.md`
4. `./PRODUCT_PLAN.md`

Record these decisions in `DECISIONS_LOG.md`:

### Decision 6a - Export schema
Define final JSON schema:
- `timestamp` (ISO 8601 UTC string)
- `projectName` (string)
- `branchName` (string)
- `userName` (string)
- `userEmail` (string)
- `changes` (array)
  - `filePath` (string)
  - `status` (string)
  - `isStaged` (bool)
  - `diffText` (string)
  - `modelChanges` (optional array, if present in payload from Phase 5.5)
    - `changeType`
    - `elementType`
    - `elementName`
    - `details`

### Decision 6b - Folder layout
Define shared layout:
```
C:\MendixGitData\
  exports\      # extension writes here
  processed\    # receiver moves consumed files here
  errors\       # receiver moves malformed files here
```

### Decision 6c - File naming
Format: `[timestamp]_[projectName].json`
Example: `2026-02-17T21-40-00Z_MyMendixApp.json`
Rule: replace `:` with `-` in filename timestamp.

### Decision 6d - UI surface
Define export trigger in UI:
- Add `Export Changes` action next to refresh in WinForms panel.
- Keep button disabled when no changes are loaded.
- Non-blocking execution (`Task.Run` + UI `Invoke`).
- Success and failure status shown to user.

If an embedded/HTML panel exists, define equivalent export action there as well.

### Decision 6e - Git user identity source
Use repository config:
- `user.name` fallback: `Unknown`
- `user.email` fallback: `unknown@example.com`

### Decision 6f - File plan
Architect must list exact files:
- `ExportService.cs` (CREATE)
- `ChangesPanel.Designer.cs` (MODIFY)
- `ChangesPanel.cs` (MODIFY)
- `GitChangesPanelHtml.cs` (MODIFY if present)
- `MEMORY_ROOT/EXPORT_CONTRACT.md` (CREATE)

Write handoff:
```
## HANDOFF - Architect - [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Implementer
SUMMARY: Export architecture and contracts defined for Phase 6.
BLOCKERS: none
```

---

## Step 3 - Implementation

Active agent: **Implementer**

Read:
1. `./agents/implementer.md`
2. `MEMORY_ROOT/SESSION_STATE.md`
3. `MEMORY_ROOT/DECISIONS_LOG.md`

### 3.1 Create ExportService.cs
Create static service with:
- `public static class ExportService`
- `public static string ExportChanges(GitChangesPayload payload, string projectPath, string exportRootPath)`

Behavior:
- Determine `projectName` from `projectPath`.
- Resolve branch from payload.
- Read Git identity from `Repository.Discover(projectPath)` and repo config.
- Map all file changes (`filePath`, `status`, `isStaged`, `diffText`, optional `modelChanges`).
- Serialize JSON with `System.Text.Json`.
- Create folders if missing.
- Write to `exportRootPath\exports\[filename].json`.
- Return full output path.

Error policy:
- Throw on write failures (`IOException` flows to caller).
- Do not swallow exceptions silently.

Run `dotnet build` after completion.
Append completion entry to `PROGRESS.md`.

### 3.2 Update ChangesPanel UI
Modify `ChangesPanel.Designer.cs` and `ChangesPanel.cs`:
- Add `btnExport` near `btnRefresh`.
- Initial `Enabled = false`.
- Add constant export root: `@"C:\MendixGitData"`.
- In `UpdateUI`, enable export only when payload has changes.
- Implement `btnExport_Click`:
  - Guard against null or empty payload.
  - Disable button.
  - Run export on background thread.
  - Update `lblStatus` on UI thread:
    - Success: `Exported X changes to [path]`
    - Failure: `Export failed: [message]`
  - Re-enable in `finally`.

Run `dotnet build` after each modified file.
Append completion entries to `PROGRESS.md`.

### 3.3 Update embedded panel if present
If `GitChangesPanelHtml.cs` exists, add equivalent export action and status messaging.
Do not break existing functionality.

Run `dotnet build`.
Append completion entry to `PROGRESS.md`.

### 3.4 Write export contract
Create `MEMORY_ROOT/EXPORT_CONTRACT.md` with:
- Watched folder (`C:\MendixGitData\exports\`)
- JSON format and schema reference
- Processing protocol (`exports -> processed`)
- Malformed file handling (`exports -> errors`)
- Note: receiver implementation is Phase 7

### 3.5 Implementer handoff
Write:
```
## HANDOFF - Implementer - [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Tester
SUMMARY: Export service and UI integration implemented. Build passing.
BLOCKERS: none
```

---

## Step 4 - Testing and Validation

Active agent: **Tester**

Read:
1. `./agents/TESTER.md`
2. `MEMORY_ROOT/SESSION_STATE.md`
3. `MEMORY_ROOT/PROGRESS.md`
4. `MEMORY_ROOT/DECISIONS_LOG.md`

### 4.1 Build verification
Run:
```
dotnet clean
dotnet build
```
Record pass/fail.

### 4.2 Static verification checklist
Verify by reading code:
- Export JSON includes required schema fields.
- Optional `modelChanges` is preserved when present.
- `btnExport` state handling prevents double execution.
- Export work does not block UI thread.
- Exceptions are surfaced as readable status messages.

### 4.3 Functional code-path tracing
Trace these scenarios:
1. Repo with changes -> export succeeds.
2. Repo with no changes -> export disabled.
3. Missing write permission -> failure message shown.
4. Missing Git user config -> fallback values used.

### 4.4 Edge cases
Trace:
- Disk full.
- Long project names.
- Branch name with slash.
- Non-ASCII file paths.

Log bugs to `REVIEW_NOTES.md` with severity and reproduction notes.

### 4.5 Tester verdict and handoff
Write:
```
## TEST VERDICT - Tester - [timestamp]
RESULT: PASS | FAIL
Must-Have failures: [count]
Total issues found: [count]
See: MEMORY_ROOT/REVIEW_NOTES.md
```

Then:
```
## HANDOFF - Tester - [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Reviewer
SUMMARY: Phase 6 validation complete. Findings logged.
BLOCKERS: [none | list]
```

---

## Step 5 - Review and Approval Gate

Active agent: **Reviewer**

Read:
1. `./agents/reviewer.md`
2. `MEMORY_ROOT/SESSION_STATE.md`
3. `MEMORY_ROOT/REVIEW_NOTES.md`
4. `MEMORY_ROOT/DECISIONS_LOG.md`
5. `MEMORY_ROOT/PROGRESS.md`

Review focus:
- Architecture compliance with Decision 6a-6f.
- Error handling quality.
- Thread safety and UI responsiveness.
- Contract readiness for Phase 7 parser app.

If must-fix issues exist:
1. Write change requests to `REVIEW_NOTES.md`.
2. Set handoff back to Implementer.
3. Repeat Steps 3-5 until approved.

Approval output:
```
## REVIEW VERDICT - Reviewer - [timestamp]
RESULT: APPROVED | CHANGES REQUIRED
Open must-fix items: [count]
Open should-fix items: [count]
Phase status: COMPLETE | RETURN TO IMPLEMENTER
```

Approved handoff:
```
## HANDOFF - Reviewer - [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Prompt Refiner
SUMMARY: Phase 6 implementation approved.
BLOCKERS: none
```

---

## Step 6 - Prompt Refiner Pass

Active agent: **Prompt Refiner**

Read:
1. `./agents/PROMPT_REFINER.md`
2. `MEMORY_ROOT/REVIEW_NOTES.md`
3. `MEMORY_ROOT/SESSION_STATE.md`
4. `./prompts/PHASE_6_DATA_COLLECTION.md`

Goal:
- Capture prompt-level gaps discovered during execution.
- Propose minimal prompt edits if recurring ambiguity was found.
- If no edits are needed, record "no changes required".

Always append an entry to `PROMPT_CHANGES.md`:
```
## Change [ID] - [timestamp]
Requested by: Developer
Issue: Phase 6 continuation after 5.5 with full multi-agent workflow
Files changed: [list]
Summary: [what changed and why]
Related phases: 6
Backward compatible: YES | NO
```

Handoff:
```
## HANDOFF - Prompt Refiner - [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Memory
SUMMARY: Prompt consistency pass complete.
BLOCKERS: none
```

---

## Step 7 - Memory Closeout

Active agent: **Memory**

Append final session summary to `SESSION_STATE.md`:
```
## Session End - [timestamp]
Work completed this session: Phase 6 implemented, tested, reviewed, and prompt-refined.
Files modified: [list]
Next session should start with: Architect running prompts/PHASE_7_COMMIT_PARSER_AGENT.md
```

Then print:
```
+-----------------------------------------------+
| PHASE 6 COMPLETE - Data Collection and Export |
+-----------------------------------------------+
| Architecture: Planned and logged              |
| Implementation: Complete                      |
| Testing: Complete                             |
| Review: Approved                              |
| Prompt refinement: Logged                     |
| Next: prompts/PHASE_7_COMMIT_PARSER_AGENT.md |
+-----------------------------------------------+
```

---

## Notes

- Phase 6 exports data only. It does not build the parser.
- Phase 7 is a separate application that consumes these export files.
- Keep all changes additive. Do not break existing Phase 5.5 behavior.
