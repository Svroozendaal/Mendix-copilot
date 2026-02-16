# info_config

> Laatst bijgewerkt: 2026-02-16

## Doel
Configuratie management. Leest environment variables en biedt getypeerde configuratie aan de rest van de applicatie.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| index.ts | Config loading & validatie | 📋 Gepland |

## Bekende beperkingen
- PAT tokens verlopen — geen automatische refresh
- .env bestanden worden nog niet automatisch geladen (gebruik `dotenv` of shell exports)
