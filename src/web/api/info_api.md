# info_api

> Laatst bijgewerkt: 2026-02-16

## Doel
Lokale HTTP API (`copilot-api`) voor de localhost web UI.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| index.ts | API server startup/shutdown | Geimplementeerd |
| app.ts | Express app, routes, SSE chat endpoint, middleware | Geimplementeerd |
| session-manager.ts | MendixClient lifecycle (`connect`, `disconnect`, `status`) | Geimplementeerd |
| chat-runner.ts | Rule-based chat workflow met tool trace events | Geimplementeerd |
| schemas.ts | Zod schema's voor body/query/params | Geimplementeerd |
| handlers.ts | Route-response helpers voor consistente payloads | Geimplementeerd |
| errors.ts | API-fouttypen en foutresponses | Geimplementeerd |
| types.ts | Gedeelde API- en SSE-types | Geimplementeerd |

## Contracten
- Alle inspectie-endpoints leveren `text` + `meta`.
- `POST /api/chat` gebruikt `text/event-stream` en stuurt:
  - `tool_call`
  - `tool_result`
  - `final`
  - `error` (bij uitzonderingen)

## Security
- `MENDIX_TOKEN` wordt alleen server-side gelezen.
- Geen tokens in responses of logs.

## Performance en stabiliteit
- Chat-runner ondersteunt timeouts via:
  - `COPILOT_CHAT_STEP_TIMEOUT_MS`
  - `COPILOT_CHAT_TOTAL_TIMEOUT_MS`
- Bij timeout wordt een `error` event teruggestuurd en wordt de SSE stream afgesloten.
