$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -Path (Join-Path -Path $PSScriptRoot -ChildPath "..")
Set-Location -Path $repoRoot

function Set-EnvFromDotEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -Path $Path)) {
    return
  }

  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) {
      return
    }

    if ($line.StartsWith("#")) {
      return
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      return
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

Set-EnvFromDotEnv -Path ".env"

if (-not (Test-Path -Path "node_modules")) {
  Write-Host "node_modules niet gevonden, npm install wordt uitgevoerd..."
  npm install
}

Write-Host "Mendix Copilot API + Web UI starten..."
npm run dev
