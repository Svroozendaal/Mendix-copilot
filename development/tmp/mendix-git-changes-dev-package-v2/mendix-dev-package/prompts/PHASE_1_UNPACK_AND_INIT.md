# PHASE 1 MASTERPROMPT — Unpack & Initialize
## Mendix Studio Pro 10 — Git Changes Extension

---

## Purpose

This is the entry point for the entire development system. Phase 1 does three things:
1. Reads and internalizes all package files so every agent has full context
2. Initializes the memory system so state persists between sessions
3. Verifies the development environment is ready for Phase 2

Run this prompt once, at the very start of the project. Do not re-run it unless you are doing a full reset.

---

## Instructions for Codex

You are now acting as the **Memory Agent**. Read `./agents/MEMORY.md` for your full identity and operating rules.

Execute the following steps in order. Do not skip steps. Mark each step complete before moving to the next.

---

## Step 1 — Read the full package

Read every file in this package in the following order. Confirm you have read each one.

```
1. AGENTS.md                        ← System entry point and operating rules
2. PRODUCT_PLAN.md                  ← What is being built and why
3. HOW_TO_USE_PROMPT_REFINER.md     ← Guide for improving prompts
4. agents/MEMORY.md                 ← Your current identity (Memory Agent)
5. agents/ARCHITECT.md              ← Architect agent definition
6. agents/IMPLEMENTER.md            ← Implementer agent definition
7. agents/TESTER.md                 ← Tester agent definition
8. agents/REVIEWER.md               ← Reviewer agent definition
9. agents/PROMPT_REFINER.md         ← Prompt improvement agent
10. prompts/PHASE_2_PLANNING.md     ← What comes next
11. prompts/PHASE_3_IMPLEMENTATION.md
12. prompts/PHASE_4_TESTING.md
13. prompts/PHASE_5_REVIEW.md
14. prompts/PHASE_6_DATA_COLLECTION.md
15. prompts/PHASE_7_COMMIT_PARSER_AGENT.md
```

After reading each file, output:
```
✓ Read: [filename]
```

Do not summarize. Just confirm each read.

---

## Step 2 — Initialize the memory directory

Check if `./claude/agent-memory/` exists. If it does not, create it.

Check if each of these files exists:
- `./claude/agent-memory/SESSION_STATE.md`
- `./claude/agent-memory/DECISIONS_LOG.md`
- `./claude/agent-memory/PROGRESS.md`
- `./claude/agent-memory/REVIEW_NOTES.md`
- `./claude/agent-memory/PROMPT_CHANGES.md`

For each file that does not exist, create it using the initial content defined in `agents/MEMORY.md`.

Output for each file:
```
✓ Created: [filename]   (or)
✓ Already exists: [filename]
```

---

## Step 3 — Verify the development environment

Check the following. Output PASS or FAIL for each check.

```
[ ] ./claude/ directory exists
[ ] ./claude/agents/ directory exists
[ ] ./claude/commands/ directory exists
[ ] ./claude/skills/ directory exists
[ ] The C# extension project (.csproj) exists in the repository
[ ] dotnet is available (run: dotnet --version)
[ ] git is available (run: git --version)
[ ] The current project directory is a Git repository (run: git status)
```

If any check FAILs, write a BLOCKER entry to `SESSION_STATE.md` and stop. Do not proceed to Phase 2 until all blockers are resolved.

---

## Step 4 — Locate the existing extension class

Find the existing C# extension class that implements the Studio Pro 10 ExtensionsAPI. This is the file that will be modified in Phase 3 to add `GetDockablePanes()`.

Output:
```
✓ Extension class found: [path/to/File.cs]
  Implements: [interface name]
  Current methods: [list]
```

If no extension class is found, write a BLOCKER and stop.

---

## Step 5 — Write the initialized session state

Update `./claude/agent-memory/SESSION_STATE.md` with the results of this phase:

```markdown
## Phase 1 Complete — [timestamp]

Environment checks: [X/8 passed]
Extension class: [path]
Blockers: [none | list]

## HANDOFF — Memory — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Architect
SUMMARY: Package read, memory initialized, environment verified. Ready for Phase 2.
BLOCKERS: none
```

---

## Step 6 — Output the Phase 1 completion summary

Print this summary to the console:

```
╔══════════════════════════════════════════╗
║  PHASE 1 COMPLETE — Unpack & Initialize  ║
╠══════════════════════════════════════════╣
║  Package files read:     15 / 15         ║
║  Memory files created:   5 / 5           ║
║  Environment checks:     X / 8           ║
║  Blockers:               [none | count]  ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Run: prompts/PHASE_2_PLANNING.md        ║
║  Lead agent: Architect                   ║
╚══════════════════════════════════════════╝
```

If there are blockers, replace NEXT STEP with:
```
  BLOCKED — resolve issues in SESSION_STATE.md first
```

---

## What Phase 1 Does NOT Do

- It does not write any C# code
- It does not make any architectural decisions
- It does not modify any existing source files
- It does not run tests

Phase 1 is purely setup and verification.
