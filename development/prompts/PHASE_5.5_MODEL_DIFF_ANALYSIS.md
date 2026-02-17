# PHASE 5.5 MASTERPROMPT — Mendix Model Diff Analysis
## Mendix Studio Pro 10 — Git Changes Extension

---

## Purpose

Phase 5.5 extends the Git Changes extension to show **what changed inside the Mendix model**, not just that `app.mpr` was modified. The user currently sees "app.mpr: Modified" but doesn't know if an entity, page, or microflow was changed. This phase uses the `mx.exe dump-mpr` command to extract structured model information and compare before/after states.

**Key insight:** Mendix `.mpr` files are SQLite databases. The `mx.exe` command-line tool (shipped with Studio Pro) can export the entire model as JSON. By running `dump-mpr` on both the working copy and the HEAD version, we can diff the models and show exactly which Mendix elements changed.

---

## Prerequisites

Before running this prompt, confirm:
- Phase 5 has completed successfully (base extension works)
- The extension is tested and approved
- You have Studio Pro 10 installed (which includes `mx.exe`)

---

## Research Summary

The Architect must read this research before planning.

### Mendix .mpr File Format
- `.mpr` is a SQLite database
- Model elements (entities, pages, microflows) are stored as BSON blobs
- **Studio Pro 10.18+** introduced MPR v2:
  - Small `.mpr` file (68KB) with metadata
  - `mprcontents/` folder with individual XML files per document
  - **Much better for Git diffs** — but not all projects use it yet

### The `mx.exe` Tool
- Location: `C:\Program Files\Mendix\[version]\modeler\mx.exe`
- Key command: `mx dump-mpr <path-to-mpr> --output <json-file>`
- Outputs a complete JSON representation of the Mendix model
- Includes: modules, entities, attributes, associations, pages, microflows, etc.

### Problem: LibGit2Sharp Can't Read .mpr Contents
- LibGit2Sharp can get the Git diff (file changed, binary blob)
- But it **cannot parse .mpr** — it's a proprietary format
- Solution: Use `mx.exe` to extract both versions, then diff the JSON

---

## Instructions for Codex

Work through Architect → Implementer → Tester cycle.

---

## Step 1 — Architecture Planning (Architect)

Read `./claude/agent-memory/DECISIONS_LOG.md` and add these decisions:

### Decision 5.5a — mx.exe Location Discovery
How to find `mx.exe`:
1. Check if `mx.exe` is in PATH (unlikely)
2. Read Studio Pro install location from Windows Registry:
   - Key: `HKEY_LOCAL_MACHINE\SOFTWARE\Mendix\Studio Pro\[version]`
   - Value: `InstallLocation`
3. Fallback: hardcoded common paths (C:\Program Files\Mendix\)
4. If not found: show error "mx.exe not found — ensure Studio Pro 10 is installed"

### Decision 5.5b — Model Diff Strategy
When a `.mpr` file changes:
1. Extract current working copy: `mx dump-mpr app.mpr --output working.json`
2. Extract HEAD version from Git:
   - Use LibGit2Sharp to get the blob from HEAD
   - Write blob to temp file `temp_head.mpr`
   - Extract: `mx dump-mpr temp_head.mpr --output head.json`
3. Diff the two JSON files programmatically
4. Parse the diff to find changed Mendix elements (entities, pages, etc.)

### Decision 5.5c — What to Show in the UI
Add a **collapsible details pane** below each `.mpr` file in the ListView:
- **Entities Changed**: List of entity names (added/modified/deleted)
- **Pages Changed**: List of page names
- **Microflows Changed**: List of microflow names
- **Other**: Counts for domains, integrations, security rules, etc.

Example UI:
```
[+] app.mpr (Modified)
    ├── 📦 Entities: Customer (modified), Order (added)
    ├── 📄 Pages: CustomerDetail (modified)
    ├── ⚙️ Microflows: ACT_SaveCustomer (modified)
    └── 🔒 Security: 2 access rules updated
```

### Decision 5.5d — Performance Considerations
- `dump-mpr` is **slow** for large apps (5-10 seconds)
- Run it on a background thread
- Cache results — don't re-run unless the user explicitly refreshes
- Show a loading spinner while extracting

### Decision 5.5e — MPR v2 Detection
If the project uses MPR v2 (Studio Pro 10.18+):
- Check for `mprcontents/` folder existence
- If present: Git diff is much more granular (XML files per document)
- Can show file-level diffs directly without `dump-mpr`
- **Decision:** Start with MPR v1 support (dump-mpr). MPR v2 can be Phase 5.6.

---

## Step 2 — File Structure (Architect)

New files to create:
```
MxToolService.cs          — Locates mx.exe and runs dump-mpr
MendixModelDiffService.cs — Compares two JSON model dumps
MendixModelChange.cs      — DTO: ChangeType, ElementType, ElementName
```

