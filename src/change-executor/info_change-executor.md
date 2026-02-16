# info_change-executor

> Laatst bijgewerkt: 2026-02-16

## Doel
Validation + preview + execution laag voor ChangePlan.

## Structuur
| Bestand | Doel |
|---------|------|
| validator.ts | Plan validatie (modules/entities/microflows, conflicten, destructive checks) |
| previewGenerator.ts | Human-readable preview diff en affected artifacts |
| executor.ts | Deterministische command dispatch naar builders |
| builders/entityBuilder.ts | Entity/attribute builder-acties |
| builders/microflowBuilder.ts | Microflow builder-acties |
| builders/crudGenerator.ts | CRUD generatie-acties |

## Belangrijk
- Builders zijn deterministisch en bevatten geen LLM-logica.
- Execution mode is momenteel `simulated` (geen directe Mendix write-operaties in deze MVP-laag).
- Destructive plannen vereisen extra confirmation via API endpoint flow.
