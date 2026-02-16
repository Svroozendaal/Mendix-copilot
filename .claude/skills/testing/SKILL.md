---
name: testing
description: Test patterns and strategy for Mendix Copilot. Use when writing tests, setting up test infrastructure, or debugging test failures.
---

# Testing Strategie — Mendix Copilot

## Framework

- **Vitest** — snelle TypeScript-native test runner
- Config in `vitest.config.ts`
- Run: `npm test` (watch mode) of `npm run test:ci` (single run)

## Test Structuur

```
tests/
├── unit/
│   ├── tools/           ← Tool registratie & parameter validatie
│   ├── serializers/     ← Output formatting tests
│   ├── mendix/          ← Client & cache tests (met mocks)
│   └── config/          ← Configuratie tests
├── integration/         ← Echte SDK calls (optioneel, vereist PAT)
└── mocks/
    └── mendix-model.ts  ← Gedeelde mock data
```

## Unit Test Patroon

```typescript
import { describe, it, expect, vi } from "vitest";

describe("serializeDomainModel", () => {
  it("should list all entities with attributes", () => {
    const mockDomainModel = createMockDomainModel();
    const result = serializeDomainModel(mockDomainModel);

    expect(result).toContain("Order");
    expect(result).toContain("String");
  });

  it("should handle empty domain model gracefully", () => {
    const empty = createMockDomainModel({ entities: [] });
    const result = serializeDomainModel(empty);

    expect(result).toContain("Geen entities gevonden");
  });
});
```

## Mocking Mendix SDK

De Mendix SDK is complex. Mock op de juiste laag:

```typescript
// Mock de MendixClient, NIET individuele SDK calls
const mockClient = {
  getModules: vi.fn().mockResolvedValue([
    { name: "MyModule", domainModel: { entities: [...] } }
  ]),
  getMicroflow: vi.fn().mockResolvedValue({
    name: "MF_CreateOrder",
    activities: [...]
  }),
};
```

## Wat MOET getest worden

- [x] Elke serializer met representatieve input
- [x] Elke serializer met lege/edge-case input
- [x] Tool parameter validatie (ongeldige input)
- [x] Error handling (SDK connection failures)
- [x] Cache invalidatie

## Wat NIET getest hoeft

- MCP SDK protocol handling (dat test Anthropic)
- Mendix SDK internals (dat test Mendix)
- Specifieke Mendix model inhoud (verschilt per app)
