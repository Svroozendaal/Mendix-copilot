using System.Collections.Generic;

namespace AutoCommitMessage;

/// <summary>
/// Represents one uncommitted file change in the current Git repository.
/// </summary>
public sealed record GitFileChange
{
    /// <summary>
    /// Gets the repository-relative file path.
    /// </summary>
    public string FilePath { get; init; } = string.Empty;

    /// <summary>
    /// Gets the normalized Git status label.
    /// </summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>
    /// Gets a value indicating whether the file change is staged in the Git index.
    /// </summary>
    public bool IsStaged { get; init; }

    /// <summary>
    /// Gets the textual patch content for this file, or an informative fallback message.
    /// </summary>
    public string DiffText { get; init; } = string.Empty;

    /// <summary>
    /// Gets optional model-level change details for .mpr files.
    /// </summary>
    public IReadOnlyList<MendixModelChange>? ModelChanges { get; init; }
}

/// <summary>
/// Represents the Git changes read result for the currently opened project.
/// </summary>
public sealed record GitChangesPayload
{
    /// <summary>
    /// Gets a value indicating whether the project path belongs to a Git repository.
    /// </summary>
    public bool IsGitRepo { get; init; }

    /// <summary>
    /// Gets the currently checked out branch name.
    /// </summary>
    public string BranchName { get; init; } = string.Empty;

    /// <summary>
    /// Gets the collection of filtered uncommitted file changes.
    /// </summary>
    public IReadOnlyList<GitFileChange> Changes { get; init; } = new List<GitFileChange>();

    /// <summary>
    /// Gets an optional user-friendly error message.
    /// </summary>
    public string? Error { get; init; }
}

