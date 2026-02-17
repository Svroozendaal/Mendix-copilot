---
description: Voer P0 uit voor Mendix-GPT: security, sessie-isolatie, rate limiting, logging en basis testhardening.
argument-hint: <optioneel: auth-only | session-only | rate-limit | logging | tests>
---

## P0 Prompt - Security & Foundation

Focus: `$ARGUMENTS`

Als `$ARGUMENTS` leeg is, implementeer de volledige P0-scope.

## Doel

Maak de huidige app veilig en operationeel robuust genoeg als fundament voor Mendix-GPT.

## Context (verplicht lezen)

1. `src/web/api/app.ts`
2. `src/web/api/session-manager.ts`
3. `src/web/api/schemas.ts`
4. `src/web/api/types.ts`
5. `src/web/api/info_api.md`
6. `.env.example`
7. `tests/unit/web-api/*`
8. `docs/DEVELOPMENT.md`

## Scope

### 1) API-authenticatie en autorisatie

- Voeg server-side auth toe voor gevoelige endpoints.
- Definieer expliciet welke endpoints publiek mogen blijven (bijvoorbeeld `health`).
- Zorg dat onbevoegde calls consistente foutcodes krijgen.

### 2) CORS hardening

- Vervang wildcard CORS door allowlist-config via environment variable.
- Default moet veilig zijn (deny by default, behalve expliciet geconfigureerd).

### 3) Sessie-isolatie

- Verwijder globale sessie-aanname.
- Introduceer sessie-identiteit per gebruiker of per client-context.
- Borg dat app/branch context niet lekt tussen gebruikersstromen.

### 4) Rate limiting en request guards

- Bescherm minimaal chat- en plan-endpoints tegen overbelasting.
- Voeg input-grenzen en redelijke limieten toe waar nog ontbrekend.

### 5) Logging en traceability

- Introduceer request-id/correlation-id.
- Log belangrijke events: connect, chat start/einde, tool-calls, errors, execute.
- Log nooit secrets of tokens.

### 6) Testen en verificatie

- Breid tests uit op auth/cors/session gedrag.
- Voeg runtimegerichte tests toe voor API-fouten en SSE-flow waar passend.

## Non-goals

- Geen grote UI-redesign.
- Geen semantic retrieval werk (dat hoort in P1).
- Geen echte write-path (dat hoort in P3).

## Implementatieregels

1. Houd wijzigingen klein en toetsbaar.
2. Voeg per functionele wijziging testdekking toe.
3. Update `info_*.md` en `docs/DEVELOPMENT.md` als gedrag verandert.
4. Voeg nieuwe env vars toe aan `.env.example`.

## Acceptance criteria

1. Gevoelige endpoints weigeren niet-geauthenticeerde requests.
2. CORS staat niet meer open op `*` zonder expliciete keuze.
3. Sessiecontext is gescheiden per client-identiteit.
4. Chat/plan endpoints hebben rate limiting of equivalent guard.
5. Request-id is zichtbaar in logs en foutpaden.
6. Tests dekken minimaal auth/cors/session regressies.

## Output format

1. **Samenvatting**
2. **Concreet aangepast**
3. **Tests gedraaid**
4. **Open risico's**
5. **Aanbevolen volgende stap (richting P1)**

