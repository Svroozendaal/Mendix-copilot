# info_src (web-ui)

> Laatst bijgewerkt: 2026-02-17

## Doel
Frontend React code voor de localhost Copilot UI.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| main.tsx | React bootstrap + stylesheet import | Geimplementeerd |
| App.tsx | Hoofdscherm met connect panel, explorer, quick actions en conversation-first assistant + optionele plan execute flow | Geimplementeerd |
| api-client.ts | HTTP + SSE client voor `copilot-api` | Geimplementeerd |
| styles.css | UI layout en styling | Geimplementeerd |

## Belangrijke UX onderdelen
- Connect/disconnect + status
- Explorer met module/entity/microflow/page drilldown
- Conversation thread (GPT-stijl) met grounded assistant antwoorden op basis van app-model data
- Van chat naar execute: aparte plan prompt sectie om pas na gesprek een executable plan te genereren
- Plan preview, approve/reject, destructive confirm en execution streaming
- Execution Log tab met command trace, commit message en timestamps
- Assistant Trace tab met tool_call/tool_result events uit chat
- Quick actions met samengestelde workflows
- Studio Pro embedded mode badge (`Running inside Studio Pro`) via `?embedded=1` of handshake
- Context bridge listener (`window.postMessage`) met `WB_CONTEXT` payload voor sidebar-highlight en plan-context defaults
- Contextcontract wordt gedeeld via `../../shared/studio-context.ts` zodat standalone en beide Studio Pro hosts hetzelfde schema gebruiken
