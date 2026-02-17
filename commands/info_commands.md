# info_commands

> Laatst bijgewerkt: 2026-02-17

## Doel
PowerShell command scripts voor lokaal gebruik in development en Studio Pro deployment.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| start-copilot.ps1 | Start API + web UI met `.env` loading | Geimplementeerd |
| deploy-studio-pro10-panel.ps1 | Build + kopieert Studio Pro 10 extension files naar opgegeven Mendix app-folder | Geimplementeerd |

## Hoe het werkt
- `start-copilot.ps1` draait vanuit repo root en start `npm run dev`.
- `deploy-studio-pro10-panel.ps1` verwacht 1 parameter: pad naar Mendix app-folder.
- Deployment script kopieert:
  - `WellBased.Copilot.StudioPro10.dll`
  - `manifest.json`
  naar `<MendixAppFolder>/extensions/WellBased.Copilot.StudioPro10/`.

## Afhankelijkheden
- Node.js + npm (voor start script)
- .NET SDK (voor build in deploy script)

## Bekende beperkingen
- Script installeert niet automatisch Studio Pro flags; Studio Pro moet gestart worden met `--enable-extension-development`.
