---
name: mendix-sdk
description: Knowledge about the Mendix Platform SDK and Model SDK. Use when working with Mendix SDK calls, understanding the metamodel, working with working copies, or serializing model data.
---

# Mendix SDK — Patronen & Kennis

## SDK Overzicht

Er zijn twee SDKs die samenwerken:

- **Platform SDK** (`mendixplatformsdk`): Beheert apps, working copies, commits
- **Model SDK** (`mendixmodelsdk`): Leest en schrijft het app model (entities, microflows, pages, etc.)

## Authenticatie

```typescript
import { MendixPlatformClient } from "mendixplatformsdk";

// PAT via environment variable (NOOIT hardcoded)
const client = new MendixPlatformClient();
// SDK leest automatisch MENDIX_TOKEN uit env
```

**Vereiste PAT scopes**: `mx:modelrepository:repo:read`, `mx:modelrepository:repo:write`

## Working Copy Management

```typescript
// App ophalen
const app = client.getApp("app-id-hier");

// Working copy aanmaken (DUURT 30-60 SECONDEN)
const workingCopy = await app.createTemporaryWorkingCopy("main"); // branch naam

// Model openen
const model = await workingCopy.openModel();

// BELANGRIJK: Working copy is tijdelijk en wordt automatisch opgeruimd
// BELANGRIJK: Wijzigingen worden NIET automatisch gecommit
```

## Model Navigatie

```typescript
// Alle modules
const modules = model.allModules();

// Domain model van een module
const domainModel = modules[0].domainModel;

// LAZY LOADING — properties zijn pas beschikbaar na load()
const entity = domainModel.entities[0];
const loadedEntity = await entity.load(); // NU zijn alle properties beschikbaar

// Alle microflows
const allMicroflows = model.allMicroflows();

// Specifiek document ophalen
const microflow = allMicroflows.filter(mf => mf.qualifiedName === "MyModule.MF_DoSomething")[0];
const loadedMf = await microflow.load();
```

## KRITIEKE PITFALLS

1. **Lazy Loading**: Veel properties zijn pas beschikbaar na `.load()`. Zonder load krijg je `undefined` of fouten.
2. **System Module**: De SDK kan het System module NIET lezen. Generalisaties naar System.User etc. moeten via workarounds.
3. **Qualified Names**: Gebruik altijd `qualifiedName` (Module.DocumentNaam) voor unieke identificatie.
4. **Rate Limits**: Niet te veel working copies tegelijk aanmaken.
5. **Model Size**: Grote apps hebben duizenden documenten. Laad NOOIT alles tegelijk.

## Veelgebruikte Imports

```typescript
import { MendixPlatformClient } from "mendixplatformsdk";
import {
  domainmodels,
  microflows,
  pages,
  security,
  navigation,
  enumerations,
  texts,
  projects
} from "mendixmodelsdk";
```

## Serialisatie Tips

Wanneer je SDK objecten omzet naar tekst voor Claude:
- Gebruik **gestructureerde samenvatting**, niet raw JSON dumps
- Focus op **namen, types en relaties** — niet op interne IDs
- **Microflows**: beschrijf als stappen/activiteiten, niet als object graph
- **Entities**: toon attributen met type, associaties met kardinaliteit
- **Security**: toon als matrix (role → entity → access)
