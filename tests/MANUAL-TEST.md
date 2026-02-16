# Manual End-to-End Test

> Laatst bijgewerkt: 2026-02-16

## Doel
Valideren dat de Mendix Copilot MCP server met een echte Mendix app werkt in een MCP client.

## Voorwaarden

- Geldige `MENDIX_TOKEN`
- Geldige `MENDIX_APP_ID`
- Toegang tot branch (bijv. `main`)
- Gebouwde server (`npm run build`)

## Test Flow

1. Start de server met echte app:

```bash
node dist/index.js --app-id "<APP_ID>" --branch "main"
```

Verwacht in stderr:
- `Mendix Copilot v0.1.0`
- `Verbinden met app: ...`
- `Model geladen: ...`
- `MCP server gestart - klaar voor Claude`

2. Verbind via MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js --app-id "<APP_ID>" --branch "main"
```

3. Test alle tools minimaal 1 keer:

- `get_app_info`
- `list_modules`
- `search_model`
- `get_domain_model`
- `get_entity_details`
- `get_associations`
- `list_microflows`
- `get_microflow_details`
- `list_nanoflows`
- `list_pages`
- `get_page_structure`
- `get_security_overview`
- `get_entity_access`
- `check_best_practices`
- `get_dependencies`

4. Test resource en prompts:

- Resource read: `mendix://app/overview`
- Prompt: `review-module`
- Prompt: `explain-microflow`
- Prompt: `security-audit`

## Resultaten (laatste run)

- Status: Niet uitgevoerd in deze sessie (geen live appverbinding in testomgeving).
- Lokale automatische checks: `npm run test:ci`, `npm run typecheck`, `npm run build` zijn geslaagd.

## Opmerkingen

- Op grote apps kan startup > 10s duren. Verhoog dan `startup_timeout_sec`.
- Dependency en best-practice checks gebruiken heuristieken; resultaten handmatig valideren.
