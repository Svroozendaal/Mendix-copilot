# PHASE 5 MASTERPROMPT — Review & Approval
## Mendix Studio Pro 10 — Git Changes Extension

---

## Prerequisites

Before running this prompt, confirm:
- Phase 4 has completed successfully
- `SESSION_STATE.md` shows `NEXT_AGENT: Reviewer`
- `REVIEW_NOTES.md` has been populated by the Tester
- Test verdict is recorded in `SESSION_STATE.md`

---

## Instructions for Codex

You are now acting as the **Reviewer Agent**. Read `./agents/REVIEWER.md` for your full identity, review checklist, and operating rules.

Your goal is to perform a final, complete code review and either approve the phase as DONE or return it to the Implementer with specific, actionable change requests.

---

## Step 1 — Load context

Read in order:
1. `./claude/agent-memory/SESSION_STATE.md` — current status and test verdict
2. `./claude/agent-memory/REVIEW_NOTES.md` — Tester's findings
3. `./claude/agent-memory/DECISIONS_LOG.md` — what was planned
4. `./claude/agent-memory/PROGRESS.md` — what was built
5. `./agents/REVIEWER.md` — your review checklist

Confirm:
```
✓ Context loaded.
✓ Tester verdict: [PASS | FAIL]
✓ Open issues from Tester: [count]
✓ Beginning review.
```

---

## Step 2 — Triage Tester findings

Review every bug/issue in `REVIEW_NOTES.md`. For each one, decide:
- **MUST FIX** — blocks approval, send back to Implementer
- **SHOULD FIX** — important but not blocking; note for next iteration
- **WONT FIX NOW** — acceptable for Phase 1, log as technical debt

Update the `Status` and `Priority` on each item in `REVIEW_NOTES.md`.

Output a triage summary:
```
## Triage Summary
Must Fix: [count] items
Should Fix: [count] items  
Won't Fix Now: [count] items
```

If there are **any MUST FIX items**, go directly to Step 6 (return to Implementer). Do not continue the full review.

---

## Step 3 — Architecture compliance review

Read each production file and check every item in the Architecture Compliance section of `agents/REVIEWER.md`.

For each check, output:
```
[✓ PASS | ✗ FAIL | ⚠ WARNING] — [check name]
[if FAIL: file, issue, required change]
```

---

## Step 4 — Code quality review

Read each production file and check every item in the Code Quality section of `agents/REVIEWER.md`.

Special attention to:

**GitChangesService.cs:**
- Is `using var repo = new Repository(...)` used? (ensures disposal)
- Is there a single top-level try/catch or multiple nested ones?
- Are both `RepositoryNotFoundException` and generic `Exception` handled separately?

**ChangesPanel.cs:**
- Is the refresh button re-enabled in all code paths (including exceptions)?
- Is `lvChanges.BeginUpdate()` / `EndUpdate()` used for performance?
- Is there a null check before accessing `lvChanges.SelectedItems[0]`?

**Dockable pane registration:**
- Is the GUID a hardcoded string literal matching the one in `DECISIONS_LOG.md`?
- Is the pane title exactly `"Git Changes"`?

---

## Step 5 — Phase 2 readiness check

Verify the codebase is ready for the future AI commit message feature:

- [ ] `GitChangesPayload` is a pure data record with no UI dependencies
- [ ] `GitChangesService.ReadChanges()` takes only a `string path` parameter — no UI or extension API objects
- [ ] `DiffText` is never null (empty string or informative message, never null)
- [ ] `GitChangesPayload` can be serialized to JSON without circular references
- [ ] `GitChangesService` has no static state — it is safe to call from any context

Output:
```
## Phase 2 Readiness: READY | NOT READY
[List any issues that would complicate Phase 2]
```

---

## Step 6 — Write change requests (if any)

For every MUST FIX or SHOULD FIX item not already in `REVIEW_NOTES.md`, write a change request using the format from `agents/REVIEWER.md`.

Each change request must include:
- Exact file
- Exact method or property
- Exact problem (not vague)
- Exact required change

---

## Step 7 — Write review verdict

Write to `SESSION_STATE.md`:

```
## REVIEW VERDICT — Reviewer — [timestamp]
RESULT: APPROVED | CHANGES REQUIRED
Architecture compliance: PASS | FAIL
Code quality: PASS | FAIL
Phase 2 readiness: READY | NOT READY
Must-fix items: [count]
Should-fix items: [count]
Phase status: COMPLETE | RETURN TO IMPLEMENTER
```

---

## Step 8a — If APPROVED

Write handoff:
```
## HANDOFF — Reviewer — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: none
SUMMARY: Phase 1 approved. Extension is ready for manual testing in Studio Pro 10.
BLOCKERS: none
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 5 COMPLETE — Review               ║
╠══════════════════════════════════════════╣
║  Architecture:   COMPLIANT               ║
║  Code quality:   APPROVED                ║
║  Phase 2 ready:  YES                     ║
║  Must-fix items: 0                       ║
╠══════════════════════════════════════════╣
║  🎉 PHASE 1 DEVELOPMENT COMPLETE         ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Manual test in Studio Pro 10:           ║
║  1. Load extension in Studio Pro 10      ║
║  2. Open a Git-based Mendix project      ║
║  3. Verify Git Changes panel appears     ║
║  4. Make a local change and click Refresh║
╚══════════════════════════════════════════╝
```

---

## Step 8b — If CHANGES REQUIRED

Write handoff:
```
## HANDOFF — Reviewer — [timestamp]
STATUS: CHANGES REQUIRED
NEXT_AGENT: Implementer
SUMMARY: [X] must-fix issues. See REVIEW_NOTES.md for details.
BLOCKERS: [list top issues]
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 5 — Changes Required              ║
╠══════════════════════════════════════════╣
║  Must-fix items: [count]                 ║
║  See: REVIEW_NOTES.md                   ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Return to Implementer                   ║
║  Run: prompts/PHASE_3_IMPLEMENTATION.md  ║
║  (Implementer reads REVIEW_NOTES.md)     ║
╚══════════════════════════════════════════╝
```

The Implementer will re-read `REVIEW_NOTES.md` and fix all MUST FIX items, then hand off to Tester again. Repeat the cycle until approval.
