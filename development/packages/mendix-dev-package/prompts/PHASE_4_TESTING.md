# PHASE 4 MASTERPROMPT — Testing & Validation
## Mendix Studio Pro 10 — Git Changes Extension

---

## Prerequisites

Before running this prompt, confirm:
- Phase 3 has completed successfully
- `SESSION_STATE.md` shows `NEXT_AGENT: Tester`
- `PROGRESS.md` shows all 5 files as COMPLETE
- `dotnet build` is confirmed passing

---

## Instructions for Codex

You are now acting as the **Tester Agent**. Read `./agents/TESTER.md` for your full identity, test plan, and operating rules.

Work through each testing stage in order. Do not skip stages. Document every result.

---

## Step 1 — Load context

Read in order:
1. `./claude/agent-memory/SESSION_STATE.md`
2. `./claude/agent-memory/PROGRESS.md`
3. `./agents/TESTER.md` — full test plan

Confirm:
```
✓ All 5 files confirmed present in PROGRESS.md
✓ Beginning Stage 1 — Build Verification
```

---

## Step 2 — Stage 1: Build verification

Execute and report:

```bash
dotnet clean
dotnet build 2>&1
```

Check output for:
- Exit code 0
- Zero errors
- Zero unexpected warnings

Then locate the native DLL:
```bash
find . -name "git2-*.dll" -path "*/win-x64/*"
```

Output a table:
```
## Stage 1 Results — Build Verification
| Check | Result |
|---|---|
| dotnet build exit code | PASS (0) / FAIL ([code]) |
| Zero errors | PASS / FAIL ([count] errors) |
| Native DLL present | PASS / FAIL |
```

---

## Step 3 — Stage 2: Static code analysis

Read each of the 5 created/modified files. Check each item from the Tester's static analysis checklist in `agents/TESTER.md`.

For each check, search the file content directly.

Output a table:
```
## Stage 2 Results — Static Analysis
| Check | File | Result |
|---|---|---|
| No uncaught throws in Git service | GitChangesService.cs | PASS / FAIL |
| No UI code on background thread | ChangesPanel.cs | PASS / FAIL |
| No SP11 API references | All files | PASS / FAIL |
| PathSpec filter present | GitChangesService.cs | PASS / FAIL |
| Binary file handling | GitChangesService.cs | PASS / FAIL |
```

---

## Step 4 — Stage 3: Functional scenario review

You cannot run Studio Pro in this environment. Instead, perform **code path tracing** — read the code and trace each scenario through the call stack to determine if the correct outcome would occur.

For each scenario from `agents/TESTER.md`:

```
Scenario: [name]
Code path:
  1. btnRefresh_Click → Task.Run → GitChangesService.ReadChanges(path)
  2. [trace through the specific code path for this scenario]
  3. → UpdateUI(payload)
  4. [trace UI update]
Expected outcome: [what the user would see]
Code path verdict: PASS / FAIL / NEEDS_MANUAL_TEST
```

If a scenario cannot be verified by code tracing alone, mark it `NEEDS_MANUAL_TEST` and add it to `REVIEW_NOTES.md`.

---

## Step 5 — Stage 4: Edge case analysis

For each edge case in `agents/TESTER.md`, trace the code path and check for handling.

Pay special attention to:

**Path with spaces or non-ASCII characters:**
- Does `Repository.Discover(path)` handle special characters?
- Is the path passed as-is or sanitized?

**Large number of changes:**
- Is `lvChanges.Items.AddRange()` used (efficient) or is `lvChanges.Items.Add()` called in a loop (inefficient for large lists)?
- Is `lvChanges.BeginUpdate()` / `EndUpdate()` called around the population?

**Refresh during refresh:**
- Is `btnRefresh.Enabled = false` set before the async operation starts?
- Is it re-enabled in a `finally` block or only on success?

Output findings for each edge case.

---

## Step 6 — Compile findings

Count all issues:
- Critical: Build failures, crashes, missing Must Have features
- Major: Incorrect behavior in standard scenarios
- Minor: Performance, aesthetics, nice-to-have improvements

Write all issues to `./claude/agent-memory/REVIEW_NOTES.md` using the bug report format from `agents/TESTER.md`.

---

## Step 7 — Write test verdict

Write to `SESSION_STATE.md`:

```
## TEST VERDICT — Tester — [timestamp]
RESULT: PASS | FAIL
Stage 1 (Build): PASS | FAIL
Stage 2 (Static): PASS | FAIL  
Stage 3 (Functional): [X] PASS, [Y] FAIL, [Z] NEEDS_MANUAL_TEST
Stage 4 (Edge cases): [X] PASS, [Y] FAIL
Critical issues: [count]
Major issues: [count]
Minor issues: [count]
See: ./claude/agent-memory/REVIEW_NOTES.md
```

---

## Step 8 — Handoff

Write handoff to `SESSION_STATE.md`:

```
## HANDOFF — Tester — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Reviewer
SUMMARY: [X] scenarios tested. [Y] passed. [Z] issues filed.
BLOCKERS: [none | list critical issues]
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 4 COMPLETE — Testing              ║
╠══════════════════════════════════════════╣
║  Build:          PASS / FAIL             ║
║  Static checks:  X / Y passed            ║
║  Scenarios:      X passed, Y failed      ║
║  Issues filed:   X critical, Y major     ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Run: prompts/PHASE_5_REVIEW.md          ║
║  Lead agent: Reviewer                    ║
╚══════════════════════════════════════════╝
```
