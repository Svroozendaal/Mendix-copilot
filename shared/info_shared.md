# info_shared

> Laatst bijgewerkt: 2026-02-16

## Doel

Gedeelde host-contracten en helpers die door meerdere UI-shells worden gebruikt.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| studio-context.ts | Gedeeld `WB_CONTEXT`/`WB_CONTEXT_REQUEST`/`WB_EMBEDDED` contract + normalisatiehelpers | Geimplementeerd |

## Hoe het werkt

- Definieert 1 bron voor bridge message types.
- Definieert context payload schema (`selectedType`, `qualifiedName`, `module`).
- Levert normalisatie/type guards zodat hosts consistent met context omgaan.

## Afhankelijkheden

Gebruikt door:

- `web-ui/src/App.tsx`
- `studio-pro-extension/src/shared/context.ts`
- `studio-pro-extension-csharp/*` (zelfde string-contracten)

## Bekende beperkingen

- C# kan TypeScript types niet direct importeren; contractconsistentie wordt via gelijke constants bewaakt.
