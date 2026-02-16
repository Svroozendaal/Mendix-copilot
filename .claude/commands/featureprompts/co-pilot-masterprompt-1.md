MASTERPROMPT 1
Change Planning Engine (Natural Language → Structured ChangePlan DSL)

Doel:
Alle NL-requests worden eerst omgezet naar een strikt gestructureerd ChangePlan JSON.
Nog GEEN writes.

Plak dit in Claude Code:

We gaan de Mendix Copilot uitbreiden met een Change Planning Engine.

DOEL:
Natural language → gestructureerd ChangePlan (JSON DSL).
GEEN writes uitvoeren. Alleen plannen.

Lees eerst:
- CLAUDE.md
- docs/ARCHITECTURE.md
- docs/WEB_UI.md
- bestaande tool implementaties
- serializers

Architectuur-uitbreiding:

Voeg een nieuwe layer toe:
src/change-planner/

Structuur:
- planner/
    - planFromNaturalLanguage.ts
    - intentClassifier.ts
    - contextCollector.ts
- dsl/
    - changePlan.schema.ts (Zod schema)
    - commandTypes.ts
- prompts/
    - plan.system.prompt.md

STAP 1 — Definieer de ChangePlan DSL

Maak een strikt Zod-schema:

interface ChangePlan {
  planId: string
  createdAt: string
  intent: string
  target: {
    module?: string
    entity?: string
    microflow?: string
  }
  preconditions: string[]
  commands: Command[]
  risk: {
    destructive: boolean
    impactLevel: "low" | "medium" | "high"
    notes: string[]
  }
}

Command union types:
- create_entity
- add_attribute
- create_microflow
- add_microflow_step
- generate_crud
- delete_microflow (flag destructive)
- rename_element (flag destructive)

Belangrijk:
De DSL mag GEEN SDK details bevatten.
Geen object IDs.
Geen coordinates.
Geen low-level references.

Alleen declaratief.

STAP 2 — Intent Classifier

Maak intentClassifier.ts:

- Detecteer intents:
  - "create entity"
  - "add attribute"
  - "generate crud"
  - "create microflow"
  - "modify microflow"
  - "delete"

Gebruik simpele rule-based detection.
Nog geen LLM nodig.

STAP 3 — Context Collector

Planner moet eerst relevante context ophalen via bestaande read tools:

Bijvoorbeeld:
- search_model
- get_entity_details
- get_microflow_details
- list_modules

ContextCollector:
- Roept tools aan
- Bouwt een context object
- Geeft dit aan de planner

STAP 4 — planFromNaturalLanguage()

Flow:

1. Classify intent
2. Collect context
3. Generate ChangePlan JSON
4. Validate against Zod schema
5. Return plan

Nog GEEN execute.

STAP 5 — API endpoint

Voeg toe aan copilot-api:

POST /api/plan
body:
{
  message: string,
  context?: { module?: string }
}

Response:
{
  changePlan,
  preview: {
    summary: string[],
    affectedArtifacts: string[],
    destructive: boolean
  }
}

Preview moet leesbaar zijn.

STAP 6 — Safety defaults

- delete/rename altijd destructive: true
- max 25 commands per plan
- geen changes in marketplace modules

STAP 7 — Tests

Unit tests:
- DSL schema validation
- Intent detection
- Plan generation for:
   - create entity
   - generate crud
   - add attribute

Definition of Done:
- /api/plan werkt
- Geldige ChangePlan JSON
- Preview summary begrijpelijk
- Geen writes uitgevoerd