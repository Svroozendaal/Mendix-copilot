[CmdletBinding()]
param(
    [string]$AppPath = 'C:\Workspaces\Mendix\Smart Expenses app-main',
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $repoRoot 'studio-pro-extension-csharp\AutoCommitMessage.csproj'
$buildOutput = Join-Path $repoRoot "studio-pro-extension-csharp\bin\$Configuration\net8.0-windows"

$extensionName = 'AutoCommitMessage'
$dllName = "$extensionName.dll"
$pdbName = "$extensionName.pdb"
$manifestName = 'manifest.json'

$targetDir = Join-Path $AppPath "extensions\$extensionName"
$targetDll = Join-Path $targetDir $dllName
$targetPdb = Join-Path $targetDir $pdbName
$targetManifest = Join-Path $targetDir $manifestName

if (-not (Test-Path $AppPath -PathType Container)) {
    throw "Mendix app path not found: $AppPath"
}

if (-not (Test-Path $projectPath -PathType Leaf)) {
    throw "Extension project not found: $projectPath"
}

if (-not $SkipBuild) {
    Write-Host "Building extension ($Configuration)..." -ForegroundColor Cyan
    dotnet build $projectPath -c $Configuration
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet build failed with exit code $LASTEXITCODE"
    }
}

$sourceDll = Join-Path $buildOutput $dllName
$sourcePdb = Join-Path $buildOutput $pdbName
$sourceManifest = Join-Path $buildOutput $manifestName

if (-not (Test-Path $sourceDll -PathType Leaf)) {
    throw "Built DLL not found: $sourceDll"
}

if (-not (Test-Path $sourceManifest -PathType Leaf)) {
    throw "Built manifest not found: $sourceManifest"
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

Copy-Item -Path $sourceDll -Destination $targetDll -Force
Copy-Item -Path $sourceManifest -Destination $targetManifest -Force

if (Test-Path $sourcePdb -PathType Leaf) {
    Copy-Item -Path $sourcePdb -Destination $targetPdb -Force
}

$legacyDll = Join-Path $targetDir 'WellBased_Copilot_StudioPro10.dll'
if (Test-Path $legacyDll -PathType Leaf) {
    Remove-Item -Path $legacyDll -Force
}

Write-Host ''
Write-Host 'Deployment complete.' -ForegroundColor Green
Write-Host "App path:      $AppPath"
Write-Host "Target folder: $targetDir"
Write-Host "DLL:           $targetDll"
Write-Host "Manifest:      $targetManifest"
if (Test-Path $targetPdb -PathType Leaf) {
    Write-Host "PDB:           $targetPdb"
}
