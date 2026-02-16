# info_src

> Laatst bijgewerkt: 2026-02-16

## Doel
Root source folder. Bevat alle TypeScript broncode voor Mendix Copilot hosts (MCP en localhost API).

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| index.ts | MCP entry point: config, startup banner, tool/resource/prompt registratie, transport, shutdown | Geimplementeerd |

## Subfolders
| Folder | Doel |
|--------|------|
| config/ | Configuratie management (env vars, defaults, CLI fallback) |
| core/ | Gedeelde core service (`text + meta`) bovenop MendixClient + serializers |
| mendix/ | Mendix SDK facade, cache, serializers |
| tools/ | MCP tool definities |
| resources/ | MCP resources |
| prompts/ | MCP prompt templates |
| web/ | Lokale web API laag voor de localhost UI |

## Runtime gedrag
- `src/index.ts` start MCP server op stdio en logt op stderr.
- `src/web/api/index.ts` start `copilot-api` op HTTP met SSE chat events.

## Afhankelijkheden
- `@modelcontextprotocol/sdk`
- `mendixplatformsdk` + `mendixmodelsdk`
- `express`
- `zod`
