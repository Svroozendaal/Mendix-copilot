$ErrorActionPreference = "Stop"

$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "commands/start-copilot.ps1"

if (-not (Test-Path -Path $scriptPath)) {
  throw "Script niet gevonden: $scriptPath"
}

& $scriptPath @args
