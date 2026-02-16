# Mendix Copilot — MVP Productplan

## Productnaam: **Mendix Copilot** (werktitel)

> Een AI-assistent die via Claude je Mendix app-model kan lezen, analyseren en er vragen over beantwoorden — naast Studio Pro.

---

## 1. Visie & Scope

### Wat het is
Een lokaal draaiende MCP Server die de **Mendix Platform SDK + Model SDK** wrapt als tools, zodat Claude (via Claude Code of Claude Desktop) je Mendix-app kan inspecteren en er intelligente vragen over kan beantwoorden.

### Wat het NIET is (voor de MVP)
- Geen Studio Pro plugin/extensie (dat vereist C# en de Mendix Extensibility API)
- Geen wijzigingen aan het model (read-only in MVP)
- Geen directe integratie IN Studio Pro (draait ernaast)

### Kernprobleem dat het oplost
Mendix-ontwikkelaars missen een slimme assistent die hun **specifieke app** begrijpt. Maia (Mendix's eigen AI) is generiek — het kent de documentatie maar niet jouw model. Mendix Copilot kent jouw entities, microflows, pages en security.

---

## 2. Architectuur

```
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│                  │     │                      │     │                  │
│  Claude Code /   │────▶│  Mendix Copilot      │────▶│  Mendix Team     │
│  Claude Desktop  │ MCP │  (MCP Server)        │ SDK │  Server          │
│                  │◀────│                      │◀────│  (app model)     │
│                  │     │  - TypeScript/Node.js │     │                  │
└──────────────────┘     │  - Lokaal draaiend    │     └──────────────────┘
                         │  - PAT authenticatie  │
                         └──────────────────────┘
```

### Technische stack
- **Runtime**: Node.js + TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Mendix SDKs**: `mendixplatformsdk` + `mendixmodelsdk`
- **Transport**: stdio (voor Claude Code) + SSE/HTTP (voor Claude Desktop)
- **Auth**: Mendix Personal Access Token (PAT) via environment variable

### Hoe het werkt — stap voor stap
1. Gebruiker start de MCP server met een App ID + branch
2. Server maakt een **temporary read-only working copy** aan via Platform SDK
3. Server opent het model en cached de structuur in-memory
4. Claude kan tools aanroepen om het model te bevragen
5. Working copy wordt na sessie opgeruimd

---

## 3. MVP Scope — Fase 1 (Read-Only Assistent)

### 3.1 MCP Tools (wat Claude kan aanroepen)

#### Navigatie & Overzicht
| Tool | Beschrijving | Input | Output |
|------|-------------|-------|--------|
| `list_modules` | Alle modules in de app | — | Naam, type (user/marketplace/system) |
| `get_app_info` | App metadata | — | Naam, Mendix versie, runtime versie |
| `search_model` | Zoeken door hele model | `query: string` | Matches in entities, microflows, pages, etc. |

#### Domain Model
| Tool | Beschrijving | Input | Output |
|------|-------------|-------|--------|
| `get_domain_model` | Volledig domeinmodel van module | `module: string` | Entities, attributen, types, associaties |
| `get_entity_details` | Diep inzicht in één entity | `qualifiedName: string` | Attributen, validaties, event handlers, access rules, indexes |
| `get_associations` | Alle associaties van/naar entity | `qualifiedName: string` | Type (1-1, 1-*, *-*), owner, delete behavior |

#### Microflows & Logic
| Tool | Beschrijving | Input | Output |
|------|-------------|-------|--------|
| `list_microflows` | Microflows in module | `module: string` | Naam, parameters, return type |
| `get_microflow_details` | Stap-voor-stap logica | `qualifiedName: string` | Activities, decisions, loops, error handling, sub-calls |
| `list_nanoflows` | Nanoflows in module | `module: string` | Naam, parameters, return type |

#### Pages & UI
| Tool | Beschrijving | Input | Output |
|------|-------------|-------|--------|
| `list_pages` | Pages in module | `module: string` | Naam, layout, URL |
| `get_page_structure` | Paginastructuur | `qualifiedName: string` | Widgets, data views, data sources, buttons + acties |

#### Security
| Tool | Beschrijving | Input | Output |
|------|-------------|-------|--------|
| `get_security_overview` | Volledige security matrix | — | User roles → module roles → entity access |
| `get_entity_access` | Access rules voor entity | `qualifiedName: string` | Per role: create, delete, read/write per attribuut |

#### Analyse & Quality
| Tool | Beschrijving | Input | Output |
|------|-------------|-------|--------|
| `check_best_practices` | Bekende anti-patterns detecteren | `module?: string` | Warnings: geen error handling, lege pages, etc. |
| `get_dependencies` | Wat gebruikt deze entity/microflow? | `qualifiedName: string` | Inkomende en uitgaande referenties |

### 3.2 MCP Resources (context die Claude kan lezen)

| Resource | URI | Beschrijving |
|----------|-----|-------------|
| App Overview | `mendix://app/overview` | Samenvatting van de hele app |
| Module Summary | `mendix://module/{name}` | Samenvatting van specifieke module |

### 3.3 MCP Prompts (voorgedefinieerde workflows)

| Prompt | Beschrijving |
|--------|-------------|
| `review-module` | Volledige review van een module (domain model, security, logic) |
| `explain-microflow` | Leg een microflow uit in menselijke taal |
| `security-audit` | Controleer security configuratie op gaps |
| `document-module` | Genereer technische documentatie voor een module |

---

## 4. Gebruikersinterface

### Fase 1: Claude Code (CLI)
De snelste route naar een werkende MVP. Gebruiker werkt in de terminal:

```bash
# Setup (eenmalig)
npm install -g mendix-copilot
export MENDIX_TOKEN="jouw-personal-access-token"

# Start
mendix-copilot --app-id "abc123" --branch "trunk"

# Of configureer in Claude Code:
claude mcp add mendix-copilot -- mendix-copilot --app-id "abc123"
```

Daarna in Claude Code:
```
> Geef me een overzicht van alle entities in de module "Orders"
> Heeft de microflow "ACT_Order_Create" error handling?
> Welke user roles hebben schrijftoegang tot de entity "Customer"?
```

### Fase 1b: Claude Desktop
Zelfde MCP server, andere transport. Configuratie in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mendix-copilot": {
      "command": "mendix-copilot",
      "args": ["--app-id", "abc123", "--branch", "trunk"],
      "env": {
        "MENDIX_TOKEN": "jouw-pat"
      }
    }
  }
}
```

### Fase 2 (later): Eigen Web UI
Een dedicated lokale web interface naast Studio Pro, met:
- Chat interface met context over je app
- Visuele weergave van domain models en microflow structuur
- Quick actions (documentatie genereren, security audit, etc.)

---

## 5. Technische Uitdagingen & Oplossingen

### Challenge 1: Performance — Working Copy duurt 30-60s
**Oplossing**: 
- Eenmalig laden bij start, cachen in-memory
- Lazy loading van document details (pas laden als gevraagd)
- Background refresh optie voor als je model wijzigt in Studio Pro

### Challenge 2: Grote modellen overloaden Claude's context
**Oplossing**:
- Samenvatten op moduleniveau, details alleen on-demand
- Microflows beschrijven als gestructureerde stappen, niet raw SDK output
- Slim filteren: alleen relevante delen teruggeven

### Challenge 3: System module is niet toegankelijk via SDK
**Oplossing**:
- Documenteer de bekende System entities (User, FileDocument, Image) hardcoded
- Toon generalizations naar System types als metadata

### Challenge 4: Synchronisatie met lokale Studio Pro wijzigingen
**Oplossing MVP**:
- De SDK werkt met een working copy van het Team Server model
- Gebruiker moet committen in Studio Pro voordat Copilot wijzigingen ziet
- Later: file watcher op lokaal .mpr bestand voor real-time sync (complexer)

---

## 6. Projectplan & Fasering

### Week 1-2: Fundament
- [ ] TypeScript project opzetten met MCP SDK
- [ ] Mendix Platform SDK + Model SDK integreren
- [ ] Working copy management (open, cache, cleanup)
- [ ] Eerste 3 tools: `get_app_info`, `list_modules`, `get_domain_model`
- [ ] Testen met Claude Code

### Week 3-4: Core Tools
- [ ] `get_entity_details` + `get_associations`
- [ ] `list_microflows` + `get_microflow_details` (de lastigste — deep nested structure)
- [ ] `list_pages` + `get_page_structure`
- [ ] `search_model`
- [ ] Output formatting optimaliseren voor Claude's context window

### Week 5-6: Security & Quality
- [ ] `get_security_overview` + `get_entity_access`
- [ ] `check_best_practices` (basis anti-pattern detection)
- [ ] `get_dependencies`
- [ ] MCP Prompts voor review, audit en documentatie
- [ ] Error handling en edge cases

### Week 7-8: Polish & Release
- [ ] npm package publiceren
- [ ] README met installatie-instructies
- [ ] Claude Desktop configuratie documenteren
- [ ] Demo video maken
- [ ] Testen met 2-3 echte Mendix apps van verschillende complexiteit

---

## 7. Vereisten om te starten

### Accounts & Tokens
- **Mendix Developer Account** (gratis)
- **Mendix Personal Access Token** met scopes:
  - `mx:modelrepository:repo:read` — model lezen
  - `mx:modelrepository:repo:write` — working copies aanmaken (vereist, ook voor read-only)
- **Anthropic account** (voor Claude Code of Claude Desktop)

### Development Setup
```bash
mkdir mendix-copilot && cd mendix-copilot
npm init -y
npm install mendixplatformsdk mendixmodelsdk @modelcontextprotocol/sdk zod
npm install -D typescript @types/node tsx
```

### Test App
- Een bestaande Mendix app op Team Server
- Minimaal 1 module met entities, microflows en pages

---

## 8. Toekomstige Fases (na MVP)

### Fase 2: Write Operations
- Entity toevoegen/wijzigen
- Microflow scaffolding
- Security rules bulk-updaten
- Commit terug naar Team Server

### Fase 3: Studio Pro Extensie
- Mendix Studio Pro heeft een **Extensibility API** (C# based)
- Mogelijkheid om een panel toe te voegen met een chat interface
- Directe integratie met het lokale model (geen Team Server round-trip)

### Fase 4: Real-time Sync
- File watcher op `.mpr` bestand
- Lokale model parsing (zonder SDK, direct `.mpr` lezen — SQLite database)
- Instant feedback terwijl je bouwt

### Fase 5: Multi-App Intelligence
- Meerdere apps tegelijk analyseren
- Cross-app dependencies detecteren
- Portfolio-level security audits

---

## 9. Risico's

| Risico | Impact | Mitigatie |
|--------|--------|----------|
| Mendix SDK API changes | Hoog | Pinnen op specifieke SDK versie, tests schrijven |
| Working copy rate limits | Medium | Caching, hergebruik van working copies |
| Grote apps te complex voor context | Medium | Slim samenvatten, chunking strategie |
| Mendix bouwt dit zelf (Maia uitbreiden) | Hoog | Sneller leveren, open source, community building |
| PAT security (token exposure) | Medium | Alleen env vars, nooit in config files |

---

## 10. Succesindicatoren MVP

- [ ] In <2 minuten geïnstalleerd en werkend
- [ ] Kan alle modules, entities en microflows van een app opsommen
- [ ] Kan een microflow in menselijke taal uitleggen
- [ ] Kan security gaps identificeren
- [ ] Werkt met zowel Claude Code als Claude Desktop
- [ ] Werkt met Mendix 9.x, 10.x en 11.x apps
