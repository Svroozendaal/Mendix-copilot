# info_serializers

> Laatst bijgewerkt: 2026-02-16

## Doel
Vertalen van raw Mendix SDK objecten naar compacte, leesbare tekst voor Claude/Codex en web UI outputpanelen.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| domain-model.ts | Serializers voor module-overzicht, domain model, entity details en associaties | Geimplementeerd |
| microflow.ts | Microflow lijst en stap-voor-stap details | Geimplementeerd |
| page.ts | Pagina-overzicht en hierarchische widgetstructuur met databinding/acties | Geimplementeerd |
| security.ts | Security matrix en entity access details | Geimplementeerd |
| navigation.ts | App-info, modulelijst en zoekresultaten tekstoutput | Geimplementeerd |
| analysis.ts | Best-practice findings en dependencies output | Geimplementeerd |

## Geimplementeerde serializers

### domain-model.ts
- `serializeModuleOverview(module)`
- `serializeDomainModel(domainModel, options?)`
- `serializeEntityDetails(entity)`
- `serializeAssociations(entity, allEntities)`

### microflow.ts
- `serializeMicroflowList(microflows)`
- `serializeMicroflowDetails(microflow)`

### page.ts
- `serializePageList(pages)`
- `serializePageStructure(page)`

### security.ts
- `serializeSecurityOverview(model)`
- `serializeEntityAccess(entityAccess)`

### navigation.ts
- `serializeAppInfo(appInfo)`
- `serializeModuleList(modules, filter?)`
- `serializeSearchResults(query, results)`

### analysis.ts
- `serializeBestPracticeFindings(findings)`
- `serializeDependencies(dependencies)`

## Design principes
1. Beknopt: alleen informatie die analyse ondersteunt.
2. Gestructureerd: consistent tekstformaat per modeltype.
3. Leesbaar: menselijke taal, geen SDK internals.
4. Robuust: onbekende of ontbrekende metadata leidt tot fallback output, niet tot crashes.
