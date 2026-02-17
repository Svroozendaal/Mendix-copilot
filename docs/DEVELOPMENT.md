# Development Workflow

> Laatst bijgewerkt: 2026-02-16

## Doel

Praktische workflow voor ontwikkelen, testen en documenteren in deze repo.

## Vereisten

- Node.js 20+
- npm
- Optioneel voor Studio Pro 10 extension: .NET SDK 8.0

## Eerste setup

```bash
npm install
```

Maak `.env` op basis van `.env.example` en vul minimaal `MENDIX_TOKEN` in.

## Dagelijkse workflow

1. Start development servers:
   - `npm run dev`
   - of `.\commands\start-copilot.ps1`
2. Werk feature/code uit.
3. Run checks:
   - `npm run typecheck`
   - `npm run typecheck:web`
   - `npm run test:ci`
4. Build relevante hosts:
   - `npm run build:backend`
   - `npm run build:ui:web`
   - `npm run build:ui:studio-pro-11`
   - `npm run build:ui:studio-pro-10` (alleen met .NET SDK)
5. Werk documentatie bij volgens `docs/DOCUMENTATION_STANDARD.md`.

## Handige commands

| Command | Doel |
|---------|------|
| `npm run dev` | API + localhost web UI |
| `.\commands\start-copilot.ps1` | API + localhost web UI met `.env` loading |
| `npm run dev:api` | Alleen backend API |
| `npm run dev:web` | Alleen localhost web UI |
| `npm run dev:mcp` | MCP server watch mode |
| `npm run build:all-hosts` | Build backend + alle UI hosts |
| `npm run test:ci` | Unit tests in CI-mode |
| `.\commands\deploy-studio-pro10-panel.ps1 "<MendixAppFolder>"` | Build + kopieert Studio Pro 10 extensionbestanden naar Mendix app |

## Kwaliteitsregels

- Houd wijzigingen klein en toetsbaar.
- Voeg tests toe voor nieuw gedrag.
- Voeg/werk `info_*.md` bij in elke gewijzigde codefolder.
- Leg architectuurkeuzes vast in `docs/DECISIONS.md`.
