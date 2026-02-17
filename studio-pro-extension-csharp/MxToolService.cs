using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace AutoCommitMessage;

/// <summary>
/// Locates and executes the Mendix <c>mx.exe</c> tool.
/// </summary>
public static class MxToolService
{
    private const string ToolName = "mx.exe";
    private const string ToolNotFoundMessage = "Studio Pro 10 not detected: mx.exe not found.";
    private const int DumpTimeoutMs = 5 * 60 * 1000;
    private const int ProbeTimeoutMs = 15 * 1000;
    private static readonly Regex VersionRegex = new(@"\\(?<version>\d+\.\d+\.\d+\.\d+)\\", RegexOptions.Compiled);

    private static readonly object SyncRoot = new();
    private static string? cachedMxExePath;

    /// <summary>
    /// Finds the full path to <c>mx.exe</c>.
    /// </summary>
    /// <returns>Absolute path to <c>mx.exe</c>.</returns>
    /// <exception cref="FileNotFoundException">Thrown when the tool cannot be located.</exception>
    public static string FindMxExe()
    {
        lock (SyncRoot)
        {
            if (!string.IsNullOrWhiteSpace(cachedMxExePath) && File.Exists(cachedMxExePath))
            {
                return cachedMxExePath;
            }

            var candidates = EnumerateMxCandidates()
                .Where(candidate => !string.IsNullOrWhiteSpace(candidate) && File.Exists(candidate))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(candidate => new
                {
                    Path = candidate,
                    Version = TryParseVersion(candidate),
                })
                .OrderByDescending(item => item.Version)
                .ThenByDescending(item => item.Path.Contains(@"\modeler\", StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var candidate in candidates)
            {
                if (SupportsDumpMpr(candidate.Path))
                {
                    cachedMxExePath = candidate.Path;
                    return cachedMxExePath;
                }
            }
        }

        throw new FileNotFoundException(
            $"{ToolNotFoundMessage} No compatible mx.exe with dump-mpr support was found.");
    }

    /// <summary>
    /// Runs <c>mx.exe dump-mpr</c> and writes a JSON dump to the requested output path.
    /// </summary>
    /// <param name="mprPath">Path to the .mpr file to dump.</param>
    /// <param name="outputPath">Path where JSON output should be written.</param>
    /// <returns>The <paramref name="outputPath"/> value on success.</returns>
    /// <exception cref="FileNotFoundException">Thrown when the .mpr file is missing.</exception>
    /// <exception cref="InvalidOperationException">Thrown when mx exits with a non-zero code.</exception>
    public static string DumpMpr(string mprPath, string outputPath)
    {
        if (string.IsNullOrWhiteSpace(mprPath) || !File.Exists(mprPath))
        {
            throw new FileNotFoundException($"MPR file not found: {mprPath}");
        }

        if (string.IsNullOrWhiteSpace(outputPath))
        {
            throw new ArgumentException("Output path is required.", nameof(outputPath));
        }

        var outputDirectory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrWhiteSpace(outputDirectory))
        {
            Directory.CreateDirectory(outputDirectory);
        }

        var mxExe = FindMxExe();
        var startInfo = new ProcessStartInfo
        {
            FileName = mxExe,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("dump-mpr");
        startInfo.ArgumentList.Add(mprPath);
        startInfo.ArgumentList.Add("--output-file");
        startInfo.ArgumentList.Add(outputPath);

        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start mx.exe process.");

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        if (!process.WaitForExit(DumpTimeoutMs))
        {
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch
            {
                // Best-effort cleanup for a timed out process.
            }

            throw new InvalidOperationException("mx.exe dump-mpr timed out.");
        }

        Task.WaitAll(stdoutTask, stderrTask);
        var stdout = stdoutTask.Result;
        var stderr = stderrTask.Result;

        if (process.ExitCode != 0)
        {
            var details = string.IsNullOrWhiteSpace(stderr) ? stdout : stderr;
            throw new InvalidOperationException(
                $"mx.exe dump-mpr failed with exit code {process.ExitCode}. {details}".Trim());
        }

        if (!File.Exists(outputPath))
        {
            throw new InvalidOperationException("mx.exe dump-mpr completed without producing the output file.");
        }

        return outputPath;
    }

    private static IEnumerable<string> EnumerateMxCandidates()
    {
        foreach (var fromPath in EnumeratePathCandidates())
        {
            yield return fromPath;
        }

        foreach (var installLocation in EnumerateRegistryInstallLocations())
        {
            foreach (var candidate in BuildCandidatesFromInstallLocation(installLocation))
            {
                yield return candidate;
            }
        }

        foreach (var fallback in EnumerateProgramFilesCandidates())
        {
            yield return fallback;
        }
    }

    private static IEnumerable<string> EnumeratePathCandidates()
    {
        var pathValue = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(pathValue))
        {
            yield break;
        }

        foreach (var pathEntry in pathValue.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            string fullCandidate;
            try
            {
                fullCandidate = Path.Combine(pathEntry, ToolName);
            }
            catch
            {
                continue;
            }

            yield return fullCandidate;
        }
    }

    private static IEnumerable<string> EnumerateRegistryInstallLocations()
    {
        foreach (var hive in new[] { RegistryHive.LocalMachine, RegistryHive.CurrentUser })
        {
            foreach (var view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
            {
                RegistryKey? baseKey = null;
                try
                {
                    baseKey = RegistryKey.OpenBaseKey(hive, view);
                }
                catch
                {
                    continue;
                }

                using (baseKey)
                {
                    if (baseKey is null)
                    {
                        continue;
                    }

                    foreach (var installPath in EnumerateInstallLocations(baseKey, @"SOFTWARE\Mendix\Studio Pro"))
                    {
                        yield return installPath;
                    }

                    foreach (var installPath in EnumerateInstallLocations(baseKey, @"SOFTWARE\WOW6432Node\Mendix\Studio Pro"))
                    {
                        yield return installPath;
                    }
                }
            }
        }
    }

    private static IEnumerable<string> EnumerateInstallLocations(RegistryKey baseKey, string studioProRootPath)
    {
        using var studioProRoot = baseKey.OpenSubKey(studioProRootPath);
        if (studioProRoot is null)
        {
            yield break;
        }

        foreach (var versionKeyName in studioProRoot.GetSubKeyNames())
        {
            using var versionKey = studioProRoot.OpenSubKey(versionKeyName);
            if (versionKey is null)
            {
                continue;
            }

            var installLocation = versionKey.GetValue("InstallLocation") as string;
            if (!string.IsNullOrWhiteSpace(installLocation))
            {
                yield return installLocation;
            }
        }
    }

    private static IEnumerable<string> BuildCandidatesFromInstallLocation(string installLocation)
    {
        if (string.IsNullOrWhiteSpace(installLocation))
        {
            yield break;
        }

        yield return Path.Combine(installLocation, ToolName);
        yield return Path.Combine(installLocation, "modeler", ToolName);
    }

    private static IEnumerable<string> EnumerateProgramFilesCandidates()
    {
        foreach (var root in new[] { Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86) })
        {
            if (string.IsNullOrWhiteSpace(root))
            {
                continue;
            }

            var mendixRoot = Path.Combine(root, "Mendix");
            if (!Directory.Exists(mendixRoot))
            {
                continue;
            }

            IEnumerable<string> versionDirectories;
            try
            {
                versionDirectories = Directory.EnumerateDirectories(mendixRoot);
            }
            catch
            {
                continue;
            }

            foreach (var versionDirectory in versionDirectories)
            {
                yield return Path.Combine(versionDirectory, "modeler", ToolName);
                yield return Path.Combine(versionDirectory, ToolName);
            }
        }
    }

    private static Version TryParseVersion(string path)
    {
        var match = VersionRegex.Match(path);
        if (!match.Success)
        {
            return new Version(0, 0, 0, 0);
        }

        var rawVersion = match.Groups["version"].Value;
        return Version.TryParse(rawVersion, out var parsedVersion)
            ? parsedVersion
            : new Version(0, 0, 0, 0);
    }

    private static bool SupportsDumpMpr(string mxExePath)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = mxExePath,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            startInfo.ArgumentList.Add("dump-mpr");
            startInfo.ArgumentList.Add("--help");

            using var process = Process.Start(startInfo);
            if (process is null)
            {
                return false;
            }

            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();

            if (!process.WaitForExit(ProbeTimeoutMs))
            {
                try
                {
                    process.Kill(entireProcessTree: true);
                }
                catch
                {
                    // Ignore probe termination failures.
                }

                return false;
            }

            Task.WaitAll(stdoutTask, stderrTask);
            var combined = string.Concat(stdoutTask.Result, Environment.NewLine, stderrTask.Result);
            return combined.IndexOf("Usage: mx dump-mpr", StringComparison.OrdinalIgnoreCase) >= 0;
        }
        catch
        {
            return false;
        }
    }
}
