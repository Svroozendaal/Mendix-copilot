namespace MendixCommitParser.Models;

/// <summary>
/// Enriched commit information generated from raw export data.
/// </summary>
public sealed record StructuredCommitData(
    string CommitId,
    string Timestamp,
    string ProjectName,
    string BranchName,
    string UserName,
    ExtractedEntity[] Entities,
    string[] AffectedFiles,
    CommitMetrics Metrics
);

/// <summary>
/// Represents an extracted Mendix entity affected by a file change.
/// </summary>
public sealed record ExtractedEntity(
    string Type,
    string Name,
    string Action
);

/// <summary>
/// Aggregate file-change metrics derived from raw statuses.
/// </summary>
public sealed record CommitMetrics(
    int TotalFiles,
    int Added,
    int Modified,
    int Deleted,
    int Renamed
);
