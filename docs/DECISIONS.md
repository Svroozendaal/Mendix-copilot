# Architectuurbeslissingen — Mendix Copilot

> Elke significante technische keuze wordt hier gelogd met context en rationale.

---

### 2026-02-16 — TypeScript als taal

**Context**: De MCP SDK en Mendix SDK zijn beide TypeScript/JavaScript. We moeten een taal kiezen.
**Beslissing**: TypeScript met strict mode.
**Rationale**: Beide SDKs zijn TypeScript-native. Geen serialisatie nodig, type safety, en één ecosystem.
**Alternatieven**: Python (heeft ook MCP SDK maar geen native Mendix SDK), Go (geen SDK beschikbaar).

---

### 2026-02-16 — MCP Server als architectuurpatroon

**Context**: We willen Claude laten communiceren met Mendix modellen. Er zijn meerdere manieren: REST API, MCP Server, direct SDK wrapper.
**Beslissing**: MCP Server die de Mendix SDK wrapt.
**Rationale**: MCP is het standaard protocol voor Claude integraties. Werkt met zowel Claude Code als Claude Desktop. Geen eigen transport nodig.
**Alternatieven**: REST API (vereist eigen client in Claude), Studio Pro extensie (C#, complex, platform-locked).

---

### 2026-02-16 — Read-only MVP

**Context**: De SDK ondersteunt zowel lezen als schrijven. Moeten we beide implementeren?
**Beslissing**: MVP is read-only. Geen write operaties.
**Rationale**: Lezen is veilig en levert direct waarde. Schrijven vereist uitgebreide validatie, conflict handling, en gebruikersbevestiging. Risico van onbedoelde modelwijzigingen te groot voor MVP.
**Alternatieven**: Direct read+write (te risicovol), read + "suggest changes" (goed voor v2).

---

### 2026-02-16 — Vitest als test framework

**Context**: We hebben een test framework nodig dat goed werkt met TypeScript.
**Beslissing**: Vitest.
**Rationale**: TypeScript-native, snelle startup, compatible met Jest API, goede IDE integratie.
**Alternatieven**: Jest (trager, meer configuratie nodig), Mocha (meer setup).

---

### 2026-02-16 — Documentatie via info_*.md per folder

**Context**: Code documentatie wordt snel verouderd. We willen een systeem dat makkelijk bij te houden is.
**Beslissing**: Elk code-folder krijgt een `info_[foldernaam].md` met gestandaardiseerd template.
**Rationale**: Dicht bij de code, makkelijk te vinden, dwingt documentatie per component af. De documenter agent houdt dit bij.
**Alternatieven**: JSDoc alleen (te verspreid), Wiki (te ver van code), README per folder (minder gestandaardiseerd).

---

### 2026-02-16 — Lazy initialization van Mendix client

**Context**: De MendixClient moet een working copy openen bij start, wat 30-60 seconden duurt. Moeten we dit bij server start doen of bij eerste tool call?
**Beslissing**: Lazy initialization bij eerste tool call, niet bij server start.
**Rationale**: De MCP server moet snel opstarten zodat Claude Code / Claude Desktop niet time-out. De working copy wordt pas aangemaakt wanneer de eerste tool daadwerkelijk data nodig heeft. Dit scheidt de MCP lifecycle van de SDK lifecycle. Een `ensureModel()` methode op de client handelt dit transparant af.
**Alternatieven**: Eager loading bij start (risico op time-out), background loading (complex, race conditions).

---

### 2026-02-16 — Config via environment variables, geen CLI argument parsing in de server

**Context**: De server moet configuratie ontvangen (PAT, app ID, branch). Via CLI args, env vars, of config file?
**Beslissing**: Primair via environment variables (`MENDIX_TOKEN`, `MENDIX_APP_ID`, `MENDIX_BRANCH`). Geen eigen CLI arg parsing in de server zelf.
**Rationale**: MCP servers worden gestart door de MCP host (Claude Code/Desktop) die env vars kan injecteren. CLI args zijn lastig te configureren in `claude_desktop_config.json`. Env vars zijn simpeler en werken consistent op alle platforms. De `.env.example` documenteert welke variabelen nodig zijn.
**Alternatieven**: CLI args via yargs/commander (extra dependency, complexer), config file (extra stap voor gebruiker).

---

### 2026-02-16 — MendixClient als facade over beide SDKs

**Context**: We gebruiken twee SDKs (Platform SDK + Model SDK). Hoe structureren we de toegang?
**Beslissing**: Een `MendixClient` class die als facade dient over beide SDKs. De rest van de codebase kent alleen `MendixClient`, nooit de raw SDKs.
**Rationale**: Encapsuleert working copy management, caching, en lazy loading. Maakt de tools testbaar via dependency injection. Voorkomt dat SDK-specifieke types lekken naar de tool laag.
**Alternatieven**: Directe SDK calls vanuit tools (tight coupling, moeilijk te testen), repository pattern per entity type (overkill voor MVP).

---

### 2026-02-16 — Error handling via MCP content response, niet via thrown exceptions

**Context**: Hoe gaan tools om met fouten (SDK timeout, ongeldige module naam, etc.)?
**Beslissing**: Tools retourneren fouten als `{ content: [{ type: "text", text: "Error: ..." }], isError: true }`. Ze gooien geen exceptions.
**Rationale**: Het MCP protocol verwacht content responses. Thrown exceptions worden door de MCP SDK afgevangen maar geven minder informatieve output aan Claude. Door errors als content te retourneren kan Claude de fout interpreteren en aan de gebruiker uitleggen.
**Alternatieven**: Throw exceptions (MCP SDK vangt ze op, maar output is generiek), custom error types (overkill voor MVP).

---

### 2026-02-16 — Hybrid config: environment-first met CLI fallback

**Context**: Voor MCP-hosts (Claude Code/Desktop) zijn environment variables ideaal, maar lokale dev/tests gebruiken vaak CLI flags.
**Beslissing**: Ondersteun `--app-id` en `--branch` als fallback. Environment variables (`MENDIX_APP_ID`, `MENDIX_BRANCH`) blijven leidend.
**Status**: Vervangt de eerdere env-only beslissing voor configuratie.
**Rationale**: Houdt host-integraties simpel, maar maakt handmatig starten en testen makkelijker zonder extra configfiles.
**Alternatieven**: Alleen env vars (minder flexibel lokaal), alleen CLI (minder geschikt voor MCP-host configuratie).

---

### 2026-02-16 — Verbinden bij server startup, lazy loading binnen modelnavigatie

**Context**: Prompt 1 vereist expliciete connectie (`connect()`) en nette shutdown (`disconnect()`), terwijl Mendix modelobjecten zelf lazy geladen worden.
**Beslissing**: MCP server roept `mendixClient.connect()` aan tijdens startup voor fail-fast gedrag. Binnen modelextractie blijft lazy loading actief via `.load()` op entities, attributen en gerelateerde objecten.
**Status**: Vervangt de eerdere beslissing om pas bij de eerste tool call te verbinden.
**Rationale**: Vroege detectie van token/app/branch fouten, gecombineerd met gecontroleerde dataload per object.
**Alternatieven**: Volledig lazy connect op eerste tool call (snellere startup, latere foutdetectie), volledige eager model traversal (te zwaar voor grote modellen).

---

<!-- Voeg nieuwe beslissingen hier boven toe -->
