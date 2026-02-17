# AGENTS.md
## Mendix Studio Pro 10 — Git Changes Extension
### Development Agent System — Entry Point & Operating Guide

---

## 1. What Is This?

This repository uses a **multi-agent development system** powered by Codex. Each agent has a single, focused responsibility. Together they form a self-directing development pipeline that builds the **Mendix Studio Pro 10 Git Changes Extension** — a dockable pane that reads and displays uncommitted Git changes from within Studio Pro.

This file is the **single source of truth** for:
- Which agents exist and what they own
- How agents communicate with each other
- What order to invoke agents in each phase
- How memory and context is preserved between sessions

> **Start here. Always.** Before running any prompt or spawning any agent, read this file top to bottom.

---

## 2. Project Context

| Property | Value |
|---|---|
| **Project** | Mendix Studio Pro 10 Git Changes Extension |
| **Language** | C# (.NET, WinForms) |
| **Git library** | LibGit2Sharp 0.30.0 |
| **UI framework** | WinForms UserControl (dockable pane via ExtensionsAPI) |
| **Scope** | Uncommitted changes only (.mpr / .mprops files) |
| **Out of scope** | SVN, auto-refresh, AI commit messages (Phase 2+) |
| **Studio Pro version** | 10 ONLY — no Studio Pro 11 APIs |

---

## 3. Agent Roster

Five specialized agents exist in the `./agents/` directory. Each agent has a dedicated `.md` file that is its full system prompt.

| Agent | File | Role | Owns |
|---|---|---|---|
| **Architect** | `agents/ARCHITECT.md` | Plans, designs, decides | Architecture decisions, file structure, API contracts |
| **Implementer** | `agents/IMPLEMENTER.md` | Writes all production code | C# files, .csproj changes, WinForms UI |
| **Tester** | `agents/TESTER.md` | Validates and stress-tests | Test scenarios, edge case coverage, build checks |
| **Reviewer** | `agents/REVIEWER.md` | Quality gate | Code quality, naming conventions, error handling review |
| **Memory** | `agents/MEMORY.md` | Preserves context | Session state, decisions log, progress tracking |
| **Prompt Refiner** | `agents/PROMPT_REFINER.md` | Meta-agent: improves prompts | Prompt clarification, consistency, customization |

### Agent Hierarchy

```
MEMORY (always active, background)
    |
ARCHITECT (leads each phase)
    |
IMPLEMENTER (executes Architect's plan)
    |
TESTER (validates Implementer's output)
    |
REVIEWER (approves or sends back)
```

The Memory agent is **always active in the background**. All other agents write their key outputs to `./claude/agent-memory/` so context survives between Codex sessions.

---

## 4. Phase Overview

The project is divided into 5 phases. Each phase has a dedicated masterprompt in `./prompts/`.

| Phase | Masterprompt | Lead Agent | Goal |
|---|---|---|---|
| **Phase 1** | `PHASE_1_UNPACK_AND_INIT.md` | Memory | Unpack this package, initialize all agents, verify environment |
| **Phase 2** | `PHASE_2_PLANNING.md` | Architect | Finalize architecture, create file plan, define API contracts |
| **Phase 3** | `PHASE_3_IMPLEMENTATION.md` | Implementer | Write all C# code, build and verify |
| **Phase 4** | `PHASE_4_TESTING.md` | Tester | Run all test scenarios, report results |
| **Phase 5** | `PHASE_5_REVIEW.md` | Reviewer | Final code review, approve or request changes |
| **Phase 6** | `PHASE_6_DATA_COLLECTION.md` | Architect, Implementer | Add export functionality to collect real-world commit data |
| **Phase 7** | `PHASE_7_COMMIT_PARSER_AGENT.md` | Architect, Implementer | Build parser app + agent structure for commit analysis |

---

## 5. How to Start a Phase

