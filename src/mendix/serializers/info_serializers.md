# info_serializers

> Laatst bijgewerkt: 2026-02-16

## Doel
Vertalen van raw Mendix SDK model objecten naar beknopte, leesbare tekst die Claude kan gebruiken. Dit is een KRITIEKE laag — als de output te lang of te technisch is, verbruikt het te veel context en werkt Claude minder goed.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| domain-model.ts | Entities, attributen, associaties → tekst | 📋 Gepland |
| microflow.ts | Microflow stappen/logica → tekst | 📋 Gepland |
| page.ts | Pagina structuur/widgets → tekst | 📋 Gepland |
| security.ts | Security matrix → tekst | 📋 Gepland |

## Design Principes
1. **Beknopt** — alleen wat Claude nodig heeft
2. **Gestructureerd** — consistent formaat per type
3. **Leesbaar** — menselijke taal, geen SDK jargon
4. **Geen IDs** — gebruik namen, niet interne identifiers
