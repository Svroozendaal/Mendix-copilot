# studio-pro-extension/src/ui

Laatst bijgewerkt: 2026-02-16

## Doel

UI entrypoint(s) voor Studio Pro host-vensters.

## Inhoud

- `dockablepane.ts`:
  - zoekt actieve localhost web-ui poort
  - toont fallback als de UI niet draait
  - embedt web-ui in iframe met `?embedded=1`
  - forwardt `WB_CONTEXT`/`WB_EMBEDDED` berichten naar `window.postMessage`
