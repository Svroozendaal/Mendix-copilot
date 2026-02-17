# PHASE 7 MASTERPROMPT — Commit Parser Agent Structure
## Mendix Studio Pro 10 — Git Changes Extension

---

## Purpose

Phase 7 builds the **receiving side** of the data collection pipeline. This is a **separate standalone application** (not part of the Studio Pro extension) that:

1. Watches `C:\MendixGitData\exports\` for new JSON files
2. Reads and parses commit data
3. Extracts structured information (entities: which modules/domains are affected)
4. Stores the structured data as JSON in a repository for future agent training
5. Builds the foundation for a commit parser agent that will learn from this data

This phase creates:
- A file watcher console app (.NET)
- A commit parser agent structure (skills, prompts, memory)
- JSON storage for structured commit data

---

## Prerequisites

- Phase 6 has completed successfully (export functionality working)
- You have a separate repository/folder for this new application
- The export folder path is accessible (`C:\MendixGitData\exports\`)

---

## Instructions for Codex

This phase involves both the **Architect** and **Implementer** agents working on a new project. Work through the steps in order.

---

## Step 1 — Create the application structure (Architect)

### Project decision
Create a new .NET console application called `MendixCommitParser`.

Directory structure:
```
MendixCommitParser/
├── MendixCommitParser.csproj
├── Program.cs                    ← File watcher entry point
├── Services/
│   ├── FileWatcherService.cs     ← Monitors exports folder
│   ├── CommitParserService.cs    ← Parses raw commit JSON
│   └── EntityExtractorService.cs ← Extracts modules/domains
├── Models/
│   ├── RawCommitData.cs          ← Matches the export JSON schema
│   └── StructuredCommitData.cs   ← Output after parsing
├── Storage/
│   └── JsonStorage.cs            ← Writes parsed data to files
└── .claude/
    ├── agent-memory/
    │   └── README.md
    ├── agents/
    │   └── COMMIT_PARSER.md      ← The AI agent definition
    └── skills/
        ├── entity-extraction/
        │   └── SKILL.md
        └── pattern-detection/
            └── SKILL.md
```

Record this structure in `DECISIONS_LOG.md`.

---

## Step 2 — Define the data models (Architect)

### RawCommitData model
This exactly matches the JSON schema from Phase 6:
```csharp
public sealed record RawCommitData(
    string Timestamp,
    string ProjectName,
    string BranchName,
    string UserName,
    string UserEmail,
    RawFileChange[] Changes
);

public sealed record RawFileChange(
    string FilePath,
    string Status,
    bool IsStaged,
    string DiffText
);
```

### StructuredCommitData model
This is the parsed, enriched version:
```csharp
public sealed record StructuredCommitData(
    string CommitId,              // Generated: hash of timestamp + project + branch
    string Timestamp,
    string ProjectName,
    string BranchName,
    string UserName,
    ExtractedEntity[] Entities,   // Parsed: which modules/domains affected
    string[] AffectedFiles,       // List of file paths
    CommitMetrics Metrics         // Derived: total changes, adds, deletes, modifies
);

public sealed record ExtractedEntity(
    string Type,                  // "Module" | "Domain" | "Page" | "Microflow"
    string Name,                  // Extracted from file path
    string Action                 // "Modified" | "Added" | "Deleted"
);

