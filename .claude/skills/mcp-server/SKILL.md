---
name: mcp-server
description: Knowledge about building MCP servers. Use when adding tools, resources, or prompts to the MCP server, or when debugging MCP protocol issues.
---

# MCP Server Development — Patronen & Kennis

## MCP SDK Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "mendix-copilot",
  version: "0.1.0",
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
});
```

## Tools Registreren

```typescript
import { z } from "zod";

server.tool(
  "tool_name",                    // snake_case naam
  "Beschrijving voor Claude",     // Wanneer moet Claude deze tool gebruiken?
  {
    module: z.string().describe("Naam van de Mendix module"),
    detailed: z.boolean().optional().describe("Toon extra details"),
  },
  async ({ module, detailed }) => {
    // Implementatie
    return {
      content: [{ type: "text", text: "Resultaat hier" }],
    };
  }
);
```

## Resources Registreren

```typescript
server.resource(
  "app-overview",                          // resource naam
  "mendix://app/overview",                 // URI template
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/plain",
      text: "App overview content hier",
    }],
  })
);
```

## Prompts Registreren

```typescript
server.prompt(
  "review-module",
  "Review een complete Mendix module",
  [{ name: "module", description: "Module naam", required: true }],
  async ({ module }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Analyseer de module "${module}" volledig...`,
      },
    }],
  })
);
```

## Transport Starten

```typescript
// stdio transport (voor Claude Code)
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Best Practices

1. **Tool descriptions zijn CRUCIAAL** — Claude kiest tools op basis van de description
2. **Zod schemas** — gebruik `.describe()` op elk veld voor Claude
3. **Return format** — altijd `{ content: [{ type: "text", text: ... }] }`
4. **Error handling** — return errors als text content, gooi geen exceptions
5. **Beknopt** — geef Claude alleen de info die het nodig heeft
6. **Naming** — tool namen in `snake_case`, consistent prefix per categorie
