# studio-pro-extension/src/main

Laatst bijgewerkt: 2026-02-16

## Doel

Main extension entrypoint voor Studio Pro 11 lifecycle.

## Inhoud

- `index.ts`:
  - registreert dockable pane
  - registreert Extensions menu acties (open/close panel)
  - pusht active-document context via `WB_CONTEXT`
  - beantwoordt `WB_CONTEXT_REQUEST` berichten vanuit UI entrypoint