### Step 1 — Always load Memory first
Before starting any phase, instruct Codex to read the memory file:
```
Read ./claude/agent-memory/SESSION_STATE.md before proceeding.
```

### Step 2 — Load the phase masterprompt
```
Now read and execute ./prompts/PHASE_X_NAME.md
```

### Step 3 — Spawn the lead agent for that phase
Each masterprompt specifies which agent to spawn first. Load that agent's `.md` file as the active system context.

### Step 4 — Let agents hand off
Agents signal completion by writing a `HANDOFF:` block to the memory file. The next agent reads this before starting.

---

## 6. Memory & State Convention

All persistent state lives in `./claude/agent-memory/`. The Memory agent owns this directory.

| File | Written by | Read by | Contains |
|---|---|---|---|
| `SESSION_STATE.md` | Memory agent | All agents | Current phase, last completed step, blockers |
| `DECISIONS_LOG.md` | Architect | Implementer, Reviewer | Architecture decisions with rationale |
| `PROGRESS.md` | Implementer | Tester, Reviewer | Which files are created/modified, build status |
| `REVIEW_NOTES.md` | Reviewer | Implementer | Open issues, change requests |
| `PROMPT_CHANGES.md` | Prompt Refiner | All agents | Log of prompt modifications and why |

### Handoff format
Every agent ends its work by appending to `SESSION_STATE.md`:
```
## HANDOFF — [AgentName] — [timestamp]
STATUS: COMPLETE | BLOCKED | NEEDS_INPUT
NEXT_AGENT: [AgentName]
SUMMARY: [1-2 sentences of what was done]
BLOCKERS: [none | description]
```

---

## 7. Development Rules

These rules apply to ALL agents at ALL times:

1. **Studio Pro 10 only** — Never use APIs, classes, or patterns from Studio Pro 11.
2. **No web UI** — All UI is WinForms. No WebView2, no HTML panels, no JavaScript.
3. **No auto-refresh** — Changes are only loaded when the user clicks the Refresh button.
4. **.mpr and .mprops only** — The Git status query uses `PathSpec = new[] { "*.mpr", "*.mprops" }`.
5. **Graceful failure always** — Every Git operation is wrapped in try/catch. The UI always shows a human-readable error, never a raw exception.
6. **No breaking changes** — The existing extension base must keep working. New code is additive only.
7. **Binary diff awareness** — `.mpr` files are binary. The diff view shows `"Binary file changed"` instead of crashing.
8. **Thread safety** — All Git reads happen on a background thread (`Task.Run`). UI updates use `Control.Invoke()`.

---

## 8. File Structure Targets

After Phase 3 completes, the extension project should contain these new files:

```
studio-pro-extension-csharp/
├── GitChangesPayload.cs        ← DTOs (new)
├── GitChangesService.cs        ← Git reading logic (new)
├── ChangesPanel.cs             ← WinForms UserControl (new)
├── ChangesPanel.Designer.cs    ← Auto-generated (new)
└── [ExistingExtension].cs      ← Modified: GetDockablePanes() added
```

---

## 9. Quick Reference — Key Classes

| Class | File | Purpose |
|---|---|---|
| `GitFileChange` | `GitChangesPayload.cs` | Record: FilePath, Status, IsStaged, DiffText |
| `GitChangesPayload` | `GitChangesPayload.cs` | Record: IsGitRepo, BranchName, Changes, Error |
| `GitChangesService` | `GitChangesService.cs` | Static class, `ReadChanges(string path)` method |
| `ChangesPanel` | `ChangesPanel.cs` | UserControl with ListView + diff pane + refresh button |

---

## 10. First Time Setup

If you are running this system for the first time:

```
1. Read this file (AGENTS.md) completely
2. Run: ./prompts/PHASE_1_UNPACK_AND_INIT.md
3. Phase 1 will initialize all agents and verify your environment
4. After Phase 1 completes, proceed to Phase 2
```

**Do not skip Phase 1.** It sets up the memory state that all subsequent phases depend on.
