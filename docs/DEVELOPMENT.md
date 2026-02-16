# Development Workflow — VS Code + Claude Code

> Hoe je effectief werkt aan Mendix Copilot

## Setup (eenmalig)

### 1. Prerequisites
```bash
# Node.js 20+ vereist
node --version

# Claude Code installeren
npm install -g @anthropic-ai/claude-code

# Git configureren
git config user.name "Jouw Naam"
git config user.email "jouw@email.com"
```

### 2. Project Clonen & Installeren
```bash
git clone <repo-url> mendix-copilot
cd mendix-copilot
npm install
```

### 3. Environment Variables
```bash
# Maak een .env bestand (staat in .gitignore)
cp .env.example .env

# Vul in:
# MENDIX_TOKEN=jouw-personal-access-token
# MENDIX_APP_ID=jouw-app-id
# MENDIX_BRANCH=main
```

### 4. VS Code Extensions (aanbevolen)
- **Claude Code** — AI assistent
- **TypeScript** — taal support (ingebouwd)
- **Vitest** — test runner integratie
- **Error Lens** — inline error weergave

## Dagelijkse Workflow

### VS Code + Claude Code Combinatie

**Layout**: Open VS Code met de terminal onderaan. Start Claude Code in die terminal.

```
┌─────────────────────────────────────┐
│  VS Code Editor                     │
│  (code lezen, handmatige edits)     │
│                                     │
├─────────────────────────────────────┤
│  Terminal: Claude Code              │
│  > /implement add_list_modules_tool │
│                                     │
└─────────────────────────────────────┘
```

### Stap-voor-stap

1. **Start Claude Code** in de VS Code terminal:
   ```bash
   claude
   ```

2. **Check de status**:
   ```
   /status
   ```

3. **Implementeer een feature**:
   ```
   /implement <feature beschrijving>
   ```
   Claude leest automatisch CLAUDE.md, delegeert naar agents, schrijft code & tests.

4. **Review**:
   ```
   /review
   ```

5. **Commit** (via Claude Code of handmatig):
   ```
   git add .
   git commit -m "feat: beschrijving"
   ```

### Tips

- **Laat Claude Code werken, lees mee in VS Code** — je ziet in real-time welke bestanden worden aangepast
- **Ctrl+B** om een agent naar de achtergrond te sturen als hij lang bezig is
- **Wees specifiek** — "implementeer de list_modules tool" is beter dan "bouw tools"
- **Eén feature per sessie** — hou het klein en overzichtelijk
- **Check tests** — als tests falen, gebruik `/implement fix failing tests`

## Commands Referentie

| Command | Wat het doet |
|---------|-------------|
| `/implement <feature>` | Plan en implementeer een feature met alle agents |
| `/review [pad]` | Code review met de reviewer agent |
| `/document [folder]` | Update documentatie met de documenter agent |
| `/status` | Toon project status overzicht |

## Testen

```bash
# Watch mode (bij development)
npm test

# Single run (CI)
npm run test:ci

# Specifiek bestand
npx vitest run tests/unit/serializers/domain-model.test.ts
```

## Handmatig Testen met MCP Inspector

```bash
# MCP Inspector starten om de server te testen
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

**"Cannot find module"** → `npm install` en dan `npx tsc --noEmit`
**"MENDIX_TOKEN not set"** → Check `.env` bestand
**"Working copy timeout"** → PAT is mogelijk verlopen, genereer een nieuwe
**Tests falen** → `npm test` voor details, gebruik de debugger agent
