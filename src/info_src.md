# info_src

> Laatst bijgewerkt: 2026-02-16

## Doel
Root source folder. Bevat alle TypeScript broncode voor de Mendix Copilot MCP Server.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| index.ts | Entry point — MCP server setup, tool/resource/prompt registratie | 📋 Gepland |

## Subfolders
| Folder | Doel |
|--------|------|
| config/ | Configuratie management (env vars, defaults) |
| mendix/ | Mendix SDK client, cache, en serializers |
| tools/ | MCP tool definities (wat Claude kan aanroepen) |
| resources/ | MCP resource definities (context die Claude kan lezen) |
| prompts/ | MCP prompt templates (voorgedefinieerde workflows) |

## Hoe het werkt
`index.ts` is het startpunt. Het maakt de MCP server aan, initialiseert de Mendix client, en registreert alle tools/resources/prompts uit de subfolders.

## Afhankelijkheden
- `@modelcontextprotocol/sdk` — MCP server framework
- `mendixplatformsdk` + `mendixmodelsdk` — Mendix SDK
- `zod` — Schema validatie voor tool parameters
