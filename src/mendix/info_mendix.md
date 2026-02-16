# info_mendix

> Laatst bijgewerkt: 2026-02-16

## Doel
Mendix SDK integratie laag. Beheert de verbinding met het Mendix platform, working copies, caching, en data serialisatie.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| client.ts | Mendix SDK client wrapper met connect/getModel/disconnect, module/entity queries en lazy-load helpers | Geimplementeerd |
| cache.ts | In-memory cache voor model data met TTL | Geimplementeerd |

## Subfolders
| Folder | Doel |
|--------|------|
| serializers/ | Vertalen SDK model objecten naar leesbare tekst voor Claude |

## Hoe het werkt
`client.ts` is de centrale toegangspoort tot het Mendix model. De server roept
`connect()` aan bij startup, waarna tools data opvragen via methodes zoals
`getAppInfo()`, `listModules()`, `getDomainModel()`, en `getEntityDetails()`.
De client bevat helpers die `.load()` aanroepen op lazy Mendix SDK objecten
voordat properties gelezen worden.

## SDK Property Opmerkingen
- `IModule.fromAppStore` (boolean) geeft aan of een module uit de Marketplace komt.
- `IModel.allModules()` retourneert alle modules in het project.
- App naam is niet beschikbaar via de model SDK. `MendixClient` gebruikt `appId` als fallback.
- `setPlatformConfig({ mendixToken })` moet worden aangeroepen voordat `MendixPlatformClient` wordt gebruikt.

## AppInfo Interface
```typescript
interface AppInfo {
  name: string;        // Momenteel gelijk aan appId (geen SDK eigenschap voor naam)
  appId: string;
  branch: string;
  mendixVersion: string;
  moduleCount: number;
  modules: Array<{ name: string; fromMarketplace: boolean }>;
}
```

## Bekende beperkingen
- Working copy aanmaken duurt 30-60 seconden.
- System module is niet toegankelijk via de SDK.
- Niet alle SDK-objecten geven uniforme metadata voor owner/delete behavior terug.
- App naam is niet direct beschikbaar, appId wordt gebruikt als fallback.