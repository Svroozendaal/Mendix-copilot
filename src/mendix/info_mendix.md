# info_mendix

> Laatst bijgewerkt: 2026-02-16

## Doel
Mendix SDK integratie laag. Beheert verbinding, working copy, modelextractie, caching en analyse-data.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| client.ts | Mendix SDK facade met connect/disconnect, modelextractie en analysemethodes | Geimplementeerd |
| cache.ts | In-memory cache voor model data met TTL | Geimplementeerd |

## Subfolders
| Folder | Doel |
|--------|------|
| serializers/ | Vertaling van modeldata naar leesbare tekst voor tools/resources |

## Belangrijkste client methodes

### Navigatie
- `getAppInfo()`
- `listModules(filter?)`
- `searchModel(query, scope?)`

### Domain model
- `getDomainModel(moduleName)`
- `getEntityDetails(qualifiedName)`
- `getAllEntities()`

### Logic
- `listMicroflows(moduleName, filter?)`
- `getMicroflowDetails(qualifiedName)`
- `listNanoflows(moduleName, filter?)`

### Pages
- `listPages(moduleName, filter?)`
- `getPageStructure(qualifiedName)`

### Security
- `getSecurityOverview(moduleName?)`
- `getEntityAccess(qualifiedName)`

### Analyse
- `getBestPracticeFindings(moduleName?)`
- `getDependencies(qualifiedName)`

### Stats
- `getModelStats()`

## Hoe het werkt
- `connect()` maakt een tijdelijke working copy en opent het model.
- Lazy loading (`.load()`) wordt op veel objecten toegepast voor veilige property toegang.
- Methoden gebruiken defensieve readers (`readString`, `readUnknownArray`, etc.) om SDK-variaties op te vangen.
- Property access is guarded tegen Mendix SDK deprecated/removed properties die runtime exceptions kunnen geven.
- Microflow metadata ondersteunt zowel legacy `returnType` als nieuwere `microflowReturnType`.

## Bekende beperkingen
- Working copy aanmaken duurt vaak 30-60 seconden.
- App naam is niet direct beschikbaar; `appId` wordt gebruikt als fallback.
- Microflow, page en dependency extractie zijn deels heuristisch.
- Security-mapping (user role -> entity rechten) hangt af van beschikbare SDK metadata.
