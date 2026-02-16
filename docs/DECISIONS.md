# Architectuurbeslissingen - Mendix Copilot

> Elke significante technische keuze wordt hier gelogd met context en rationale.

---

### 2026-02-16 - TypeScript als taal

**Context**: De MCP SDK en Mendix SDK zijn TypeScript/JavaScript.
**Beslissing**: TypeScript met strict mode.
**Rationale**: Type safety, goede SDK compatibiliteit, een ecosysteem.
**Alternatieven**: Python, Go.

---

### 2026-02-16 - MCP server als integratiepatroon

**Context**: We willen Claude/Codex laten werken op Mendix modelcontext.
**Beslissing**: MCP server die Mendix SDK wrapped.
**Rationale**: Standaard protocol voor AI tooling; werkt in Claude Code/Desktop en Codex.
**Alternatieven**: Eigen REST API, Studio Pro plugin.

---

### 2026-02-16 - Read-only MVP

**Context**: SDK ondersteunt lezen en schrijven.
**Beslissing**: MVP blijft read-only.
**Rationale**: Minder risico, sneller bruikbare waarde.
**Alternatieven**: Direct write support (te risicovol voor MVP).

---

### 2026-02-16 - Vitest als test framework

**Context**: Unit tests moeten snel en TypeScript-vriendelijk zijn.
**Beslissing**: Vitest.
**Rationale**: Snelle startup, eenvoudige mocks, goede TS ondersteuning.
**Alternatieven**: Jest, Mocha.

---

### 2026-02-16 - info_*.md documentatie per folder

**Context**: Documentatie raakt snel verouderd.
**Beslissing**: Per codefolder een `info_*.md` bestand.
**Rationale**: Documentatie dicht bij code en makkelijk bij te werken.
**Alternatieven**: Centrale wiki, alleen JSDoc.

---

### 2026-02-16 - Hybrid config: environment-first met CLI fallback

**Context**: MCP hosts gebruiken vooral env vars, lokale dev gebruikt vaak CLI args.
**Beslissing**: Primair env vars (`MENDIX_TOKEN`, `MENDIX_APP_ID`, `MENDIX_BRANCH`) met `--app-id` en `--branch` fallback.
**Rationale**: Praktisch voor zowel host-integraties als lokale testflows.
**Alternatieven**: Alleen env vars, of alleen CLI.

---

### 2026-02-16 - Verbinden bij startup, lazy loading binnen modelnavigatie

**Context**: Promptflow vraagt expliciete connect/disconnect; SDK objecten zijn lazy.
**Beslissing**: Connectie bij startup, en lazy `.load()` binnen extractie.
**Rationale**: Fail-fast startup en tegelijk gecontroleerde data-loading.
**Alternatieven**: Volledig lazy connect op eerste toolcall.

---

### 2026-02-16 - Error handling via MCP content responses

**Context**: Tool errors moeten bruikbaar zijn voor de LLM client.
**Beslissing**: Tools retourneren `content` met `isError: true` i.p.v. exceptions te laten bubbelen.
**Rationale**: Betere foutcontext voor gebruikers en modellen.
**Alternatieven**: Exceptions laten afhandelen door SDK.

---

### 2026-02-16 - Microflow serialisatie als heuristische stappenlijst

**Context**: Microflows zijn grafen met veel activity-varianten.
**Beslissing**: Heuristische, leesbare stappenlijst met fallback `[Unknown: ...]`.
**Rationale**: Praktisch en robuust voor MVP, zonder complexe grafalgoritmen.
**Alternatieven**: Volledige flow-reconstructie, raw SDK dumps.

---

### 2026-02-16 - Page, security en dependency analyse via defensieve heuristieken

**Context**: SDK metadata voor pages/security/dependencies varieert per modelversie.
**Beslissing**: Defensieve extractie met fallback velden en heuristische analyses.
**Rationale**: Houdt tools bruikbaar zonder hard te falen op ontbrekende metadata.
**Alternatieven**: Strikte subtype-implementaties per SDK model.

---

### 2026-02-16 - MCP prompts als tool-orchestratie instructies

**Context**: We willen herbruikbare review/audit workflows zonder server-side orchestration engine.
**Beslissing**: Prompts leveren expliciete toolvolgorde en rapportage-instructies.
**Rationale**: Eenvoudig, transparant, client-agnostisch.
**Alternatieven**: Samengestelde server-tools met interne orchestratie.

---

### 2026-02-16 - Localhost web UI met Vite + React

**Context**: Voor Optie 1.A is een snelle, simpele localhost UI nodig naast de bestaande MCP server.
**Beslissing**: Frontend als Vite + React app, los van de Node/TS `copilot-api`.
**Rationale**: Lage setup-overhead, snelle feedbackloop in local development, makkelijke scheiding tussen UI en API.
**Alternatieven**: Next.js (meer framework-overhead voor deze fase), custom vanilla UI (minder schaalbaar voor Copilot UX).

---

### 2026-02-16 - ChangePlan-first architectuur met gescheiden planner/executor

**Context**: We willen veilige modelwijzigingen: eerst plannen, valideren en previewen voor uitvoering.
**Beslissing**: Nieuwe lagen `src/change-planner` en `src/change-executor` met een strikt DSL-contract ertussen.
**Rationale**: Beter testbaar, traceerbaar en geschikt voor approval workflows.
**Alternatieven**: Direct NL -> SDK writes (te risicovol en slecht auditeerbaar).

---

### 2026-02-16 - Execution engine voorlopig in simulated mode

**Context**: De bestaande MendixClient laag exposeert nu read-only operaties in deze codebase.
**Beslissing**: Executor dispatcht deterministisch naar builders en levert execution metadata zonder directe SDK write/commit.
**Rationale**: Veilig MVP-pad met valideerbare pipeline en voorbereiding op echte write builders.
**Alternatieven**: Onvolledige directe writes via ad-hoc SDK reflectie (te fragiel en moeilijk te testen).

---
