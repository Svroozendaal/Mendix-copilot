# info_api

> Laatst bijgewerkt: 2026-02-16

## Doel
Lokale HTTP API (`copilot-api`) als gedeelde backend voor alle UI-hosts:
- localhost web UI
- Studio Pro 11 panel
- Studio Pro 10 panel

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
- Change planning/execution endpoints:
  - `POST /api/plan`
  - `POST /api/plan/validate`
  - `POST /api/plan/execute`
- `POST /api/plan` accepteert optionele context (`selectedType`, `module`, `qualifiedName`) voor betere module-inferentie vanuit embedded Studio Pro context.
- `POST /api/plan/execute` gebruikt `text/event-stream` en stuurt:
  - `command_start`
  - `command_success`
  - `command_failed`
  - `commit_done`
  - `postcheck_results`
  - `final`
  - `error`

## Security
- `MENDIX_TOKEN` wordt alleen server-side gelezen.
- Geen tokens in responses of logs.

## Performance en stabiliteit
- Chat-runner ondersteunt timeouts via:
  - `COPILOT_CHAT_STEP_TIMEOUT_MS`
  - `COPILOT_CHAT_TOTAL_TIMEOUT_MS`
- Bij timeout wordt een `error` event teruggestuurd en wordt de SSE stream afgesloten.

## Approval en execute
- `POST /api/plan/execute` vereist `approvalToken`.
- Als `COPILOT_APPROVAL_TOKEN` is gezet, moet token exact matchen.
- Destructive plannen vereisen extra `confirmText`.
- Execution mode is momenteel `simulated`.
- UI default blijft veilig: plan-only en expliciete approve vereist voor execute.
