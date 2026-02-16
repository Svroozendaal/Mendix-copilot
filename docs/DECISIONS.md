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

<!-- Voeg nieuwe beslissingen hier boven toe -->
