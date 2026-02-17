---
description: Voer P3 uit voor Mendix-GPT: veilige transitie van simulated execution naar echte write-operaties met guardrails.
argument-hint: <optioneel: feature-flag | guardrails | rollback | e2e-write-tests>
---

## P3 Prompt - Write Agent (Guarded)

Focus: `$ARGUMENTS`

Als `$ARGUMENTS` leeg is, implementeer de volledige P3-scope, maar alleen achter expliciete feature flags.

## Doel

Maak gecontroleerde, auditeerbare write-operaties mogelijk vanuit ChangePlan execution, zonder de veiligheidsgrenzen van het systeem te verliezen.

## Context (verplicht lezen)

1. `src/change-planner/dsl/*`
2. `src/change-planner/planner/*`
3. `src/change-executor/executor.ts`
4. `src/change-executor/builders/*`
5. `src/web/api/app.ts`
6. `src/web/api/info_api.md`
7. `src/change-executor/info_change-executor.md`
8. `docs/DECISIONS.md`

## Scope

### 1) Feature-flagged write pad

- Introduceer expliciete feature flag(s) voor write-enabled execution.
- Default blijft veilig: simulated/read-only.
- Zorg dat write mode alleen met expliciete configuratie actief wordt.

### 2) Guardrails en approvals

- Strengere validatie voor destructive of brede impact plannen.
- Verplicht heldere approval flow met context, actor en bevestiging.
- Blokkeer writes op ongewenste targets (bijvoorbeeld marketplace modules).

### 3) Transactiegedrag en rollbackstrategie

- Definieer commitmomenten en foutafhandeling bij halverwege falen.
- Leg rollback/compensatie-aanpak vast (technisch en operationeel).
- Zorg dat mislukte executes duidelijk traceerbaar blijven.

### 4) Auditability

- Log wie, wat, wanneer, op welke app/branch is uitgevoerd.
- Maak post-execution rapporten met affected artifacts en uitkomststatus.
- Bescherm logs tegen het lekken van geheimen.

### 5) Teststrategie voor writes

- Unit tests op validator/guardrails.
- Integratietests op execute flow.
- E2E tests op gecontroleerde testapp of sandbox.

## Non-goals

- Geen brede feature-uitbreiding buiten execute-veiligheid.
- Geen bypass van approval flow voor gemak.
- Geen "silent auto-fix" writes zonder expliciete gebruikersintentie.

## Implementatieregels

1. Veilige default state behouden (simulated).
2. Elke write-route moet een expliciete safety check hebben.
3. Elke write-route moet audit-events genereren.
4. Documenteer exact wanneer write mode gebruikt mag worden.

## Acceptance criteria

1. Write mode staat standaard uit en is alleen expliciet activeerbaar.
2. Destructive writes vereisen extra bevestiging en slagen alleen met correcte flow.
3. Execute-resultaat bevat duidelijk write vs simulated metadata.
4. Falen in write path laat systeem in consistente toestand achter.
5. E2E tests dekken minimaal een positief en een negatief write scenario.

## Output format

1. **Write capability toegevoegd**
2. **Guardrails en approvals**
3. **Audit en rollback aanpak**
4. **Testresultaten**
5. **Operationele instructies voor gebruik**

