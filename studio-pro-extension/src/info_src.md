# studio-pro-extension/src

Laatst bijgewerkt: 2026-02-16

## Doel

Broncode voor de Studio Pro web extension.

## Structuur

- `main/`
  - `index.ts`: lifecycle entrypoint dat pane en menu registreert, en context events uit Studio Pro pusht.
- `ui/`
  - `dockablepane.ts`: UI entrypoint dat de localhost Copilot UI embedt in een iframe.
- `shared/`
  - `context.ts`: re-export naar `../../../shared/studio-context.ts` voor gedeeld berichtcontract en normalisatie.

## Belangrijke afspraken

- Geen tokens/secrets in extension code.
- Context bridge is best effort: als Studio Pro context niet levert, valt payload terug op `selectedType: null`.
- Embedded UI wordt gedetecteerd via `?embedded=1` plus handshake/event messaging.
- Deze map is de Studio Pro 11 variant; Studio Pro 10 gebruikt `studio-pro-extension-csharp/`.
