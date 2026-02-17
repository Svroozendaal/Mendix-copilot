using System.Text;
using System.Text.Json;
using MendixCommitParser.Models;

namespace MendixCommitParser.Storage;

/// <summary>
/// Persists structured commit data to JSON files.
/// </summary>
public static class JsonStorage
{
    public const string DefaultOutputFolder = @"C:\MendixGitData\structured";

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Writes a structured commit data file to the provided output folder.
    /// </summary>
    public static string Save(StructuredCommitData data, string outputFolder)
    {
        ArgumentNullException.ThrowIfNull(data);

        if (string.IsNullOrWhiteSpace(outputFolder))
        {
            throw new ArgumentException("Output folder is required.", nameof(outputFolder));
        }

        Directory.CreateDirectory(outputFolder);

        var fileName = $"{data.CommitId}.json";
        var destinationPath = Path.Combine(outputFolder, fileName);
        var tempPath = Path.Combine(outputFolder, $"{data.CommitId}.{Guid.NewGuid():N}.tmp");

        var json = JsonSerializer.Serialize(data, SerializerOptions);
        File.WriteAllText(tempPath, json, Encoding.UTF8);

        if (File.Exists(destinationPath))
        {
            File.Delete(destinationPath);
        }

        File.Move(tempPath, destinationPath);
        return destinationPath;
    }
}
