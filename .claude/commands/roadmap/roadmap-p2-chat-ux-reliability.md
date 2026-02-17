---
description: Voer P2 uit voor Mendix-GPT: chat UX, streamingkwaliteit, conversation persistence en robuustheid.
argument-hint: <optioneel: persistence | streaming | retries | error-handling>
---

## P2 Prompt - Chat UX & Reliability

Focus: `$ARGUMENTS`

Als `$ARGUMENTS` leeg is, implementeer de volledige P2-scope.

## Doel

Maak de chatervaring stabiel en bruikbaar voor dagelijks gebruik in langere sessies, inclusief heldere foutafhandeling en voorspelbaar gedrag.

## Context (verplicht lezen)

1. `web-ui/src/App.tsx`
2. `web-ui/src/api-client.ts`
3. `web-ui/src/styles.css`
4. `src/web/api/app.ts`
5. `src/web/api/chat-runner.ts`
6. `src/web/api/types.ts`
7. `docs/WEB_UI.md`
8. `tests/MANUAL-WEB-UI.md`

## Scope

### 1) Conversatie-persistentie

- Bewaar gesprekken per app/branch/sessie zodat context niet steeds verloren gaat.
- Zorg voor gecontroleerde cleanup en limieten op historie.
- Maak herstelgedrag expliciet bij refresh of reconnect.

### 2) Streaming en interactie

- Verbeter token/progress streaming naar echte gebruikersfeedback.
- Voeg cancel/retry gedrag toe waar nog ontbrekend.
- Voorkom dat UI in "busy" toestand blijft hangen bij fouten/timeouts.

### 3) Foutafhandeling en fallback UX

- Toon begrijpelijke foutmeldingen voor connect, auth, timeout, tool errors.
- Maak fallbackpaden functioneel en duidelijk gelabeld.
- Geef gerichte herstelacties in de UI.

### 4) Performance en stabiliteit

- Voorkom onnodige rerenders en race-conditions in chat state.
- Beperk memorygroei bij lange threads.
- Definieer timeouts en retries expliciet en consistent.

### 5) Testen

- Voeg tests toe voor kritieke chat state transitions.
- Voeg handmatige checks toe voor streaming, timeout, reconnect en persistence.

## Non-goals

- Geen grote security-architectuurwijzigingen (P0).
- Geen retrieval-inhoudelijke uitbreiding (P1).
- Geen write-agent uitvoering (P3).

## Implementatieregels

1. UX-teksten moeten eenduidig en actiegericht zijn.
2. Geen stil falen: errors altijd zichtbaar of gelogd.
3. API- en UI-timeouts moeten op elkaar afgestemd zijn.
4. Werk docs en manual teststappen bij.

## Acceptance criteria

1. Gesprekscontext blijft bruikbaar over refresh/reconnect.
2. Gebruiker kan lopende chat request cancelen zonder UI-corruptie.
3. Timeout- en foutscenario's leiden niet tot vastgelopen state.
4. Streamingstatus is begrijpelijk en consistent.
5. Handmatige tests voor chat runtime zijn bijgewerkt en uitvoerbaar.

## Output format

1. **UX/reliability probleem dat is opgelost**
2. **Technische wijziging**
3. **Gebruikersimpact**
4. **Testbewijs**
5. **Aanbevolen volgende stap (richting P3 of hardening)**

