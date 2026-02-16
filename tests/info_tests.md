# info_tests

> Laatst bijgewerkt: 2026-02-16

## Doel
Alle tests voor Mendix Copilot.

## Structuur
| Folder | Doel | Status |
|--------|------|--------|
| unit/ | Snelle geisoleerde tests met mocks | Geimplementeerd |
| integration/ | Tests met echte SDK calls | Gepland |
| mocks/ | Gedeelde mock builders | Geimplementeerd |

## Unit test bestanden
| Bestand | Doel |
|---------|------|
| unit/config/config.test.ts | Env/CLI config parsing |
| unit/mendix/cache.test.ts | Cache gedrag en TTL |
| unit/mendix/client.test.ts | Basisgedrag MendixClient connect/app info |
| unit/serializers/domain-model.test.ts | Domain model serializer output |
| unit/serializers/microflow.test.ts | Microflow serializer output |
| unit/serializers/page.test.ts | Page serializer output |
| unit/serializers/security.test.ts | Security serializer output |
| unit/tools/navigation.test.ts | `get_app_info`, `list_modules`, `search_model` |
| unit/tools/domain-model.test.ts | Domain model tool registratie en caching |
| unit/tools/logic.test.ts | Logic tool registratie/output |
| unit/tools/pages.test.ts | Page tools registratie/output |
| unit/tools/security.test.ts | Security tools registratie/output |
| unit/tools/analysis.test.ts | Analyse tools registratie/output |
| unit/resources/app-overview.test.ts | Resource registratie en content |
| unit/prompts/prompts.test.ts | Prompt registratie en instructietekst |
| unit/web-api/schemas.test.ts | Zod schema validatie voor API input |
| unit/web-api/handlers.test.ts | API route helper gedrag met mocks |

## Mock bestanden
| Bestand | Doel |
|---------|------|
| mocks/mendix-model.ts | Builders voor microflow/page/security/analyse testdata |

## Handmatige tests
- `tests/MANUAL-TEST.md`: end-to-end checklist voor MCP flow.
- `tests/MANUAL-WEB-UI.md`: end-to-end checklist voor localhost web UI + API flow.

## Framework
Vitest (`vitest.config.ts`).

## Commandos
- `npm test`
- `npm run test:ci`
- `npm run typecheck`
- `npm run typecheck:web`
- `npm run build`
