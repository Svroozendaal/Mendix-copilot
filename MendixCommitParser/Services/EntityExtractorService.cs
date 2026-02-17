using MendixCommitParser.Models;

namespace MendixCommitParser.Services;

/// <summary>
/// Extracts high-level Mendix entities from changed file paths.
/// </summary>
public static class EntityExtractorService
{
    /// <summary>
    /// Converts raw file changes to extracted entity records.
    /// </summary>
    public static ExtractedEntity[] ExtractEntities(RawFileChange[] changes)
    {
        if (changes is null || changes.Length == 0)
        {
            return Array.Empty<ExtractedEntity>();
        }

        var entities = new List<ExtractedEntity>(changes.Length);

        foreach (var change in changes)
        {
            var filePath = change.FilePath ?? string.Empty;
            var normalizedPath = filePath.Replace('\\', '/');
            var segments = normalizedPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var action = NormalizeAction(change.Status);

            if (TryExtractByFolder(segments, "Domain", includeExtension: false, out var domainName))
            {
                entities.Add(new ExtractedEntity("Domain", domainName, action));
                continue;
            }

            if (TryExtractByFolder(segments, "Pages", includeExtension: false, out var pageName))
            {
                entities.Add(new ExtractedEntity("Page", pageName, action));
                continue;
            }

            if (TryExtractByFolder(segments, "Microflows", includeExtension: false, out var microflowName))
            {
                entities.Add(new ExtractedEntity("Microflow", microflowName, action));
                continue;
            }

            if (TryExtractByFolder(segments, "Resources", includeExtension: true, out var resourceName))
            {
                entities.Add(new ExtractedEntity("Resource", resourceName, action));
                continue;
            }

            var fallbackName = Path.GetFileName(filePath);
            if (string.IsNullOrWhiteSpace(fallbackName))
            {
                fallbackName = "Unknown";
            }

            entities.Add(new ExtractedEntity("Unknown", fallbackName, action));
        }

        return entities.ToArray();
    }

    private static bool TryExtractByFolder(string[] segments, string folderName, bool includeExtension, out string entityName)
    {
        entityName = string.Empty;
        if (segments.Length == 0)
        {
            return false;
        }

        for (var i = 0; i < segments.Length - 1; i++)
        {
            if (!segments[i].Equals(folderName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var candidate = segments[^1];
            entityName = includeExtension ? candidate : Path.GetFileNameWithoutExtension(candidate);
            if (string.IsNullOrWhiteSpace(entityName))
            {
                entityName = includeExtension ? candidate : "Unknown";
            }

            return true;
        }

        return false;
    }

    private static string NormalizeAction(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "Modified";
        }

        if (status.Contains("added", StringComparison.OrdinalIgnoreCase))
        {
            return "Added";
        }

        if (status.Contains("deleted", StringComparison.OrdinalIgnoreCase))
        {
            return "Deleted";
        }

        if (status.Contains("renamed", StringComparison.OrdinalIgnoreCase))
        {
            return "Renamed";
        }

        return "Modified";
    }
}
