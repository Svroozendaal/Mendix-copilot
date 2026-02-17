param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$MendixAppFolder,

  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path -Path (Join-Path -Path $PSScriptRoot -ChildPath "..")
$projectFile = Join-Path -Path $repoRoot -ChildPath "studio-pro-extension-csharp/WellBased.Copilot.StudioPro10.csproj"
$sourceDir = Join-Path -Path $repoRoot -ChildPath "studio-pro-extension-csharp/bin/Release/net8.0"

if (-not (Test-Path -Path $projectFile)) {
  throw "Projectbestand niet gevonden: $projectFile"
}

$resolvedAppFolder = Resolve-Path -Path $MendixAppFolder -ErrorAction Stop
$targetDir = Join-Path -Path $resolvedAppFolder -ChildPath "extensions/WellBased.Copilot.StudioPro10"

if (-not $SkipBuild) {
  Write-Host "Bouwen van Studio Pro 10 extension..."
  dotnet build $projectFile -c Release
}

$sourceFiles = @(
  "WellBased.Copilot.StudioPro10.dll",
  "manifest.json"
)

foreach ($file in $sourceFiles) {
  $fullPath = Join-Path -Path $sourceDir -ChildPath $file
  if (-not (Test-Path -Path $fullPath)) {
    throw "Bronbestand ontbreekt: $fullPath. Build de extension eerst of draai zonder -SkipBuild."
  }
}

if (-not (Test-Path -Path $targetDir)) {
  New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
}

Write-Host "Kopieren naar: $targetDir"
foreach ($file in $sourceFiles) {
  Copy-Item -Path (Join-Path -Path $sourceDir -ChildPath $file) -Destination (Join-Path -Path $targetDir -ChildPath $file) -Force
}

Write-Host ""
Write-Host "Klaar."
Write-Host "Volgende stap:"
Write-Host "1) Start Studio Pro 10 met: --enable-extension-development"
Write-Host "2) Open: Extensions -> WellBased.Copilot.StudioPro10 -> Open Panel"
