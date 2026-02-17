# Mendix Copilot - Project Intelligence

> Masterinstructies voor dit project.

## Projectdoel

Mendix Copilot levert AI-ondersteuning op Mendix modelcontext via een gedeelde Node/TypeScript core.

## Hosts (actuele scope)

1. MCP server (`src/index.ts`)
2. Localhost API + Web UI (`src/web/api`, `web-ui`)
3. Studio Pro 11 web extension (`studio-pro-extension`) met dockable pane
4. Studio Pro 10 C# extension shell (`studio-pro-extension-csharp`) met dockable pane

## Studio Pro scope (belangrijk)

- Huidige Studio Pro integratie is **niveau B**: embedded localhost web UI in een dockable pane.
- De extension is een **thin shell**:
  - hostt de web UI
  - geeft context door (best effort)
  - bevat geen planner/executor duplicatie
- Execution blijft via bestaande Node/TS backend endpoints:
  - `POST /api/plan`
  - `POST /api/plan/validate`
  - `POST /api/plan/execute`
  - SSE events voor execution
- **Niet in scope**: niveau C live model editing rechtstreeks vanuit de extension UI.

## Security-afspraken

- Secrets/tokens alleen server-side (`.env` voor Node process).
- Nooit secrets in frontend of Studio Pro extension opnemen.
- Geen tokens in logs, screenshots of docs committen.

## Kernstructuur

```text
mendix-copilot/
|- src/                        # core + mcp + localhost api
|- web-ui/                     # React UI (gebruikt localhost api)
|- shared/                     # Gedeelde host-contracten (WB_CONTEXT, etc.)
|- studio-pro-extension/       # WellBased Copilot Panel voor Studio Pro 11
|- studio-pro-extension-csharp/ # WellBased Copilot Panel voor Studio Pro 10
|- docs/                       # architectuur, beslissingen, workflows
|- tests/                      # unit/manual tests
```

## Development regels

1. TypeScript strict houden; geen `any` of `ts-ignore` zonder zwaarwegende reden.
2. Wijzigingen aan publieke gedragspaden altijd afdekken met tests of motiveerbaar testgat.
3. Relevante `info_*.md` en docs bijwerken bij functionele wijzigingen.
4. Kleine, iteratieve changes; eerst build/typecheck/test lokaal groen.
5. Geen destructive git acties op bestaande user-wijzigingen.

## Documentatiechecklist bij wijzigingen

- Update relevante `info_*.md` bestanden.
- Leg belangrijke architectuurkeuzes vast in `docs/DECISIONS.md`.
- Houd `docs/STUDIO_PRO_INTEGRATION.md` synchroon met gerealiseerde extensionstatus.
- Volg `docs/DOCUMENTATION_STANDARD.md` voor format en kwaliteitsregels.

## Huidige status (2026-02-16)

- MCP + localhost web UI + API zijn operationeel.
- Studio Pro 11 en Studio Pro 10 panels draaien als niveau B thin shell.
- Volgende focus: stabilisatie van contextkwaliteit en packaging/installatieflow.
