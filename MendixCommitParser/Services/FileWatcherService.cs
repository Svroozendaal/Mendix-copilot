using System.Collections.Concurrent;
using System.Text.Json;
using MendixCommitParser.Models;

namespace MendixCommitParser.Services;

/// <summary>
/// Watches the export directory and processes incoming commit files.
/// </summary>
public sealed class FileWatcherService : IDisposable
{
    public const string DefaultExportFolder = @"C:\MendixGitData\exports";
    public const string DefaultProcessedFolder = @"C:\MendixGitData\processed";
    public const string DefaultErrorsFolder = @"C:\MendixGitData\errors";

    private readonly string _exportFolderPath;
    private readonly string _processedFolderPath;
    private readonly string _errorsFolderPath;
    private readonly FileSystemWatcher _watcher;
    private readonly ConcurrentDictionary<string, byte> _inFlight;
    private bool _disposed;

    /// <summary>
    /// Raised when a file has been parsed and stored successfully.
    /// </summary>
    public event Action<string, StructuredCommitData>? FileProcessed;

    /// <summary>
    /// Raised when file processing fails.
    /// </summary>
    public event Action<string, Exception>? FileFailed;

    /// <summary>
    /// Full path of the watched export folder.
    /// </summary>
    public string ExportFolderPath => _exportFolderPath;

    /// <summary>
    /// Creates a new file watcher service with optional folder overrides.
    /// </summary>
    public FileWatcherService(
        string? exportFolderPath = null,
        string? processedFolderPath = null,
        string? errorsFolderPath = null)
    {
        _exportFolderPath = exportFolderPath ?? DefaultExportFolder;
        _processedFolderPath = processedFolderPath ?? DefaultProcessedFolder;
        _errorsFolderPath = errorsFolderPath ?? DefaultErrorsFolder;

        _inFlight = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);

        EnsureFoldersExist();

        _watcher = new FileSystemWatcher(_exportFolderPath, "*.json")
        {
            IncludeSubdirectories = false,
            NotifyFilter = NotifyFilters.FileName | NotifyFilters.CreationTime | NotifyFilters.Size
        };

        _watcher.Created += OnFileCreated;
        _watcher.Renamed += OnFileRenamed;
        _watcher.Error += OnWatcherError;
    }

    /// <summary>
    /// Starts monitoring the export folder.
    /// </summary>
    public void Start()
    {
        ThrowIfDisposed();
        EnsureFoldersExist();

        _watcher.EnableRaisingEvents = true;
    }

    private void OnFileCreated(object sender, FileSystemEventArgs e)
    {
        QueueProcessing(e.FullPath);
    }

    private void OnFileRenamed(object sender, RenamedEventArgs e)
    {
        QueueProcessing(e.FullPath);
    }

    private void OnWatcherError(object sender, ErrorEventArgs e)
    {
        FileFailed?.Invoke(_exportFolderPath, e.GetException());
    }

    private void QueueProcessing(string filePath)
    {
        if (!filePath.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!_inFlight.TryAdd(filePath, 0))
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                await ProcessFileAsync(filePath).ConfigureAwait(false);
            }
            finally
            {
                _inFlight.TryRemove(filePath, out _);
            }
        });
    }

    private async Task ProcessFileAsync(string filePath)
    {
        try
        {
            await WaitForFileReadyAsync(filePath).ConfigureAwait(false);
            var structured = CommitParserService.ProcessFile(filePath);
            FileProcessed?.Invoke(filePath, structured);
            MoveFile(filePath, _processedFolderPath);
        }
        catch (JsonException ex)
        {
            MoveFileIfExists(filePath, _errorsFolderPath);
            FileFailed?.Invoke(filePath, ex);
        }
        catch (FileNotFoundException ex)
        {
            FileFailed?.Invoke(filePath, ex);
        }
        catch (Exception ex)
        {
            MoveFileIfExists(filePath, _errorsFolderPath);
            FileFailed?.Invoke(filePath, ex);
        }
    }

    private static async Task WaitForFileReadyAsync(string filePath, int retries = 20, int delayMilliseconds = 250)
    {
        for (var attempt = 0; attempt < retries; attempt++)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("Export file no longer exists.", filePath);
            }

            try
            {
                using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.None);
                return;
            }
            catch (IOException)
            {
                await Task.Delay(delayMilliseconds).ConfigureAwait(false);
            }
        }

        throw new IOException($"File remained locked after {retries} attempts: {filePath}");
    }

    private static void MoveFileIfExists(string sourcePath, string destinationFolder)
    {
        if (!File.Exists(sourcePath))
        {
            return;
        }

        MoveFile(sourcePath, destinationFolder);
    }

    private static string MoveFile(string sourcePath, string destinationFolder)
    {
        Directory.CreateDirectory(destinationFolder);

        var fileName = Path.GetFileName(sourcePath);
        var destinationPath = Path.Combine(destinationFolder, fileName);

        if (File.Exists(destinationPath))
        {
            var uniqueSuffix = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            var stem = Path.GetFileNameWithoutExtension(fileName);
            var extension = Path.GetExtension(fileName);
            destinationPath = Path.Combine(destinationFolder, $"{stem}_{uniqueSuffix}{extension}");
        }

        File.Move(sourcePath, destinationPath);
        return destinationPath;
    }

    private void EnsureFoldersExist()
    {
        Directory.CreateDirectory(_exportFolderPath);
        Directory.CreateDirectory(_processedFolderPath);
        Directory.CreateDirectory(_errorsFolderPath);
    }

    private void ThrowIfDisposed()
    {
        if (_disposed)
        {
            throw new ObjectDisposedException(nameof(FileWatcherService));
        }
    }

    /// <summary>
    /// Disposes watcher resources.
    /// </summary>
    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _watcher.EnableRaisingEvents = false;
        _watcher.Created -= OnFileCreated;
        _watcher.Renamed -= OnFileRenamed;
        _watcher.Error -= OnWatcherError;
        _watcher.Dispose();
    }
}
