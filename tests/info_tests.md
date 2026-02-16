# info_tests

> Laatst bijgewerkt: 2026-02-16

## Doel
Alle tests voor het Mendix Copilot project.

## Structuur
| Folder | Doel | Status |
|--------|------|--------|
| unit/ | Snelle, geisoleerde tests per component (met mocks) | Geimplementeerd |
| integration/ | Tests met echte SDK calls (vereisen PAT) | Gepland |
| mocks/ | Gedeelde mock data en test helpers | In ontwikkeling |

## Unit test bestanden
| Bestand | Doel |
|---------|------|
| unit/config/config.test.ts | Validatie van env/CLI config parsing en prioriteitsregels |
| unit/mendix/cache.test.ts | Cache operaties inclusief TTL expiry |
| unit/mendix/client.test.ts | Basisgedrag van MendixClient connectie en app-info mapping |
| unit/tools/navigation.test.ts | Registratie en output van `get_app_info` en `list_modules` |
| unit/tools/domain-model.test.ts | Registratie, caching en foutafhandeling van domain-model tools |
| unit/serializers/domain-model.test.ts | Output voor module/domain/entity/associatie serializers |

## Mock bestanden
| Bestand | Doel |
|---------|------|
| mocks/mendix-model.ts | Placeholder voor toekomstige gedeelde Mendix model factories |

## Framework
Vitest - configuratie in `vitest.config.ts`.

## Commandos
- `npm test` - watch mode
- `npm run test:ci` - single run (CI)