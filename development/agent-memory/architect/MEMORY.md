# Architect Agent Memory

## Project State
- Fase: Skelet opgezet, nul TypeScript bestanden. Alle `info_*.md` en docs bestaan, geen broncode.
- Eerste implementatie: MCP Server fundament + get_app_info tool (Fase 1, Week 1-2 van MVP-PLAN.md)

## Key Architectural Decisions
- Lazy init van MendixClient (niet bij server start, maar bij eerste tool call)
- Config via env vars (MENDIX_TOKEN, MENDIX_APP_ID, MENDIX_BRANCH), geen CLI parsing
- MendixClient als facade over Platform SDK + Model SDK
- Errors als MCP content response met isError: true, nooit thrown exceptions
- Alle beslissingen gelogd in docs/DECISIONS.md

## Patterns
- Tool registratie: `registerXxxTools(server, mendixClient)` per tools/*.ts bestand
- Serializers: nemen SDK objecten, retourneren beknopte strings, nooit SDK internals
- Import style: named exports, geen default exports
- McpServer import: `@modelcontextprotocol/sdk/server/mcp.js` (let op .js extensie voor ESM)
- StdioServerTransport: `@modelcontextprotocol/sdk/server/stdio.js`

## File Conventions
- kebab-case.ts voor bestanden, PascalCase voor types, camelCase voor functies
- Elke code-folder moet info_[naam].md hebben
- Tests in tests/unit/ spiegelen src/ structuur

## Pitfalls
- Mendix SDK lazy loading: properties pas beschikbaar na .load() call
- System module niet toegankelijk via SDK
- Working copy aanmaken duurt 30-60s, daarom lazy init
- ESM project (type: "module" in package.json), imports vereisen .js extensies in compiled output
