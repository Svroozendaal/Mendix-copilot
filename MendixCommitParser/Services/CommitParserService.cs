using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MendixCommitParser.Models;

namespace MendixCommitParser.Services;

/// <summary>
/// Parses raw commit export files into structured commit data.
/// </summary>
public static class CommitParserService
{
    private static readonly JsonSerializerOptions DeserializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// Reads and transforms one raw export file into a structured commit record.
    /// </summary>
    public static StructuredCommitData ProcessFile(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("Export file not found.", filePath);
        }

        var json = File.ReadAllText(filePath, Encoding.UTF8);
        var raw = JsonSerializer.Deserialize<RawCommitData>(json, DeserializerOptions);

        if (raw is null)
        {
            throw new JsonException("Could not deserialize export file.");
        }

        var changes = raw.Changes ?? Array.Empty<RawFileChange>();
        var entities = EntityExtractorService.ExtractEntities(changes);
        var metrics = BuildMetrics(changes);
        var affectedFiles = changes
            .Select(change => change.FilePath)
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var commitId = BuildCommitId(raw.Timestamp, raw.ProjectName, raw.BranchName);

        return new StructuredCommitData(
            commitId,
            raw.Timestamp,
            raw.ProjectName,
            raw.BranchName,
            raw.UserName,
            entities,
            affectedFiles,
            metrics);
    }

    private static CommitMetrics BuildMetrics(RawFileChange[] changes)
    {
        var added = 0;
        var modified = 0;
        var deleted = 0;
        var renamed = 0;

        foreach (var change in changes)
        {
            var status = change.Status ?? string.Empty;
            if (status.Contains("added", StringComparison.OrdinalIgnoreCase))
            {
                added++;
                continue;
            }

            if (status.Contains("deleted", StringComparison.OrdinalIgnoreCase))
            {
                deleted++;
                continue;
            }

            if (status.Contains("renamed", StringComparison.OrdinalIgnoreCase))
            {
                renamed++;
                continue;
            }

            modified++;
        }

        return new CommitMetrics(changes.Length, added, modified, deleted, renamed);
    }

    private static string BuildCommitId(string timestamp, string projectName, string branchName)
    {
        var seed = $"{timestamp}|{projectName}|{branchName}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(seed));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
