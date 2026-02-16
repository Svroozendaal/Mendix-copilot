# Mendix Copilot

> AI-assistent die je Mendix app model begrijpt — powered by Claude + MCP

Mendix Copilot is een MCP Server die Claude toegang geeft tot je Mendix applicatiemodel. Stel vragen over je entities, microflows, pages en security — direct vanuit Claude Code of Claude Desktop.

## Wat kan het?

- **"Toon alle entities in de module Orders"** → Domain model overzicht
- **"Leg de microflow ACT_Order_Create uit"** → Stap-voor-stap uitleg
- **"Welke user roles hebben toegang tot Customer?"** → Security analyse
- **"Zijn er microflows zonder error handling?"** → Best practice check

## Quick Start

```bash
# Installeren
npm install -g mendix-copilot

# Configureren
export MENDIX_TOKEN="jouw-personal-access-token"

# Starten met Claude Code
claude mcp add mendix-copilot -- mendix-copilot --app-id "jouw-app-id"
```

## Gebruik Met Codex

Voor een volledige stap-voor-stap uitleg (App ID vinden, PAT scopes, branch kiezen, en Codex MCP koppeling):

- Zie `docs/HOW-TO-USE-CODEX.md`

## Status

🚧 **In ontwikkeling** — Zie [docs/MVP-PLAN.md](docs/MVP-PLAN.md) voor de roadmap.

## Development

Zie [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) voor de development workflow.

## Architectuur

Zie [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) voor het technisch ontwerp.

## Licentie

MIT
