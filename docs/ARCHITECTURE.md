# Architectuur - Mendix Copilot

> Laatst bijgewerkt: 2026-02-16

## Systeemoverzicht

Er zijn nu twee hosts op dezelfde core:

1. MCP flow

```
Claude/Codex <-> MCP Protocol <-> MCP Server (src/index.ts) <-> Mendix SDK
```

2. Localhost web flow

```
React Web UI <-> copilot-api (src/web/api) <-> Core Service (src/core) <-> Mendix SDK
```

## Lagen

### 1. MCP Server (`src/index.ts`)
Entry point voor MCP tooling. Registreert tools, resources en prompts en draait op stdio transport.

### 2. Core Service (`src/core/`)
Gedeelde applicatielaag bovenop `MendixClient` + serializers.
Levert consistente `text + meta` resultaten voor API-hosts.

### 3. API Server (`src/web/api/`)
Lokale HTTP/SSE laag voor de web UI:
- connect/disconnect/status lifecycle
- inspectie-endpoints
- chat-runner met tool trace events

### 4. Tools (`src/tools/`)
MCP tool-registratie voor de MCP host.

### 5. Mendix Client (`src/mendix/client.ts`)
Wrapper rond Mendix Platform SDK + Model SDK. Verzorgt working copy lifecycle en modelextractie.

### 6. Cache (`src/mendix/cache.ts`)
In-memory cache voor tool workflows.

### 7. Serializers (`src/mendix/serializers/`)
Vertalen modeldata naar Claude/Codex-vriendelijke tekstoutput.

### 8. Config (`src/config/`)
Configuratie van token/app/branch.

## Dataflow (web UI)

```
UI actie -> /api/* endpoint -> CopilotCore -> MendixClient -> SDK
                               -> serializer text + meta -> UI rendering
```

## Dataflow (chat)

```
POST /api/chat -> ChatRunner intent -> tool workflow
               -> SSE events: tool_call/tool_result/final
               -> UI toont trace + eindantwoord
```

## Beslissingen

Zie `docs/DECISIONS.md`.
