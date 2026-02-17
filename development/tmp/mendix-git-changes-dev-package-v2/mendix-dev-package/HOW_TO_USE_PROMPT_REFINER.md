# How to Use the Prompt Refiner Agent

## Purpose

The **Prompt Refiner Agent** is a meta-agent that improves the development system based on your real-world experience. Use it when:
- A phase prompt was unclear or missing steps
- An agent didn't behave as expected
- You want to add new requirements or constraints
- You discovered edge cases that aren't handled

---

## Quick Start

### Step 1: Identify what needs improving

Ask yourself:
- Which phase had the issue?
- Which agent was involved?
- What specifically went wrong or was unclear?
- What should have happened instead?

### Step 2: Activate the Prompt Refiner

In your Codex interface, say:

```
Activate the Prompt Refiner agent.

Issue: [brief description of what went wrong]
Phase/Agent affected: [name]

[Provide context: what you expected vs. what happened]
```

**Example:**
```
Activate the Prompt Refiner agent.

Issue: Phase 3 didn't check if LibGit2Sharp native DLLs were copied to the output directory.
Phase/Agent affected: Phase 3 — Implementation

Context: The build passed, but at runtime the extension crashed because git2-*.dll was missing. The Implementer should have verified the DLLs are present before marking the phase complete.
```

### Step 3: Answer the agent's questions

The Prompt Refiner will ask 3-5 targeted questions to understand the issue. Answer them completely.

### Step 4: Review the proposed changes

The agent will show you exactly what it plans to change in which files. Review the proposal carefully.

Respond with:
- **"yes"** — apply the changes
- **"no"** — cancel, no changes made
- **"modify"** — explain what to adjust, agent will revise the proposal

### Step 5: Verify consistency

After changes are applied, the agent will check if any other files need updating to stay consistent. Approve any additional changes if needed.

---

## Common Use Cases

### Use Case 1: Missing step in a phase prompt

**You say:**
```
Activate the Prompt Refiner agent.

Issue: Phase 2 didn't document the exact GUID format for the dockable pane.
Phase affected: Phase 2 — Planning

The Architect generated a GUID but didn't specify whether it should use hyphens, braces, or uppercase. The Implementer had to guess.
```

**Agent will:**
- Ask what the correct GUID format is
- Propose adding a specific format rule to Phase 2
- Update `DECISIONS_LOG.md` template to include GUID format example

---

### Use Case 2: Agent behavior needs clarification

**You say:**
```
Activate the Prompt Refiner agent.

Issue: The Implementer created files in the wrong order, causing build errors.
Agent affected: Implementer

The Implementer tried to write ChangesPanel.cs before GitChangesPayload.cs, which caused a build error because the DTO didn't exist yet. The agent should always create DTOs first.
```

**Agent will:**
- Ask if this rule applies to all phases or just Phase 3
- Propose adding an explicit "Dependency Order" rule to `agents/IMPLEMENTER.md`
- Update Phase 3 to list files in strict dependency order

---

### Use Case 3: New requirement discovered

**You say:**
```
Activate the Prompt Refiner agent.

Issue: The extension needs to handle the case where the project is in a Git submodule.
Phase affected: All phases

Studio Pro projects can be inside Git submodules. Repository.Discover() will find the parent repo, not the submodule. We need to detect this and use the submodule's repo instead.
```

**Agent will:**
- Ask how to detect a submodule (presence of .git file vs. .git folder)
- Ask which phases need to handle this
- Propose changes to Phase 2 (architecture decision), Phase 3 (implementation), and Phase 4 (test case)
- Update development rules in `AGENTS.md`

---

### Use Case 4: Tech stack change

**You say:**
```
Activate the Prompt Refiner agent.

Issue: We decided to use WPF instead of WinForms for the UI.
Affected: All UI-related code

This is a major change. All references to WinForms UserControl, ListView, RichTextBox need to become WPF equivalents.
```

**Agent will:**
- Confirm you understand this is a MAJOR breaking change
- List every file that needs updating (AGENTS.md, PRODUCT_PLAN.md, Phases 2-5)
- Mark the change as "NOT backward compatible" in the changelog
- Propose a complete rewrite of the UI sections

---

## Advanced: Adding a New Phase

If you want to add Phase 8, 9, etc., the Prompt Refiner can scaffold it for you.

**You say:**
```
Activate the Prompt Refiner agent.

Issue: I want to add Phase 8 — AI Commit Message Generation.
Action: Create new phase

This phase should use the structured commit data from Phase 7 to train an AI agent that generates commit messages. Lead agent: Architect, then Implementer.
```

**Agent will:**
- Ask what the phase's goals and deliverables are
- Ask which agents are involved
- Create `prompts/PHASE_8_AI_COMMIT_MESSAGES.md` using the standard structure
- Update `AGENTS.md` Phase Overview table
- Update Phase 7's handoff to point to Phase 8

---

## Tips for Best Results

✅ **DO:**
- Be specific about what went wrong
- Provide the actual error message or unexpected behavior
- Mention which files or methods were involved
- Say what you expected to happen

❌ **DON'T:**
- Say vague things like "Phase 3 didn't work"
- Assume the agent knows context you haven't shared
- Request changes without explaining why

---

## Emergency: Reset All Prompts

If something goes very wrong and you want to start fresh:

```
Activate the Prompt Refiner agent.

Issue: Major corruption — I need to restore all prompts to their original state.
Action: Reset

Restore all files in prompts/ and agents/ to the version from the original package zip.
```

The agent will confirm this is destructive and ask you to verify. If confirmed, it will restore all original files from the package.
