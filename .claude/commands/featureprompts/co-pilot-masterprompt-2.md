MASTERPROMPT 2
Validation + Approval + Execution Engine

Doel:
ChangePlan → Validate → Preview Diff → Execute via Builders → Commit

We breiden Mendix Copilot uit met een veilige Execution Engine.

VOORWAARDE:
ChangePlan DSL bestaat al (masterprompt 1).

Maak nieuwe structuur:

src/change-executor/
  - validator.ts
  - previewGenerator.ts
  - executor.ts
  - builders/
      - entityBuilder.ts
      - microflowBuilder.ts
      - crudGenerator.ts

STAP 1 — Validator

validatePlan(changePlan, appContext)

Controleer:

- Module bestaat
- Entity bestaat (indien referenced)
- Microflow naamconflicten
- Attribute naamconflicten
- Geen writes in system modules
- destructive operations gemarkeerd

Return:
{
  validatedPlan,
  warnings[],
  errors[]
}

Errors blokkeren execution.

STAP 2 — Preview Generator

Genereer human-readable diff:

Output voorbeeld:

Changes to be made:
+ Create entity Orders.Invoice
+ Add attribute TotalAmount (Decimal)
+ Create microflow ACT_Invoice_Create

Destructive:
- Delete microflow ACT_OldLogic

Return structured preview object.

STAP 3 — Builders (belangrijk)

NOOIT LLM direct SDK laten manipuleren.

EntityBuilder:
- createEntity()
- addAttribute()

MicroflowBuilder:
- createMicroflow()
- addStep()
- wireSequenceFlow()
- addDefaultErrorHandler()

CrudGenerator:
- generateCreate()
- generateUpdate()
- generateDelete()
- generateRetrieve()

Builders zijn deterministisch.
Geen randomness.

STAP 4 — Executor

executePlan(validatedPlan):

For each command:
  switch command.type:
    - create_entity → entityBuilder
    - add_attribute → entityBuilder
    - create_microflow → microflowBuilder
    - generate_crud → crudGenerator

Na alle commands:
  await app.flushChanges()
  await app.commitToTeamServer("Copilot: <summary>")

Return:
{
  success: true,
  commitMessage,
  affectedArtifacts
}

STAP 5 — API endpoints

POST /api/plan/validate
POST /api/plan/execute

Execute endpoint:

- vereist planId
- vereist approvalToken

STAP 6 — Approval mechanism

Implementatie:

Wanneer plan destructive = true:
  require confirmText === plan.target

UI moet confirm string sturen.

STAP 7 — Post-check

Na execute:
  run check_best_practices op affected modules
  voeg results toe aan response

Definition of Done:
- Plan kan worden gevalideerd
- Plan kan veilig worden uitgevoerd
- Commit naar Team Server
- Destructive changes vereisen dubbele confirm
