# info_web-ui

> Laatst bijgewerkt: 2026-02-16

## Doel
Lokale React webapp voor Mendix Copilot (`localhost`), losgekoppeld van Mendix SDK runtime.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| index.html | Vite entry HTML | Geimplementeerd |
| vite.config.ts | Vite config (dev server/build) | Geimplementeerd |
| tsconfig.json | TypeScript config voor browsercode | Geimplementeerd |

## Subfolders
| Folder | Doel |
|--------|------|
| src/ | React UI code (connect panel, explorer, quick actions, plan preview, approval flow, execution log) |

## Security
- Frontend bevat geen Mendix token.
- API base URL via `VITE_API_BASE_URL`.
