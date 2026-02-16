🖥 MASTERPROMPT 3
Web UI Integration: Approval Flow + Command Console

Doel:
De localhost UI uitbreiden met:

Plan preview scherm

Approval UI

Execution progress

Command trace

We breiden de web UI uit met een volledige Plan → Approve → Execute flow.

VOORWAARDE:
API endpoints:
- /api/plan
- /api/plan/validate
- /api/plan/execute

STAP 1 — UI Flow

Chat tab:

User message →
  call /api/plan →
  show Preview Panel →
    - Summary
    - Affected artifacts
    - Risk indicator (color-coded)
    - Destructive badge

Buttons:
  [Approve]
  [Reject]
  [Edit Prompt]

STAP 2 — Destructive Confirm

Als destructive = true:

Toon:
Type the name of the entity/microflow to confirm:

Input veld verplicht.
Pas dan enable Approve.

STAP 3 — Execution Progress Panel

Na approve:

Toon live events via SSE:

Events:
- command_start
- command_success
- command_failed
- commit_done
- postcheck_results

UI moet tonen:
✔ Created microflow ACT_Order_Create
✔ Added attribute Status
⚠ Warning: Missing validation rule

STAP 4 — Command Trace Tab

Extra tab:
"Execution Log"

Toon:
- Exacte commands uitgevoerd
- Commit message
- Timestamp

STAP 5 — Safe UX defaults

- Default mode = Plan only
- No auto-execute
- Max 1 active plan tegelijk

STAP 6 — Studio Pro readiness

Voeg in docs/STUDIO_PRO_INTEGRATION.md toe:

- Deze flow kan 1-op-1 worden gebruikt in een Studio Pro panel
- Alleen de execution backend verandert

Definition of Done:

- NL prompt → plan preview zichtbaar
- Approval werkt
- Execution streaming werkt
- Commit zichtbaar in UI
- Post-check zichtbaar