# Web UI

> Laatst bijgewerkt: 2026-02-16

## Doel

`web-ui/` is de primaire Copilot frontend, bruikbaar op localhost en embedded in Studio Pro panels.

## Runtime modes

1. Standalone localhost (`http://127.0.0.1:5173`)
2. Embedded in Studio Pro 11 panel
3. Embedded in Studio Pro 10 panel wrapper

## Contracten

- API contract: `src/web/api`
- Context bridge contract: `shared/studio-context.ts`
  - `WB_CONTEXT`
  - `WB_CONTEXT_REQUEST`
  - `WB_EMBEDDED`

## Embedded gedrag

- Detectie via `?embedded=1` en handshake message
- Badge in UI: `Running inside Studio Pro`
- `WB_CONTEXT` beïnvloedt:
  - geselecteerde explorer context
  - default context voor `POST /api/plan`

## Scope

- UI bevat geen secrets
- planner/executor blijven backend-side
