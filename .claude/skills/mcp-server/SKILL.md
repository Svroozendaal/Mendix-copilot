---
name: mcp-server
description: Kennis en workflow voor bouwen en onderhouden van MCP-serverfunctionaliteit in dit project. Gebruik bij toevoegen/wijzigen van tools, resources of prompts, en bij debugging van MCP-protocolgedrag.
---

# MCP Server Skill

## Doel

Werk veilig en consistent aan de MCP host in `src/index.ts`, inclusief tool/resource/prompt-registratie en foutafhandeling.

## Taken

1. Inventariseer de gevraagde MCP-wijziging:
   - tool,
   - resource,
   - prompt,
   - protocol/debug.
2. Pas code aan in de juiste map (`src/tools`, `src/resources`, `src/prompts`, `src/index.ts`).
3. Controleer Zod schemas en tool-beschrijvingen op duidelijkheid voor modelgebruik.
4. Voeg/actualiseer unit tests in `tests/unit/*`.
5. Werk relevante `info_*.md` en `docs/DECISIONS.md` bij als de wijziging architectuurimpact heeft.
6. Valideer met `npm run typecheck` en `npm run test:ci`.

## Patronen

### Tool registreren

```typescript
import { z } from "zod";

server.tool(
  "tool_name",
  "Korte beschrijving wanneer deze tool gebruikt moet worden",
  {
    module: z.string().describe("Module naam"),
  },
  async ({ module }) => {
    return { content: [{ type: "text", text: `Resultaat voor ${module}` }] };
  }
);
```

### Resource registreren

```typescript
server.resource("app-overview", "mendix://app/overview", async (uri) => ({
  contents: [{ uri: uri.href, mimeType: "text/plain", text: "..." }],
}));
```

### Prompt registreren

```typescript
server.prompt(
  "review-module",
  "Review een module",
  [{ name: "module", description: "Module naam", required: true }],
  async ({ module }) => ({
    messages: [{ role: "user", content: { type: "text", text: `Review ${module}` } }],
  })
);
```

## Kwaliteitsregels

- Gebruik `snake_case` voor toolnamen.
- Houd output compact en bruikbaar voor LLM-context.
- Geef fouten terug als bruikbare content, niet als onduidelijke stacktraces.
