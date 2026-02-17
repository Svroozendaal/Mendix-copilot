using System;
using System.Collections.Generic;
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

                changes.Add(new GitFileChange
                {
                    FilePath = entry.FilePath,
                    Status = DetermineStatus(entry.State),
                    IsStaged = IsStaged(entry.State),
                    DiffText = GetDiffText(entry.FilePath, patch),
                });
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
}

