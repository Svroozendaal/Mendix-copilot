# Architectuur - Mendix Copilot

> Laatst bijgewerkt: 2026-02-16

## Overzicht

Het systeem is opgesplitst in een gedeelde backend en meerdere hosts.

### Gedeelde backend (herbruikbaar)

- `src/core/` - businesslaag bovenop Mendix SDK
- `src/change-planner/` - NL prompt -> ChangePlan DSL
- `src/change-executor/` - validate/preview/execute pipeline
- `src/web/api/` - localhost HTTP/SSE API
- `src/mendix/` - Mendix SDK facade + serializers

### Hosts

1. MCP host (`src/index.ts`)
2. Localhost web UI host (`web-ui/`)
3. Studio Pro 11 panel host (`studio-pro-extension/`)
4. Studio Pro 10 panel host (`studio-pro-extension-csharp/`)

### Gedeeld host-contract

- `shared/studio-context.ts`
  - `WB_CONTEXT`
  - `WB_CONTEXT_REQUEST`
  - `WB_EMBEDDED`
  - payloadnormalisatie voor `selectedType/module/qualifiedName`

## Dataflows

### Localhost web flow

```text
React Web UI -> /api/* -> Core Service -> Mendix SDK
```

### Studio Pro 11 flow

```text
Studio Pro 11 extension (TS)
-> embedded localhost web UI
-> /api/* (Node/TS backend)
```

### Studio Pro 10 flow

```text
Studio Pro 10 extension (C#)
-> interne web wrapper + iframe localhost UI
-> /api/* (Node/TS backend)
```

### Planning/execution flow (voor alle UI hosts gelijk)

```text
POST /api/plan
POST /api/plan/validate
POST /api/plan/execute (SSE)
```

## Studio Pro scope

- Niveau B thin shell in beide Studio Pro varianten.
- Geen planner/executor duplicatie in extensions.
- Geen secrets in extensions.
- Context sync is best effort via `WB_CONTEXT`.

## Directory map

```text
mendix-copilot/
|- src/
|- web-ui/
|- shared/
|- studio-pro-extension/
|- studio-pro-extension-csharp/
|- docs/
|- tests/
```

Detailoverzicht per map en functionaliteit: `docs/PROJECT_OVERVIEW.md`.
