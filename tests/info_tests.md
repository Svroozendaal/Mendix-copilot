# info_tests

> Laatst bijgewerkt: 2026-02-16

## Doel
Alle tests voor het Mendix Copilot project.

## Structuur
| Folder | Doel |
|--------|------|
| unit/ | Snelle, geïsoleerde tests per component (mocks voor SDK) |
| integration/ | Tests met echte SDK calls (vereisen PAT, optioneel) |
| mocks/ | Gedeelde mock data en helpers |

## Framework
Vitest — configuratie in `vitest.config.ts`

## Commando's
- `npm test` — watch mode
- `npm run test:ci` — single run (voor CI/CD)
