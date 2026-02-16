# info_config

> Laatst bijgewerkt: 2026-02-16

## Doel
Configuratie management. Leest environment variables en biedt getypeerde configuratie aan de rest van de applicatie.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| index.ts | Config loading en validatie | Geimplementeerd |

## Interface

```typescript
interface MendixCopilotConfig {
  mendixToken: string;  // Mendix PAT token
  appId: string;        // Mendix App ID (ook wel Project ID)
  branch: string;       // Branch naam, default "main"
}
```

## Environment Variables
| Variable | Verplicht | Default | Beschrijving |
|----------|-----------|---------|--------------|
| MENDIX_TOKEN | Ja | - | Personal Access Token van Mendix |
| MENDIX_APP_ID | Ja | - | App ID uit de Mendix Developer Portal |
| MENDIX_BRANCH | Nee | "main" | Branch om de working copy op te baseren |

## CLI flags
| Flag | Verplicht | Default | Beschrijving |
|------|-----------|---------|--------------|
| --app-id | Nee* | - | Fallback voor `MENDIX_APP_ID` wanneer env var ontbreekt |
| --branch | Nee | "main" | Fallback voor `MENDIX_BRANCH` wanneer env var ontbreekt |

`*` Er moet altijd een app-id beschikbaar zijn via env of CLI.

## Gedrag
- `MENDIX_TOKEN` en `MENDIX_APP_ID` worden getrimd en zijn verplicht.
- `MENDIX_APP_ID` en `MENDIX_BRANCH` kunnen uit CLI flags komen als env vars ontbreken.
- Environment variables hebben prioriteit boven CLI flags.
- `MENDIX_BRANCH` wordt getrimd; lege of whitespace waarde valt terug op `main`.

## Bekende beperkingen
- PAT tokens verlopen; er is geen automatische refresh.
- `.env` bestanden worden nog niet automatisch geladen (gebruik `dotenv` of shell exports).