Modified files:
```
ChangesPanel.cs           — Add expandable tree view for .mpr files
GitChangesService.cs      — Detect .mpr files, trigger model diff
```

Record this in `DECISIONS_LOG.md`.

---

## Step 3 — Implement MxToolService.cs (Implementer)

### Requirements
- Static class: `MxToolService`
- Method: `public static string FindMxExe()`
  - Searches Windows Registry for Studio Pro install location
  - Returns path to `mx.exe` or throws `FileNotFoundException`
- Method: `public static string DumpMpr(string mprPath, string outputPath)`
  - Runs: `mx.exe dump-mpr <mprPath> --output <outputPath>`
  - Returns output path on success
  - Throws `InvalidOperationException` if mx.exe fails

### Error Handling
- If Registry key not found: try common paths
- If `mx.exe` not found: throw with message "Studio Pro 10 not detected"
- If `dump-mpr` exits with non-zero code: include stdout/stderr in exception

Run `dotnet build`. Confirm PASS.

Log to `PROGRESS.md`:
```
## MxToolService.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 4 — Implement MendixModelDiffService.cs (Implementer)

### Requirements
- Static class: `MendixModelDiffService`
- Method: `public static List<MendixModelChange> CompareDumps(string workingJson, string headJson)`
  - Parses both JSON files using `System.Text.Json`
  - Identifies added/modified/deleted elements
  - Returns a list of `MendixModelChange` objects

### Parsing Strategy
The JSON structure from `dump-mpr` includes:
- `"Entities"` array with entity definitions
- `"Pages"` array with page definitions
- `"Microflows"` array with microflow definitions

For each type:
1. Build a dictionary of elements by name/ID in both dumps
2. Compare: if in working but not head → Added
3. If in both but different → Modified
4. If in head but not working → Deleted

### MendixModelChange DTO
```csharp
public sealed record MendixModelChange(
    string ChangeType,    // "Added" | "Modified" | "Deleted"
    string ElementType,   // "Entity" | "Page" | "Microflow" | "Domain" | ...
    string ElementName,   // e.g., "Customer", "CustomerDetail"
    string? Details       // Optional: brief description of what changed
);
```

Run `dotnet build`. Confirm PASS.

Log to `PROGRESS.md`:
```
## MendixModelDiffService.cs — COMPLETE — [timestamp]
Build status: PASS
```

---

## Step 5 — Update GitChangesService.cs (Implementer)

Modify `ReadChanges()` to detect `.mpr` files:

```csharp
foreach (var change in statusEntries)
{
    var fileChange = new GitFileChange(...);
    
    // NEW: If this is a .mpr file, analyze model changes
    if (change.FilePath.EndsWith(".mpr", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var modelChanges = AnalyzeMprChanges(projectPath, change.FilePath);
            fileChange = fileChange with { ModelChanges = modelChanges };
        }
        catch (Exception ex)
        {
            // If model analysis fails, just show the file change without details
            Log.Warning($"Could not analyze Mendix model: {ex.Message}");
        }
    }
    
    changes.Add(fileChange);
}
```

Add private method:
```csharp
private static List<MendixModelChange> AnalyzeMprChanges(string projectPath, string mprPath)
{
    // 1. Find mx.exe
    var mxPath = MxToolService.FindMxExe();
    
    // 2. Dump working copy
    var workingDump = Path.Combine(Path.GetTempPath(), $"working_{Guid.NewGuid()}.json");
    MxToolService.DumpMpr(Path.Combine(projectPath, mprPath), workingDump);
    
    // 3. Get HEAD version from Git
    using var repo = new Repository(Repository.Discover(projectPath));
    var headCommit = repo.Head.Tip;
    var headEntry = headCommit[mprPath];
    var headBlob = (Blob)headEntry.Target;
    
    // 4. Write HEAD blob to temp file
    var tempMpr = Path.Combine(Path.GetTempPath(), $"head_{Guid.NewGuid()}.mpr");
    using (var fs = File.Create(tempMpr))
    {
        headBlob.GetContentStream().CopyTo(fs);
    }
    
    // 5. Dump HEAD version
    var headDump = Path.Combine(Path.GetTempPath(), $"head_{Guid.NewGuid()}.json");
    MxToolService.DumpMpr(tempMpr, headDump);
    
    // 6. Compare
    var changes = MendixModelDiffService.CompareDumps(workingDump, headDump);
    
    // 7. Cleanup temp files
    File.Delete(workingDump);
    File.Delete(headDump);
    File.Delete(tempMpr);
    
    return changes;
}
```

Run `dotnet build`. Confirm PASS.

---

## Step 6 — Update GitFileChange DTO (Implementer)

Modify `GitChangesPayload.cs`:

```csharp
public sealed record GitFileChange(
    string FilePath,
    string Status,
    bool IsStaged,
    string DiffText,
    List<MendixModelChange>? ModelChanges = null  // NEW: Mendix model diff
);
```

Run `dotnet build`. Confirm PASS.

---

## Step 7 — Update ChangesPanel UI (Implementer)

Modify `ChangesPanel.cs` to show model changes:

### Add to Designer
- Keep the existing ListView for file list
- Below the ListView, add a `TreeView` control (collapsed by default)
- When user selects a `.mpr` file in the ListView:
  - If `ModelChanges` is not null: populate and expand the TreeView
  - Show: "📦 Entities", "📄 Pages", "⚙️ Microflows", etc. as parent nodes
  - Children: individual element names with their change type

### Populate TreeView
```csharp
private void PopulateModelChanges(List<MendixModelChange> changes)
{
    treeViewModelChanges.Nodes.Clear();
    
    var grouped = changes.GroupBy(c => c.ElementType);
    
    foreach (var group in grouped)
    {
        var icon = GetIconForElementType(group.Key);
        var parentNode = new TreeNode($"{icon} {group.Key}: {group.Count()} changed");
        
        foreach (var change in group)
        {
            var color = change.ChangeType switch
            {
                "Added" => Color.Green,
                "Modified" => Color.Orange,
                "Deleted" => Color.Red,
                _ => Color.Black
            };
            
            var childNode = new TreeNode($"{change.ElementName} ({change.ChangeType})")
            {
                ForeColor = color
            };
            
            parentNode.Nodes.Add(childNode);
        }
        
        treeViewModelChanges.Nodes.Add(parentNode);
    }
    
    treeViewModelChanges.ExpandAll();
}
```

Run `dotnet build`. Confirm PASS.

Log to `PROGRESS.md`:
```
## ChangesPanel.cs — MODIFIED — [timestamp]
Build status: PASS
Change: Added TreeView for Mendix model changes
```

---

## Step 8 — Testing (Tester)

### Test Scenarios
| Scenario | Expected Result |
|---|---|
| Open project with modified .mpr | File list shows "app.mpr: Modified" |
| Select the .mpr file | TreeView appears with model changes grouped by type |
| Modify an entity, refresh | TreeView shows "Entity: Customer (Modified)" |
| Add a new page, refresh | TreeView shows "Page: NewPage (Added)" |
| Delete a microflow, refresh | TreeView shows "Microflow: OldFlow (Deleted)" in red |
| mx.exe not found | Error message: "Studio Pro 10 not detected" |
| Non-.mpr file selected | TreeView remains empty (no model analysis) |

### Edge Cases
| Edge Case | Expected Handling |
|---|---|
| Large .mpr file (50MB+) | Show loading spinner, operation may take 10-15 seconds |
| dump-mpr command fails | Catch exception, log warning, show file change without model details |
| HEAD has no .mpr (new file) | Compare against empty model — all elements show as "Added" |
| Working copy deleted .mpr | Compare empty model against HEAD — all elements show as "Deleted" |

Document results in `REVIEW_NOTES.md`.

---

## Step 9 — Write Completion (Implementer)

Update `SESSION_STATE.md`:

```
## HANDOFF — Implementer — [timestamp]
STATUS: COMPLETE
NEXT_AGENT: Tester
SUMMARY: Mendix model diff analysis implemented. mx.exe integration working. TreeView shows detailed model changes.
BLOCKERS: none
```

Output:
```
╔══════════════════════════════════════════╗
║  PHASE 5.5 COMPLETE — Model Diff         ║
╠══════════════════════════════════════════╣
║  New files:      3                       ║
║  Modified files: 3                       ║
║  Build status:   PASS                    ║
║  mx.exe:         INTEGRATED              ║
╠══════════════════════════════════════════╣
║  NEXT STEP:                              ║
║  Run: prompts/PHASE_6_DATA_COLLECTION.md ║
║  (or test manually in Studio Pro 10)    ║
╠══════════════════════════════════════════╣
║  NEW CAPABILITY:                         ║
║  Users now see WHAT changed inside .mpr  ║
║  - Entities, Pages, Microflows, etc.     ║
║  - Color-coded: Green=Added, Red=Deleted ║
╚══════════════════════════════════════════╝
```

---

## Notes

- This phase dramatically improves UX — users finally see **what** they changed in Mendix
- Performance: `dump-mpr` is slow (5-10s for large apps) — always run on background thread
- Future enhancement (Phase 5.6): MPR v2 support (read `mprcontents/` XML directly, much faster)
- The JSON diff approach is robust but requires `mx.exe` to be installed
- Model changes are **not stored in export** yet — Phase 6 will include them in the JSON payload
