# info_serializers

> Laatst bijgewerkt: 2026-02-16

## Doel
Vertalen van raw Mendix SDK model objecten naar beknopte, leesbare tekst die Claude kan gebruiken. Dit is een kritieke laag: te technische output kost context en maakt analyse minder bruikbaar.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| domain-model.ts | Serializers voor module-overzicht, domain model, entity details en associaties | Geimplementeerd |
| microflow.ts | Microflow stappen/logica naar tekst | Gepland |
| page.ts | Pagina structuur/widgets naar tekst | Gepland |
| security.ts | Security matrix naar tekst | Gepland |

## Geimplementeerde serializers in domain-model.ts
- `serializeModuleOverview(module)`
- `serializeDomainModel(domainModel, options?)`
- `serializeEntityDetails(entity)`
- `serializeAssociations(entity, allEntities)`

## Design Principes
1. Beknopt: alleen wat Claude nodig heeft.
2. Gestructureerd: consistent formaat per type.
3. Leesbaar: menselijke taal, geen SDK internals.
4. Geen IDs: gebruik namen of qualified names.