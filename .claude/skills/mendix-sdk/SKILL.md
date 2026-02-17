---
name: mendix-sdk
description: Praktische kennis voor Mendix Platform SDK en Model SDK gebruik in dit project. Gebruik bij modeltoegang, working copy lifecycle, serialisatie en SDK-gerelateerde bugfixes.
---

# Mendix SDK Skill

## Doel

Consistente en veilige omgang met Mendix SDK-operaties in `src/mendix/` en alle aanroepende lagen.

## Taken

1. Bevestig welke SDK-laag geraakt wordt:
   - platform/working copy lifecycle,
   - modelnavigatie,
   - serialisatie.
2. Controleer lazy loading en null-safety op alle modelobjecten.
3. Verifieer dat PAT/token alleen via env loopt en nergens in logs/documentatie terechtkomt.
4. Werk serializer/core-output bij zodat responses compact en stabiel blijven.
5. Voeg of update tests in `tests/unit/mendix` en/of `tests/unit/serializers`.
6. Werk `info_*.md` bij in `src/mendix` en relevante bovenliggende folders.

## Patronen

### Platform client

```typescript
import { MendixPlatformClient } from "mendixplatformsdk";
const client = new MendixPlatformClient();
```

### Working copy flow

```typescript
const app = client.getApp(appId);
const workingCopy = await app.createTemporaryWorkingCopy(branch);
const model = await workingCopy.openModel();
```

### Belangrijke aandachtspunten

- Gebruik `qualifiedName` voor stabiele referenties.
- Vermijd bulk-load van grote modellen.
- Gebruik defensieve checks voor metadata die per modelversie kan verschillen.
