# Mendix Copilot — Project Intelligence

> Dit is de masterprompt voor het Mendix Copilot project. Claude Code leest dit bestand automatisch bij elke sessie.

## Wat is dit project?

Mendix Copilot is een **MCP Server** (Model Context Protocol) die de Mendix Platform SDK en Model SDK wrapt, zodat Claude (via Claude Code of Claude Desktop) een Mendix applicatie kan inspecteren, analyseren en er vragen over beantwoorden.

**Tech stack**: TypeScript, Node.js, MCP SDK, Mendix Platform SDK, Mendix Model SDK
**Transport**: stdio (Claude Code) + Streamable HTTP (Claude Desktop)
**Architectuur**: MCP Server met tools, resources en prompts

## Projectstructuur

```
mendix-copilot/
├── CLAUDE.md                          ← Dit bestand (projectintelligentie)
├── package.json
├── tsconfig.json
├── .claude/
│   ├── agents/                        ← Subagents voor gespecialiseerde taken
│   │   ├── architect.md               ← Architectuur & designbeslissingen
│   │   ├── implementer.md             ← Feature implementatie
│   │   ├── reviewer.md                ← Code review & quality
│   │   ├── documenter.md              ← Documentatie & info_*.md bestanden
│   │   └── debugger.md                ← Debugging & troubleshooting
│   ├── skills/
│   │   ├── mendix-sdk/SKILL.md        ← Mendix SDK kennis & patronen
│   │   ├── mcp-server/SKILL.md        ← MCP Server development patronen
│   │   └── testing/SKILL.md           ← Test strategie & patronen
│   └── commands/
│       ├── implement.md               ← /implement <feature>
│       ├── review.md                  ← /review <pad>
│       ├── document.md                ← /document <folder>
│       └── status.md                  ← /status
├── src/
│   ├── index.ts                       ← Entry point & MCP server setup
│   ├── info_src.md                    ← Documentatie over src/
│   ├── config/
│   │   ├── index.ts                   ← Configuratie management
│   │   └── info_config.md
│   ├── mendix/
│   │   ├── client.ts                  ← Mendix SDK client wrapper
│   │   ├── cache.ts                   ← Model caching layer
│   │   ├── serializers/               ← Model → Claude-friendly output
│   │   │   ├── domain-model.ts
│   │   │   ├── microflow.ts
│   │   │   ├── page.ts
│   │   │   ├── security.ts
│   │   │   └── info_serializers.md
│   │   └── info_mendix.md
│   ├── tools/
│   │   ├── navigation.ts              ← list_modules, get_app_info, search
│   │   ├── domain-model.ts            ← entity & association tools
│   │   ├── logic.ts                   ← microflow & nanoflow tools
│   │   ├── pages.ts                   ← page & UI tools
│   │   ├── security.ts                ← security audit tools
│   │   ├── analysis.ts                ← best practices & dependency tools
│   │   └── info_tools.md
│   ├── resources/
│   │   ├── app-overview.ts            ← mendix://app/overview resource
│   │   └── info_resources.md
│   └── prompts/
│       ├── review-module.ts           ← Pre-built review prompt
│       ├── explain-microflow.ts       ← Microflow explanation prompt
│       ├── security-audit.ts          ← Security audit prompt
│       └── info_prompts.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── info_tests.md
├── docs/
│   ├── ARCHITECTURE.md                ← Technisch ontwerp
│   ├── DEVELOPMENT.md                 ← Development workflow
│   ├── DECISIONS.md                   ← Architectuurbeslissingen log
│   └── MVP-PLAN.md                    ← Product roadmap
└── scripts/
    └── info_scripts.md
```

## Development Regels

### 🔴 ABSOLUTE REGELS (nooit overtreden)

1. **Elke code-folder MOET een `info_[naam].md` bestand hebben** dat beschrijft:
   - Wat de folder bevat en waarom
   - Welke bestanden erin zitten en hun doel
   - Hoe de onderdelen samenwerken
   - Bekende beperkingen of aandachtspunten
   - Wanneer dit bestand laatst is bijgewerkt

