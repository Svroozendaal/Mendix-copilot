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
- plan/validate/execute endpoints voor ChangePlan workflows

### 4. Change Planner (`src/change-planner/`)
Natural language -> ChangePlan DSL (read-only planning, geen writes).

### 5. Change Executor (`src/change-executor/`)
Validatie, preview en deterministische command-dispatch via builders (huidig in simulated mode).

### 6. Tools (`src/tools/`)
MCP tool-registratie voor de MCP host.

### 7. Mendix Client (`src/mendix/client.ts`)
Wrapper rond Mendix Platform SDK + Model SDK. Verzorgt working copy lifecycle en modelextractie.

### 8. Cache (`src/mendix/cache.ts`)
In-memory cache voor tool workflows.

### 9. Serializers (`src/mendix/serializers/`)
Vertalen modeldata naar Claude/Codex-vriendelijke tekstoutput.

### 10. Config (`src/config/`)
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

## Dataflow (planning/execution)

```
POST /api/plan -> intent classifier -> context collector -> ChangePlan DSL
POST /api/plan/validate -> validator + preview generator
POST /api/plan/execute -> approval checks -> executor -> post-check best practices
```

## Beslissingen

Zie `docs/DECISIONS.md`.
