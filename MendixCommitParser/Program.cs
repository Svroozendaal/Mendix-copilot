using System.Threading;
using MendixCommitParser.Models;
using MendixCommitParser.Services;
using MendixCommitParser.Storage;

namespace MendixCommitParser;

internal static class Program
{
    private static readonly ManualResetEventSlim ShutdownSignal = new(initialState: false);

    private static int Main()
    {
        Console.WriteLine("MendixCommitParser starting...");

        using var watcherService = new FileWatcherService();
        watcherService.FileProcessed += OnFileProcessed;
        watcherService.FileFailed += OnFileFailed;

        Console.CancelKeyPress += OnCancelKeyPress;

        watcherService.Start();

        Console.WriteLine($"Watching folder: {watcherService.ExportFolderPath}");
        Console.WriteLine("Press Ctrl+C to stop.");

        ShutdownSignal.Wait();

        Console.WriteLine("Shutdown requested. Stopping watcher.");
        return 0;
    }

    private static void OnFileProcessed(string filePath, StructuredCommitData data)
    {
        JsonStorage.Save(data, JsonStorage.DefaultOutputFolder);
        Console.WriteLine($"Processed {Path.GetFileName(filePath)}: {data.Entities.Length} entities extracted, {data.Metrics.TotalFiles} files changed");
    }

    private static void OnFileFailed(string filePath, Exception ex)
    {
        Console.WriteLine($"Failed processing {Path.GetFileName(filePath)}: {ex.Message}");
    }

    private static void OnCancelKeyPress(object? sender, ConsoleCancelEventArgs e)
    {
        e.Cancel = true;
        ShutdownSignal.Set();
    }
}
