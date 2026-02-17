---
description: Voer P1 uit voor Mendix-GPT: betere modelkennisdekking, retrievalkwaliteit, bronverwijzing en factual accuracy.
argument-hint: <optioneel: tools | retrieval | sources | evalset>
---

## P1 Prompt - Knowledge Quality

Focus: `$ARGUMENTS`

Als `$ARGUMENTS` leeg is, implementeer de volledige P1-scope.

## Doel

Verhoog de juistheid en bruikbaarheid van antwoorden op Mendix-vragen door betere contextopbouw, retrieval en bronkwaliteit.

## Context (verplicht lezen)

1. `src/web/api/chat-runner.ts`
2. `src/web/api/llm-client.ts`
3. `src/core/copilot-core.ts`
4. `src/mendix/client.ts`
5. `src/tools/info_tools.md`
6. `src/mendix/info_mendix.md`
7. `tests/unit/tools/*`
8. `tests/unit/mendix/*`

## Scope

### 1) Toolingdekking uitbreiden voor chat

- Zorg dat chat dezelfde relevante inspectiepaden heeft als MCP tooling.
- Overweeg extra tool-definities voor gaten in huidige vraagtypes.
- Houd tool-contracten klein, stabiel en expliciet.

### 2) Retrieval verbeteren

- Ga verder dan alleen naam/qualified name matching.
- Voeg retrieval op expressies, acties, bindings of andere model-signalen toe.
- Beperk hallucinatierisico door gefaseerde contextselectie.

### 3) Contextbudget beter benutten

- Verbeter prefetching op basis van intent/context.
- Minimaliseer irrelevante context, maximaliseer relevante details.
- Beheer truncatie expliciet zodat kernfeiten behouden blijven.

### 4) Bronnen en confidence

- Geef in eindantwoord duidelijke bronverwijzing met artifacttype + qualifiedName.
- Voeg confidence-signalen toe waar inferentie of heuristiek gebruikt is.
- Markeer onzekerheid expliciet in plaats van te gokken.

### 5) Evaluatieset en kwaliteitsmeting

- Maak een kleine maar representatieve evaluatieset met echte Mendix-vraagtypes.
- Definieer scoringscriteria: factuality, completeness, traceability.
- Maak herhaalbare evaluatiestap voor regressiedetectie.

## Non-goals

- Geen auth/cors fundamentele security-wijzigingen (P0).
- Geen UX-persistency of streaming-ui redesign (P2).
- Geen echte write-operaties (P3).

## Implementatieregels

1. Elke nieuwe retrievalstrategie moet testbaar zijn.
2. Heuristieken altijd labelen in output of metadata.
3. Houd API- en tool-contracten backward-compatible waar mogelijk.
4. Werk docs bij voor nieuwe beperkingen en nieuwe capabilities.

## Acceptance criteria

1. Chat beantwoordt een bredere set Mendix-vragen met hogere feitelijke precisie.
2. Bronnen in antwoorden zijn concreet en herleidbaar.
3. Evaluatieset bestaat en is reproduceerbaar.
4. Regressietests falen als retrievalkwaliteit aantoonbaar daalt.
5. Beperkingen/heuristieken zijn expliciet gedocumenteerd.

## Output format

1. **Kwaliteitsdoel**
2. **Nieuwe retrieval/tooling**
3. **Meetresultaat op evalset**
4. **Risico's en trade-offs**
5. **Aanbevolen volgende stap (richting P2)**

