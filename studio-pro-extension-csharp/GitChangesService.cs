using System.Text;
using LibGit2Sharp;

namespace AutoCommitMessage;

/// <summary>
/// Reads uncommitted Git changes for Mendix project files.
/// </summary>
public static class GitChangesService
{
    private static readonly string[] FilteredPathSpec = { "*.mpr", "*.mprops" };

    private const string StatusModified = "Modified";
    private const string StatusAdded = "Added";
    private const string StatusDeleted = "Deleted";
    private const string StatusRenamed = "Renamed";

    private const string BinaryDiffMessage = "Binary file changed - diff not available";
    private const string DiffUnavailableMessage = "Diff unavailable";

    /// <summary>
    /// Reads the current repository status and diff data for supported Mendix files.
    /// </summary>
    /// <param name="projectPath">The path to the project root.</param>
    /// <returns>A payload containing repository state, change items, and optional errors.</returns>
    public static GitChangesPayload ReadChanges(string projectPath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(projectPath))
            {
                return new GitChangesPayload
                {
                    IsGitRepo = false,
                    BranchName = string.Empty,
                    Changes = Array.Empty<GitFileChange>(),
                    Error = "Project path is empty.",
                };
            }

            var discoveredPath = Repository.Discover(projectPath);
            if (string.IsNullOrWhiteSpace(discoveredPath))
            {
                return new GitChangesPayload
                {
                    IsGitRepo = false,
                    BranchName = string.Empty,
                    Changes = Array.Empty<GitFileChange>(),
                    Error = null,
                };
            }

            using var repository = new Repository(discoveredPath);
            var repositoryRoot = repository.Info.WorkingDirectory;

            var statusOptions = new StatusOptions
            {
                IncludeIgnored = false,
                IncludeUntracked = true,
                RecurseUntrackedDirs = true,
                PathSpec = FilteredPathSpec,
            };

            var statusEntries = repository.RetrieveStatus(statusOptions);
            var patch = repository.Diff.Compare<Patch>(FilteredPathSpec, includeUntracked: true);

            var changes = new List<GitFileChange>();
            foreach (var entry in statusEntries)
            {
                if (entry.State == FileStatus.Unaltered || entry.State == FileStatus.Ignored)
                {
                    continue;
                }

                var fileChange = new GitFileChange
                {
                    FilePath = entry.FilePath,
                    Status = DetermineStatus(entry.State),
                    IsStaged = IsStaged(entry.State),
                    DiffText = GetDiffText(entry.FilePath, patch),
                };

                if (entry.FilePath.EndsWith(".mpr", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var modelChanges = AnalyzeMprChanges(
                            repository,
                            repositoryRoot,
                            NormalizeRepositoryPath(entry.FilePath));

                        fileChange = fileChange with { ModelChanges = modelChanges };
                    }
                    catch (Exception exception)
                    {
                        fileChange = fileChange with
                        {
                            ModelChanges = new List<MendixModelChange>
                            {
                                new(
                                    "Modified",
                                    "Model Analysis",
                                    Path.GetFileName(entry.FilePath),
                                    $"Model analysis unavailable: {exception.Message}"),
                            },
                        };
                    }
                }

                changes.Add(fileChange);
            }

            return new GitChangesPayload
            {
                IsGitRepo = true,
                BranchName = repository.Head?.FriendlyName ?? string.Empty,
                Changes = changes,
                Error = null,
            };
        }
        catch (RepositoryNotFoundException)
        {
            return new GitChangesPayload
            {
                IsGitRepo = false,
                BranchName = string.Empty,
                Changes = Array.Empty<GitFileChange>(),
                Error = null,
            };
        }
        catch (Exception exception)
        {
            return new GitChangesPayload
            {
                IsGitRepo = true,
                BranchName = string.Empty,
                Changes = Array.Empty<GitFileChange>(),
                Error = exception.Message,
            };
        }
    }

    private static string DetermineStatus(FileStatus status)
    {
        if ((status & (FileStatus.RenamedInIndex | FileStatus.RenamedInWorkdir)) != 0)
        {
            return StatusRenamed;
        }

        if ((status & (FileStatus.DeletedFromIndex | FileStatus.DeletedFromWorkdir)) != 0)
        {
            return StatusDeleted;
        }

        if ((status & (FileStatus.NewInIndex | FileStatus.NewInWorkdir)) != 0)
        {
            return StatusAdded;
        }

        return StatusModified;
    }

    private static bool IsStaged(FileStatus status)
    {
        const FileStatus stagedMask =
            FileStatus.NewInIndex |
            FileStatus.ModifiedInIndex |
            FileStatus.DeletedFromIndex |
            FileStatus.RenamedInIndex |
            FileStatus.TypeChangeInIndex;

        return (status & stagedMask) != 0;
    }

    private static string GetDiffText(string filePath, Patch patch)
    {
        try
        {
            var patchEntry = patch[filePath];
            if (patchEntry is null)
            {
                return DiffUnavailableMessage;
            }

            if (patchEntry.IsBinaryComparison || filePath.EndsWith(".mpr", StringComparison.OrdinalIgnoreCase))
            {
                return BinaryDiffMessage;
            }

            return string.IsNullOrWhiteSpace(patchEntry.Patch)
                ? DiffUnavailableMessage
                : patchEntry.Patch;
        }
        catch
        {
            return DiffUnavailableMessage;
        }
    }

    private static List<MendixModelChange> AnalyzeMprChanges(
        Repository repository,
        string repositoryRoot,
        string repositoryRelativeMprPath)
    {
        var workingDumpPath = CreateTempPath(".json");
        var headDumpPath = CreateTempPath(".json");
        var headMprPath = CreateTempPath(".mpr");

        try
        {
            var workingMprPath = Path.Combine(repositoryRoot, repositoryRelativeMprPath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(workingMprPath))
            {
                MxToolService.DumpMpr(workingMprPath, workingDumpPath);
            }
            else
            {
                WriteEmptyDump(workingDumpPath);
            }

            if (TryWriteHeadMpr(repository, repositoryRelativeMprPath, headMprPath))
            {
                MxToolService.DumpMpr(headMprPath, headDumpPath);
            }
            else
            {
                WriteEmptyDump(headDumpPath);
            }

            return MendixModelDiffService.CompareDumps(workingDumpPath, headDumpPath);
        }
        finally
        {
            TryDeleteFile(workingDumpPath);
            TryDeleteFile(headDumpPath);
            TryDeleteFile(headMprPath);
        }
    }

    private static bool TryWriteHeadMpr(Repository repository, string repositoryRelativeMprPath, string destinationPath)
    {
        var headCommit = repository.Head?.Tip;
        if (headCommit is null)
        {
            return false;
        }

        var treeEntry = headCommit[repositoryRelativeMprPath];
        if (treeEntry?.Target is not Blob headBlob)
        {
            return false;
        }

        using var outputStream = File.Create(destinationPath);
        using var blobStream = headBlob.GetContentStream();
        blobStream.CopyTo(outputStream);
        return true;
    }

    private static string CreateTempPath(string extension) =>
        Path.Combine(Path.GetTempPath(), $"autocommitmessage_{Guid.NewGuid():N}{extension}");

    private static string NormalizeRepositoryPath(string path) =>
        path.Replace('\\', '/');

    private static void WriteEmptyDump(string outputPath)
    {
        const string emptyDumpJson = "{\"units\":[]}";
        File.WriteAllText(outputPath, emptyDumpJson, new UTF8Encoding(false));
    }

    private static void TryDeleteFile(string path)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(path) && File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            // Ignore cleanup failures for temp artifacts.
        }
    }
}
