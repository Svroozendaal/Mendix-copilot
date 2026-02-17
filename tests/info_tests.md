# info_tests

> Laatst bijgewerkt: 2026-02-16

## Doel
Testlaag voor regressiecontrole van backend, planner/executor, MCP-contracten en web API.

## Structuur
| Folder | Doel | Status |
|--------|------|--------|
| unit/ | Snelle geisoleerde tests met mocks | Geimplementeerd |
| mocks/ | Gedeelde mock builders en testdata | Geimplementeerd |
| integration/ | Echte SDK/integratietests | Gepland |

## Subfolder-documentatie
- `tests/mocks/info_mocks.md`
- `tests/unit/change-executor/info_change-executor.md`
- `tests/unit/change-planner/info_change-planner.md`
- `tests/unit/config/info_config.md`
- `tests/unit/mendix/info_mendix.md`
- `tests/unit/prompts/info_prompts.md`
- `tests/unit/resources/info_resources.md`
- `tests/unit/serializers/info_serializers.md`
- `tests/unit/shared/info_shared.md`
- `tests/unit/tools/info_tools.md`
- `tests/unit/web-api/info_web-api.md`

## Handmatige tests
- `tests/MANUAL-TEST.md`
- `tests/MANUAL-WEB-UI.md`

## Commands
- `npm test`
- `npm run test:ci`
- `npm run typecheck`
- `npm run typecheck:web`
