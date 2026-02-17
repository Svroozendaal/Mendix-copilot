# info_api

> Laatst bijgewerkt: 2026-02-17

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
| chat-runner.ts | Codex-style chat agent met iteratieve tool-calls, preloaded app/module knowledge cache en bronnen | Geimplementeerd |
| llm-client.ts | OpenAI-compatibele LLM client inclusief function/tool-calling | Geimplementeerd |
| schemas.ts | Zod schema's voor body/query/params | Geimplementeerd |
| handlers.ts | Route-response helpers voor consistente payloads | Geimplementeerd |
| errors.ts | API-fouttypen en foutresponses | Geimplementeerd |
| types.ts | Gedeelde API- en SSE-types | Geimplementeerd |

## Contracten
- Alle inspectie-endpoints leveren `text` + `meta`.
- `POST /api/chat` gebruikt `text/event-stream` en accepteert:
  - `messages[]` (chat history, user/assistant)
  - of legacy `message`
  - optionele context (`selectedType`, `module`, `qualifiedName`)
- `POST /api/chat` stuurt events:
  - `assistant_token`
  - `tool_call`
  - `tool_result`
  - `final` (`answer`, `sources[]`, optioneel `suggestedPlanPrompt`)
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
- Chat-agent preloadt app-overview en (indien relevant) module snapshots voordat de tool-loop start.
- Chat-agent voert meerdere tool-rondes uit (iteratief) tot er een antwoord is of budget/timeouts zijn bereikt.
- Als `OPENAI_API_KEY` niet is gezet, gebruikt chat-runner een grounded fallback antwoord.
- Optionele LLM-config:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (default: `gpt-4.1-mini`)
  - `OPENAI_BASE_URL`
  - `OPENAI_TIMEOUT_MS`
  - `COPILOT_CHAT_APP_CACHE_TTL_MS`
  - `COPILOT_CHAT_MODULE_CACHE_TTL_MS`
  - `COPILOT_CHAT_MAX_TOOL_ROUNDS`
  - `COPILOT_CHAT_MAX_TOOL_CALLS`

## Approval en execute
- `POST /api/plan/execute` vereist `approvalToken`.
- Als `COPILOT_APPROVAL_TOKEN` is gezet, moet token exact matchen.
- Destructive plannen vereisen extra `confirmText`.
- Execution mode is momenteel `simulated`.
- UI default blijft veilig: plan-only en expliciete approve vereist voor execute.
