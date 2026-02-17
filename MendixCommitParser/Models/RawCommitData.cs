using System.Text.Json.Serialization;

namespace MendixCommitParser.Models;

/// <summary>
/// Represents the raw commit export created by the Studio Pro extension.
/// </summary>
public sealed record RawCommitData(
    [property: JsonPropertyName("timestamp")] string Timestamp,
    [property: JsonPropertyName("projectName")] string ProjectName,
    [property: JsonPropertyName("branchName")] string BranchName,
    [property: JsonPropertyName("userName")] string UserName,
    [property: JsonPropertyName("userEmail")] string UserEmail,
    [property: JsonPropertyName("changes")] RawFileChange[] Changes
);

/// <summary>
/// Represents one changed file from the raw export.
/// </summary>
public sealed record RawFileChange(
    [property: JsonPropertyName("filePath")] string FilePath,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("isStaged")] bool IsStaged,
    [property: JsonPropertyName("diffText")] string DiffText,
    [property: JsonPropertyName("modelChanges")] RawModelChange[]? ModelChanges = null
);

/// <summary>
/// Optional model-level change details carried from Phase 5.5 exports.
/// </summary>
public sealed record RawModelChange(
    [property: JsonPropertyName("changeType")] string ChangeType,
    [property: JsonPropertyName("elementType")] string ElementType,
    [property: JsonPropertyName("elementName")] string ElementName,
    [property: JsonPropertyName("details")] string? Details
);