public sealed record CommitMetrics(
    int TotalFiles,
    int Added,
    int Modified,
    int Deleted,
    int Renamed
);
```

Record these in `DECISIONS_LOG.md`.

---

## Step 3 — Create the file watcher (Implementer)

Switch to **Implementer** agent. Read `./agents/IMPLEMENTER.md`.

### Create Program.cs
Main entry point that:
- Starts `FileWatcherService`
- Runs indefinitely (console app)
- Logs all activity to console
- Handles Ctrl+C gracefully (disposes watcher)

### Create FileWatcherService.cs
Requirements:
- Uses `FileSystemWatcher` to monitor `C:\MendixGitData\exports\`
- Filter: `*.json`
- On `Created` event: call `CommitParserService.ProcessFile(filePath)`
- Move processed file to `C:\MendixGitData\processed\` after success
- Move malformed file to `C:\MendixGitData\errors\` on parse failure
- Logs all actions

Run `dotnet build`. Confirm PASS.

---

## Step 4 — Create the parser service (Implementer)

### Create CommitParserService.cs
Requirements:
- `public static StructuredCommitData ProcessFile(string filePath)`
- Reads JSON file, deserializes to `RawCommitData`
- Calls `EntityExtractorService.ExtractEntities(raw)`
- Calculates `CommitMetrics` from `Changes[]`
- Generates `CommitId` (SHA256 hash of timestamp + project + branch)
- Returns `StructuredCommitData`

Error handling:
- Throws `JsonException` if file is malformed (caller moves it to errors folder)
- Throws `FileNotFoundException` if file disappears mid-read

Run `dotnet build`. Confirm PASS.

---

## Step 5 — Create the entity extractor (Implementer)

### Create EntityExtractorService.cs
Requirements:
- `public static ExtractedEntity[] ExtractEntities(RawFileChange[] changes)`
- Parses each `FilePath` to identify Mendix structure
- Mendix file path patterns:
  - `[Module]/Domain/[Entity].mpr` → Entity: Type="Domain", Name=[Entity]
  - `[Module]/Pages/[Page].mpr` → Entity: Type="Page", Name=[Page]
  - `[Module]/Microflows/[Flow].mpr` → Entity: Type="Microflow", Name=[Flow]
  - `[Module]/Resources/[File]` → Entity: Type="Resource", Name=[File]
- If no pattern matches, creates Entity: Type="Unknown", Name=[filename]
- Action is derived from the `Status` field ("Modified" → "Modified", "Added" → "Added", etc.)

This is a **heuristic** for now. Later, the agent will learn better patterns from the collected data.

Run `dotnet build`. Confirm PASS.

---

## Step 6 — Create the storage layer (Implementer)

### Create JsonStorage.cs
Requirements:
- `public static void Save(StructuredCommitData data, string outputFolder)`
- Writes to `outputFolder\[CommitId].json` (e.g., `C:\MendixGitData\structured\[hash].json`)
- Creates `outputFolder` if it does not exist
- Uses `JsonSerializerOptions { WriteIndented = true }` for readability

The default output folder should be `C:\MendixGitData\structured\`.

Run `dotnet build`. Confirm PASS.

---

## Step 7 — Create the agent structure (Architect → Implementer)

Now create the `.claude/` directory structure for the **future AI agent** that will be trained on this data.

### Create .claude/agents/COMMIT_PARSER.md
This agent does not execute yet — this file is the **blueprint** for when the agent is trained.

Content:
```markdown
# COMMIT PARSER AGENT
## Mendix Commit Data → Structured Insights

---

## Identity

You are the Commit Parser Agent. Your role is to take raw Mendix commit data (file changes, diffs, branch names) and extract structured information about what the developer was doing.

You have been trained on [X] real-world Mendix commits collected from Studio Pro 10 via the Git Changes extension.

---

## Capabilities (to be trained)

- **Entity extraction**: Identify which modules, domains, pages, microflows, and resources were affected
- **Pattern detection**: Recognize common change patterns (e.g., "domain model refactor", "UI update", "API integration")
- **Commit classification**: Categorize commits as bugfix, feature, refactor, or chore
- **Change summarization**: Generate a concise summary of what changed and why

---

## Input Format

You receive a `RawCommitData` JSON object (see Models/RawCommitData.cs).

---

## Output Format

You produce a `StructuredCommitData` JSON object (see Models/StructuredCommitData.cs).

---

## Training Data Location

`C:\MendixGitData\structured\*.json` — all parsed commits

---

## Future Enhancements (Phase 8+)

Once trained, this agent will:
1. Generate commit messages based on the structured data
2. Suggest related changes the developer might have missed
3. Detect anti-patterns (e.g., modifying too many modules in one commit)
```

### Create .claude/skills/entity-extraction/SKILL.md
Content:
```markdown
# Entity Extraction Skill
## Extract Mendix entities from file paths

---

## Purpose

Given a Mendix project file path, identify:
- The module name
- The entity type (Domain, Page, Microflow, Resource, etc.)
- The entity name

