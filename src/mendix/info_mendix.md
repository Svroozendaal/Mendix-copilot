# info_mendix

> Laatst bijgewerkt: 2026-02-16

## Doel
Mendix SDK integratie laag. Beheert de verbinding met het Mendix platform, working copies, caching, en data serialisatie.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| client.ts | Mendix SDK client wrapper — working copy management, model access | 📋 Gepland |
| cache.ts | In-memory cache voor model data | 📋 Gepland |

## Subfolders
| Folder | Doel |
|--------|------|
| serializers/ | Vertalen SDK model objecten → leesbare tekst voor Claude |

## Hoe het werkt
`client.ts` is de centrale toegangspoort tot het Mendix model. Het maakt een working copy aan bij start, opent het model, en biedt methodes om specifieke onderdelen op te vragen. `cache.ts` voorkomt herhaalde SDK calls.

## Bekende beperkingen
- Working copy aanmaken duurt 30-60 seconden
- System module is niet toegankelijk via de SDK
- Lazy loading: properties pas beschikbaar na `.load()` call