2. **Geen code zonder tests** — schrijf minstens unit tests voor elke publieke functie

3. **TypeScript strict mode** — geen `any` types, geen `// @ts-ignore`

4. **Elke wijziging documenteren** — update relevante `info_*.md` bestanden na elke feature

5. **Klein en iteratief** — maximaal 1 feature per implementatieronde, test voor je doorgaat

### 🟡 DEVELOPMENT WORKFLOW (VS Code + Claude Code)

**Ontwikkelflow per feature:**
```
1. /implement <feature-naam>     → Claude plant de implementatie
2. Implementeer in kleine stappen → Tests schrijven → Code schrijven → Tests draaien
3. /review                       → Code review door reviewer agent
4. /document                     → Documentatie bijwerken
5. /status                       → Overzicht van wat af is en wat nog moet
```

**Branch strategie:**
- `main` — stabiele code, altijd werkend
- `feat/<naam>` — feature branches, merge na review

**Commit conventie:**
```
feat: add list_modules tool
fix: handle empty domain model gracefully
docs: update info_tools.md with new tool descriptions
refactor: extract serializer logic from tools
test: add unit tests for microflow serializer
```

### 🟢 CODE STIJL & PATRONEN

**Imports**: Gebruik named exports, geen default exports
**Error handling**: Altijd specifieke error types, nooit bare `catch(e)`
**Logging**: Gebruik `console.error` voor errors die de gebruiker moet zien
**Async**: Altijd `async/await`, geen `.then()` chains
**Naming**:
- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

**MCP Tool patroon:**
```typescript
// Elk tool in src/tools/*.ts volgt dit patroon:
export function registerXxxTools(server: McpServer, mendixClient: MendixClient) {
  server.tool(
    "tool_name",
    "Beschrijving die Claude helpt begrijpen WANNEER deze tool te gebruiken",
    { /* zod schema voor parameters */ },
    async (params) => {
      // 1. Valideer input
      // 2. Haal data op via mendixClient
      // 3. Serialiseer naar Claude-friendly formaat
      // 4. Return { content: [{ type: "text", text: result }] }
    }
  );
}
```

**Serializer patroon:**
```typescript
// Elk bestand in src/mendix/serializers/*.ts:
// - Neemt raw SDK objecten
// - Retourneert een beknopte, leesbare string
// - Focust op wat Claude nodig heeft, niet alles
// - Bevat NOOIT SDK internals of implementation details
```

## Agent Instructies

Wanneer je als Claude Code aan dit project werkt:

1. **Lees ALTIJD eerst** de relevante `info_*.md` bestanden voordat je code wijzigt
2. **Gebruik de agents** — delegeer naar de juiste subagent voor gespecialiseerde taken
3. **Controleer de tests** — draai `npm test` na elke wijziging
4. **Update documentatie** — als je code wijzigt, update de bijbehorende `info_*.md`
5. **Raadpleeg DECISIONS.md** — voordat je een architectuurbeslissing neemt, check of er al een beslissing over genomen is
6. **Log nieuwe beslissingen** — voeg belangrijke keuzes toe aan DECISIONS.md met rationale

## Huidige Status

<!-- Dit wordt automatisch bijgewerkt door /status -->
**Fase**: MVP compleet (Prompt 1 t/m 8 geimplementeerd)
**Volgende stap**: Stabilisatie, handmatige validatie op echte apps, en distributie (optionele Prompt 9)
**Blokkeerders**: Geen

## Permissions

Claude Code heeft volledige toestemming voor:
- Lezen en schrijven van alle bestanden in dit project
- Uitvoeren van npm/npx commando's
- Uitvoeren van TypeScript/Node.js code
- Git operaties (commit, branch, merge)
- Installeren van npm packages
- Aanmaken en verwijderen van bestanden en folders
- Uitvoeren van tests

Claude Code hoeft NIET te vragen om toestemming voor bovenstaande acties in dit project.
