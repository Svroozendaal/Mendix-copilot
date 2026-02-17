# How To Use Mendix Copilot With Codex

Deze handleiding legt stap voor stap uit hoe je een Mendix app koppelt aan deze MCP server via Codex CLI.

## 1. Vereisten

Zorg dat je dit hebt:

- Node.js 20 of hoger
- Codex CLI geinstalleerd en ingelogd
- Toegang tot een Mendix app op Team Server
- Een Mendix Personal Access Token (PAT)

Controleer lokaal:

```bash
node --version
codex --version
codex mcp --help
```

## 2. Vind je Mendix App ID

Je hebt de App ID nodig voor `MENDIX_APP_ID`.

1. Open je app in de Mendix Developer Portal.
2. Ga naar de `General` tab van de app.
3. Zoek `App ID` (soms ook Project ID genoemd).
4. Kopieer deze waarde.

Tip: de App ID is een technische identifier, niet de zichtbare app-naam.

## 3. Maak een Mendix Personal Access Token (PAT)

1. Ga naar: `https://user-settings.mendixcloud.com/link/developersettings`
2. Maak een nieuwe Personal Access Token.
3. Geef minimaal deze scopes:
   - `mx:modelrepository:repo:read`
   - `mx:modelrepository:repo:write`
4. Kopieer de token direct en bewaar hem veilig.

Waarom ook `write`? Omdat de SDK een tijdelijke working copy aanmaakt, zelfs voor read-only inspectie.

## 4. Kies de juiste branch

De server gebruikt een branchnaam uit `MENDIX_BRANCH` (default is `main`).

1. Open in Developer Portal de Team Server/Branches weergave.
2. Controleer de exacte branchnaam, bijvoorbeeld `main`, `trunk`, of een feature branch.
3. Gebruik exact dezelfde spelling in je configuratie.

## 5. Build de server lokaal

Voer dit uit in de project root (`mendix-copilot/`):

```bash
npm install
npm run build:backend
```

Na build moet `dist/index.js` bestaan.

## 6. Voeg de MCP server toe in Codex

### Optie A: alles via environment variables (aanbevolen)

```bash
codex mcp add mendix-copilot \
  --env MENDIX_TOKEN=YOUR_PAT_TOKEN \
  --env MENDIX_APP_ID=YOUR_APP_ID \
  --env MENDIX_BRANCH=main \
  -- node dist/index.js
```

### Optie B: App ID en branch via CLI flags

Gebruik dit als je alleen token als env wilt zetten:

```bash
codex mcp add mendix-copilot \
  --env MENDIX_TOKEN=YOUR_PAT_TOKEN \
  -- node dist/index.js --app-id YOUR_APP_ID --branch main
```

Let op: environment variables hebben prioriteit boven `--app-id` en `--branch`.

## 7. Controleer of Codex de server ziet

```bash
codex mcp list
codex mcp get mendix-copilot
```

Als deze server in de output staat, is de registratie gelukt.

## 8. Start Codex en gebruik de tools

Start Codex in dezelfde repo:

```bash
codex
```

Vraag daarna bijvoorbeeld:

- `Gebruik get_app_info en geef een overzicht van deze app.`
- `Gebruik list_modules en toon alleen modules met 'Order' in de naam.`
- `Gebruik get_domain_model voor module Sales.`
- `Gebruik get_entity_details voor Sales.Order.`
- `Gebruik get_associations voor Sales.Order.`

## 9. Veelvoorkomende fouten

### `MENDIX_TOKEN environment variable is required`

- Je token is niet gezet in de MCP configuratie.
- Voeg `--env MENDIX_TOKEN=...` toe bij `codex mcp add`.

### `MENDIX_APP_ID ... is required`

- Je hebt geen `MENDIX_APP_ID` gezet en ook geen `--app-id` doorgegeven.
- Controleer de waarde uit de `General` tab in Developer Portal.

### `Failed to connect to Mendix app ...`

- App ID is ongeldig.
- Token heeft verkeerde scopes.
- Branch bestaat niet.
- Je account heeft geen toegang tot de app.

### Trage startup (30-60s)

- Dit is normaal: Mendix SDK maakt een tijdelijke working copy.

## 10. Veiligheid

- Commit nooit PAT tokens naar git.
- Zet tokens alleen als environment variables (of via `codex mcp add --env ...`).
- Deel tokenwaarden niet in screenshots of logs.

## 11. Server bijwerken of verwijderen

Als je configuratie wilt aanpassen:

1. Verwijder bestaande server:

```bash
codex mcp remove mendix-copilot
```

2. Voeg opnieuw toe met nieuwe waarden:

```bash
codex mcp add mendix-copilot --env ... -- node dist/index.js ...
```

## 12. Snelle checklijst

- `npm run build` is geslaagd
- App ID gekopieerd uit Developer Portal `General` tab
- PAT heeft `repo:read` + `repo:write`
- Branchnaam klopt exact
- `codex mcp list` toont `mendix-copilot`
- Codex kan `get_app_info` succesvol uitvoeren
