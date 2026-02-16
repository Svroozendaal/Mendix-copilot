# Architectuur — Mendix Copilot

> Laatst bijgewerkt: 2026-02-16

## Systeemoverzicht

```
Claude Code/Desktop ←→ MCP Protocol ←→ Mendix Copilot Server ←→ Mendix Platform SDK ←→ Team Server
```

## Lagen

### 1. MCP Server (src/index.ts)
Entry point. Registreert alle tools, resources en prompts. Beheert de MCP server lifecycle.

### 2. Tools (src/tools/)
Elke file registreert een groep gerelateerde MCP tools. Tools zijn de "knoppen" die Claude kan indrukken.

### 3. Mendix Client (src/mendix/client.ts)
Wrapper rond de Mendix Platform SDK + Model SDK. Beheert working copies, caching en lazy loading.

### 4. Cache (src/mendix/cache.ts)
In-memory cache voor model data. Voorkomt herhaalde SDK calls voor dezelfde data.

### 5. Serializers (src/mendix/serializers/)
Vertalen raw SDK model objecten naar beknopte, leesbare tekst voor Claude. Dit is de KRITIEKE laag — als de output te lang of te technisch is, werkt Claude niet goed.

### 6. Config (src/config/)
Configuratie management: PAT token, app ID, branch, timeouts.

## Data Flow

```
Claude vraagt: "Toon entities in module Orders"
  → MCP Server ontvangt tool call: get_domain_model({ module: "Orders" })
    → Tool delegeert naar MendixClient.getDomainModel("Orders")
      → Client checkt cache → miss → SDK call
        → SDK opent working copy (of hergebruikt gecachete)
          → SDK laadt domain model
      → Client cached resultaat
    → Tool roept serializer aan: serializeDomainModel(domainModel)
      → Serializer maakt leesbare tekst
    → Tool retourneert: { content: [{ type: "text", text: "..." }] }
  → Claude leest de output en beantwoordt de vraag
```

## Beslissingen

Zie `docs/DECISIONS.md` voor alle architectuurbeslissingen.
