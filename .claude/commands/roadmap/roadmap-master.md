---
description: End-to-end roadmap prompt om Mendix Copilot om te bouwen naar een production-grade Mendix-GPT.
argument-hint: <optioneel: focus, fase of scope>
---

## Mendix-GPT Roadmap Master Prompt

Je werkt aan: `$ARGUMENTS`

Als `$ARGUMENTS` leeg is, voer je de volledige roadmap uit in volgorde P0 -> P1 -> P2 -> P3.

## Missie

Bouw de huidige applicatie gecontroleerd om tot een betrouwbare Mendix-GPT:

- veilig genoeg voor intern productiegebruik,
- feitelijk accuraat op Mendix modelvragen,
- stabiel onder langere chats en SSE-workloads,
- uitbreidbaar naar veilige write-operaties.

## Eerst lezen (verplicht)

1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DECISIONS.md`
4. `docs/PROJECT_OVERVIEW.md`
5. `src/web/api/info_api.md`
6. `src/mendix/info_mendix.md`
7. `src/change-executor/info_change-executor.md`
8. `tests/unit/web-api/info_web-api.md`
9. `.claude/commands/roadmap/README.md`

## Werkwijze

### Stap 1: Baseline analyse

Lever een korte, concrete nulmeting:

- bestaande sterktes,
- bekende gaten,
- risico's als niets verandert.

Maak onderscheid tussen:

- product/security risico,
- accuratesse/kennis risico,
- operabiliteit/test risico.

### Stap 2: Fasering en prioriteiten

Gebruik deze fasering:

1. P0 Security & Foundation
2. P1 Knowledge Quality
3. P2 Chat UX & Reliability
4. P3 Write Agent (optioneel en guarded)

Per fase definieer je:

- scope,
- non-goals,
- concrete deliverables,
- meetbare acceptance criteria.

### Stap 3: Implementeren in kleine slices

Voor elke slice:

1. ontwerp kort vastleggen;
2. code schrijven;
3. tests toevoegen/draaien;
4. documentatie bijwerken;
5. resultaten en open risico's rapporteren.

Werk in kleine, veilige wijzigingen. Vermijd brede refactors zonder functionele noodzaak.

### Stap 4: Validatie

Per fase minimaal:

- `npm run typecheck`
- `npm run typecheck:web`
- `npm run test:ci`

Bij API-runtime wijzigingen: voeg gerichte tests toe voor request/response en SSE gedrag.

### Stap 5: Documentatie en beslissingen

Werk waar nodig bij:

- `docs/DECISIONS.md`
- relevante `info_*.md`
- eventueel `README.md` en `docs/DEVELOPMENT.md`

Nieuwe keuzes altijd met:

- context,
- beslissing,
- rationale,
- alternatief.

## Deliverable format

Geef output altijd in dit formaat:

1. **Fase en scope**
2. **Wat is gedaan**
3. **Bestanden aangepast**
4. **Tests en uitkomst**
5. **Open risico's**
6. **Volgende stap**

## Kwaliteitslat

Neem niets aan zonder verificatie in code.
Als informatie ontbreekt:

- benoem expliciet de aanname,
- verklein impact van die aanname,
- geef gerichte vervolgstap om onzekerheid weg te nemen.

## Stopcriteria per fase

Een fase is alleen afgerond als:

- acceptance criteria gehaald zijn,
- regressierisico beheersbaar is,
- docs en tests meegeleverd zijn.