---

## Patterns

| File Path Pattern | Module | Type | Name |
|---|---|---|---|
| `MyModule/Domain/Customer.mpr` | MyModule | Domain | Customer |
| `MyModule/Pages/CustomerDetail.mpr` | MyModule | Page | CustomerDetail |
| `MyModule/Microflows/ACT_SaveCustomer.mpr` | MyModule | Microflow | ACT_SaveCustomer |
| `MyModule/Resources/logo.png` | MyModule | Resource | logo.png |

---

## Edge Cases

- File in project root (no module) → Module = "ProjectRoot"
- File with nested folders → Use the deepest folder as context
- Unknown extension → Type = "Unknown"

---

## Training Objective

Learn to:
1. Handle non-standard folder structures (custom module layouts)
2. Detect related entities (e.g., a Page and its backing Microflow)
3. Infer intent from naming conventions (e.g., "ACT_" prefix = action microflow)
```

### Create .claude/skills/pattern-detection/SKILL.md
Content:
```markdown
# Pattern Detection Skill
## Recognize common Mendix change patterns

---

## Purpose

Given a set of file changes, detect common development patterns.

---

## Patterns to Learn (examples)

| Pattern | Indicators |
|---|---|
| Domain model refactor | Multiple Domain entities modified, no UI changes |
| UI update | Pages modified, possibly microflows, no domain changes |
| New feature | Added pages, added microflows, added domain entities |
| Bugfix | Few files modified, often microflows or pages, branch name contains "fix" |
| API integration | Java actions added, constants modified, microflows added |

---

## Training Data

For each commit in the training set, manually label the pattern (or infer from branch name / commit message if available).

---

## Output

Structured field: `detectedPattern: "DomainRefactor" | "UIUpdate" | "NewFeature" | "Bugfix" | "APIIntegration" | "Unknown"`
```

---

## Step 8 — Create the memory system (Implementer)

### Create .claude/agent-memory/README.md
Content:
```markdown
# Commit Parser Agent — Memory System

This directory will store:
- Session state when the agent is running
- Learned patterns from training data
- Configuration (e.g., folder paths, thresholds)

Currently empty — will be populated when the agent is trained in Phase 8.
```

---

## Step 9 — Wire everything together (Implementer)

Update `Program.cs` to:
1. Start `FileWatcherService`
2. For each processed file, call `JsonStorage.Save()` to write the structured JSON
3. Log summary: `"Processed [filename]: [X] entities extracted, [Y] files changed"`

Run a full test:
```
dotnet run
```

Manually place a sample JSON file in `C:\MendixGitData\exports\` and verify:
- File is read
- Structured JSON is written to `C:\MendixGitData\structured\`
- Original file moved to `processed\`

---

## Step 10 — Write completion

Update `SESSION_STATE.md`:

```
## HANDOFF — Implementer — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: none (Phase 7 complete)
SUMMARY: Commit parser app built. File watcher running. Agent structure created. Ready to collect training data.
BLOCKERS: none
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 7 COMPLETE — Commit Parser        ║
╠══════════════════════════════════════════╣
║  New project:     MendixCommitParser     ║
║  Services:        3 (Watcher, Parser, Extractor) ║
║  Agent structure: Created (.claude/)     ║
║  Skills:          2 (entity-extraction, pattern-detection) ║
╠══════════════════════════════════════════╣
║  NEXT STEPS:                             ║
║  1. Run: dotnet run in parser project    ║
║  2. Use Studio Pro extension to export   ║
║  3. Verify structured JSON appears       ║
║  4. Collect 50-100 commits for training  ║
╠══════════════════════════════════════════╣
║  FUTURE (Phase 8):                       ║
║  Train COMMIT_PARSER agent on collected  ║
║  data to generate commit messages        ║
╚══════════════════════════════════════════╝
```

---

## Notes

- Phase 7 builds the **data collection infrastructure**, not the AI agent itself
- The `.claude/agents/COMMIT_PARSER.md` file is a **blueprint** — the agent will be trained later
- The skills are **starting heuristics** — they will be refined as data is collected
- Phase 8 (future) will train the agent using the structured JSON files as training data
