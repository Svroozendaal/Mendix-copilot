# info_change-planner

> Laatst bijgewerkt: 2026-02-16

## Doel
Natural language change planning engine:

- NL verzoek -> intent classificatie
- context ophalen via bestaande read-only core calls
- genereren van strikt gevalideerd ChangePlan DSL JSON

## Structuur
| Pad | Doel |
|-----|------|
| dsl/commandTypes.ts | Command union en command-specifieke Zod schema's |
| dsl/changePlan.schema.ts | Hoofd ChangePlan DSL schema + safety regels |
| planner/intentClassifier.ts | Rule-based intent detectie |
| planner/contextCollector.ts | Context verzameling via CopilotCore |
| planner/planFromNaturalLanguage.ts | End-to-end planning flow en preview output |
| prompts/plan.system.prompt.md | Systeemprompt voor toekomstige LLM-planning |

## Request-context
- Planner accepteert optionele request-context vanuit hosts (bijv. embedded Studio Pro):
  - `selectedType` (`module`, `entity`, `microflow`, `page`)
  - `module`
  - `qualifiedName`
- `qualifiedName` kan gebruikt worden om module-context af te leiden voor betere intent-resolutie.

## Veiligheidsregels
- Maximaal 25 commands per plan.
- Delete/rename altijd destructive.
- Geen marketplace modules als target.
- Planner voert nooit writes uit.
