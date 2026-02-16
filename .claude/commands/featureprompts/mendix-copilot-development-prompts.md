# Mendix Copilot — Development Masterprompts

> Gebruik deze prompts in volgorde in Claude Code (VS Code terminal).  
> Elke prompt is één development sessie. Plak de prompt, laat Claude werken, test het resultaat, commit.  
> **Start Claude Code altijd vanuit de `mendix-copilot/` project root.**

---

## Hoe te gebruiken

```bash
cd mendix-copilot
claude
```

Plak dan de prompt hieronder. Claude leest automatisch CLAUDE.md, kent de agents/skills, en gaat aan de slag.

**Na elke prompt:**
1. Test het resultaat handmatig of via `npm test`
2. Fix eventuele issues (vraag Claude)
3. Commit: `git add . && git commit -m "feat: <beschrijving>"`
4. Ga door naar de volgende prompt

---

## Prompt 1 — Fundament: MCP Server + Config + Mendix Client

```
Ik wil dat je het fundament bouwt van de Mendix Copilot MCP Server. Dit is de allereerste implementatie — er is nog geen werkende code. Lees eerst CLAUDE.md, docs/ARCHITECTURE.md, en de relevante info_*.md bestanden.

Bouw de volgende onderdelen in deze exacte volgorde:

### 1. src/config/index.ts
Configuratie module die:
- MENDIX_TOKEN uit environment leest (verplicht, error als ontbreekt)
- MENDIX_APP_ID uit environment leest (verplicht)
- MENDIX_BRANCH uit environment leest (default: "main")
- Een getypeerd Config object exporteert
- CLI argument parsing: --app-id en --branch flags moeten ook werken
  (environment variabelen hebben prioriteit over CLI args)

### 2. src/mendix/client.ts  
MendixClient class die:
- Een MendixPlatformClient initialiseert met het PAT token
- Een methode `connect()` heeft die:
  - De app ophaalt via app ID
  - Een temporary working copy aanmaakt
  - Het model opent
  - Een statusbericht logt naar stderr (niet stdout — dat is MCP transport)
- Een methode `getModel()` heeft die het geopende model retourneert
- Een methode `disconnect()` heeft die opruimt
- Foutmeldingen geeft als de connectie mislukt (ongeldige token, app niet gevonden, etc.)
- ALLE console output naar stderr stuurt (stdout is gereserveerd voor MCP)

### 3. src/mendix/cache.ts
Simpele in-memory cache die:
- get<T>(key: string): T | undefined
- set<T>(key: string, value: T, ttlMs?: number): void  
- invalidate(key: string): void
- clear(): void
- Default TTL van 5 minuten

### 4. src/index.ts
Entry point die:
- Config laadt
- MendixClient aanmaakt en connect
- Een McpServer aanmaakt met naam "mendix-copilot" en versie uit package.json
- Nog GEEN tools registreert (dat komt in de volgende prompt)
- StdioServerTransport start
- Graceful shutdown afhandelt (SIGINT/SIGTERM → client.disconnect())
- Een shebang bovenaan heeft: #!/usr/bin/env node

### 5. Tests
Schrijf unit tests in tests/unit/:
- tests/unit/config/config.test.ts — test config loading met mock env vars
- tests/unit/mendix/cache.test.ts — test alle cache operaties inclusief TTL expiry

Je hoeft de MendixClient NIET te unit-testen (die vereist echte SDK calls).
Maak wel tests/mocks/mendix-model.ts aan met een TODO comment voor toekomstige mock data.

### 6. Documentatie
Update ALLE relevante info_*.md bestanden met de actuele status.
Update docs/DECISIONS.md als je keuzes maakt die er nog niet in staan.

### Belangrijke regels:
- Log NIETS naar stdout — alleen stderr. Stdout is het MCP transport kanaal.
- Gebruik GEEN dotenv package — vertrouw op shell environment of .env in shell config.
- Installeer eerst dependencies: npm install
- Test dat TypeScript compileert: npx tsc --noEmit
- Draai tests: npm test
- Commit NIET naar git (dat doe ik handmatig)
```

---

## Prompt 2 — Eerste Tools: get_app_info + list_modules

```
De MCP server basis staat. Nu gaan we de eerste twee tools toevoegen zodat Claude de app kan ontdekken. Lees eerst CLAUDE.md en src/tools/info_tools.md.

### 1. src/tools/navigation.ts
Maak een registerNavigationTools(server, mendixClient) functie met deze twee tools:

**Tool: get_app_info**
- Geen parameters
- Retourneert: app naam, Mendix versie (model.metaModelVersion), aantal modules, lijst van module namen
- Dit is de "eerste kennismaking" tool — Claude roept dit aan om de app te leren kennen

**Tool: list_modules**
- Optionele parameter: `filter` (string) om te filteren op naam
- Retourneert per module: naam, of het een user module / marketplace module is
- Sorteer: user modules eerst, dan marketplace modules
- Tip: marketplace modules herken je dooraan dat ze fromAppStore === true zijn, of via de module origin. Als dat niet beschikbaar is, is een heuristiek OK (bijv. modules met hoofdletter + underscore patronen)

### 2. src/mendix/serializers/domain-model.ts (begin)
Maak alvast de basis serializer file aan, maar implementeer voor nu alleen:
- serializeModuleOverview(module): string — naam, aantal entities, aantal microflows, aantal pages

### 3. Registratie in src/index.ts
Importeer en roep registerNavigationTools aan na het aanmaken van de server, maar VOOR het starten van de transport.

### 4. Tests
- tests/unit/tools/navigation.test.ts
  - Test dat tools correct geregistreerd worden (mock de McpServer)
  - Test de serializer output met mock data

### 5. Handmatige test
Na het bouwen, test de server met de MCP Inspector:
```
npx @modelcontextprotocol/inspector node dist/index.js
```
Als dat niet lukt (door environment variabelen), beschrijf dan in de terminal hoe je het handmatig kunt testen.

### 6. Documentatie
Update src/tools/info_tools.md en src/info_src.md met de nieuwe status.
```

---

## Prompt 3 — Domain Model Tools

```
De navigatie tools werken. Nu bouwen we de domain model tools — het hart van de app-inspectie. Lees eerst de mendix-sdk skill (.claude/skills/mendix-sdk/SKILL.md) voor SDK patronen.

### 1. src/mendix/serializers/domain-model.ts (uitbreiden)
Implementeer deze serializers:

**serializeDomainModel(domainModel, options?)**
- Lijst alle entities met hun attributen (naam + type)
- Toon associaties met type (Reference/ReferenceSet), parent/child, delete behavior
- `options.detailed` (boolean): als true, toon ook validatie rules en indexes
- Formaat: gestructureerde tekst, NIET JSON. Voorbeeld:
  ```
  ## Module: MyModule
  
  ### Entity: Order
  Attributen:
  - OrderNumber (AutoNumber)
  - Status (Enumeration: OrderStatus)
  - TotalAmount (Decimal)
  - CreatedDate (DateTime)
  
  Associaties:
  - Order_Customer → Customer (Reference, eigenaar: default, delete: verwijder 'Order' objecten)
  - Order_OrderLine → OrderLine (ReferenceSet)
  ```

**serializeEntityDetails(entity)**
- Alle attributen met type, default value, validatie rules
- Access rules per module role
- Event handlers (before/after commit/delete)
- Indexes
- Generalisatie (inheritance) informatie

**serializeAssociations(entity, allEntities)**
- Alle associaties waar deze entity bij betrokken is (als parent EN child)
- Type, owner, delete behavior, navigability

### 2. src/tools/domain-model.ts
registerDomainModelTools(server, mendixClient) met:

**Tool: get_domain_model**
- Parameter: `module` (string, verplicht)
- Optioneel: `detailed` (boolean, default false)
- Gebruikt serializeDomainModel

**Tool: get_entity_details**
- Parameter: `qualifiedName` (string, verplicht — formaat "Module.Entity")
- Gebruikt serializeEntityDetails

**Tool: get_associations**
- Parameter: `qualifiedName` (string, verplicht)
- Gebruikt serializeAssociations

### 3. Caching
Gebruik de cache uit src/mendix/cache.ts:
- Cache domain models per module (key: `domainmodel:{moduleName}`)
- Cache entity details per qualified name
- TTL: 5 minuten (default)

### 4. Lazy Loading
BELANGRIJK: De Mendix SDK gebruikt lazy loading. Je MOET `.load()` aanroepen op entities en attributen voordat je hun properties kunt lezen. Bouw dit in de client of in een helper functie.

### 5. Tests
- tests/unit/serializers/domain-model.test.ts
  - Test met mock entities (verschillende types attributen, associaties)
  - Test met lege domain model
  - Test detailed vs non-detailed output
  - Test entity niet gevonden scenario

### 6. Documentatie
Update info_tools.md, info_serializers.md, info_mendix.md.
```

---

## Prompt 4 — Microflow & Logic Tools

```
Domain model tools werken. Nu de microflow tools — dit is de meest complexe serialisatie omdat microflows een deep nested object graph zijn. Lees de mendix-sdk skill.

### 1. src/mendix/serializers/microflow.ts

**serializeMicroflowList(microflows)**
- Per microflow: naam, parameters (naam + type), return type
- Sorteer alfabetisch
- Markeer microflows die als sub-microflow worden aangeroepen

**serializeMicroflowDetails(microflow)**  
Dit is de lastigste serializer. Een microflow is een graaf van activiteiten verbonden door flows. Serialiseer het als een LEESBAAR stappenplan:

```
## Microflow: ACT_Order_Create

Parameters: OrderData (NewOrder, Object)
Return type: Boolean

### Stappen:
1. [Create] Maak nieuw Order object
   → Set OrderNumber = $OrderData/OrderNumber
   → Set Status = 'New'
   → Set CreatedDate = [%CurrentDateTime%]
2. [Decision] Is $OrderData/CustomerID leeg?
   → Ja: ga naar stap 3
   → Nee: ga naar stap 4  
3. [Show Message] "Klant is verplicht" (Error)
   → Return false
4. [Retrieve] Haal Customer op waar ID = $OrderData/CustomerID
5. [Change] Set Order.Order_Customer = $Customer
6. [Commit] Sla Order op
7. [Return] true

⚠️ Error handling: Geen (aanbeveling: voeg error handler toe)
```

De uitdaging: microflow activiteiten komen in veel types:
- ActionActivity (create, change, delete, retrieve, commit, rollback)
- MicroflowCallAction
- ShowMessageAction  
- Decision (exclusive split)
- Loop
- ErrorHandler
- StartEvent, EndEvent

Probeer de meest voorkomende types te ondersteunen. Voor types die je niet herkent, toon: `[Unknown: TypeNaam]`.

### 2. src/tools/logic.ts
registerLogicTools(server, mendixClient) met:

**Tool: list_microflows**
- Parameter: `module` (string, verplicht)
- Optioneel: `filter` (string) — zoek in namen
- Gebruikt serializeMicroflowList

**Tool: get_microflow_details**
- Parameter: `qualifiedName` (string — "Module.MicroflowNaam")
- Gebruikt serializeMicroflowDetails

**Tool: list_nanoflows**
- Parameter: `module` (string, verplicht)  
- Zelfde structuur als list_microflows maar dan voor nanoflows

### 3. Registratie
Registreer in src/index.ts

### 4. Tests
- tests/unit/serializers/microflow.test.ts
  - Test met een simpele microflow (create + commit)
  - Test met een decision
  - Test met een lege microflow
  - Test met onbekend activity type (graceful fallback)

BELANGRIJK: Microflow mock data is complex. Maak een helper in tests/mocks/mendix-model.ts die realistische mock microflows genereert.

### 5. Documentatie
Update alle relevante info_*.md bestanden.
```

---

## Prompt 5 — Page Tools

```
Microflow tools werken. Nu page inspectie. Pages zijn complex maar we hoeven niet ALLES te serialiseren — focus op structuur en data binding.

### 1. src/mendix/serializers/page.ts

**serializePageList(pages)**
- Per page: naam, layout naam, URL (als beschikbaar)

**serializePageStructure(page)**
Serialiseer de pagina als een hiërarchische structuur:

```
## Page: Order_Overview

Layout: Atlas_Default
URL: /orders

Structuur:
├── DataGrid (bron: Database, entity: MyModule.Order)
│   ├── Kolom: OrderNumber (tekst)
│   ├── Kolom: Status (dropdown)
│   ├── Kolom: TotalAmount (tekst)
│   ├── Kolom: CreatedDate (datum)
│   └── Actie: Klik → Toon pagina Order_Detail
├── Button "Nieuwe Order"
│   └── Actie: Microflow MyModule.ACT_Order_Create
└── Search Bar
    ├── Zoekveld: OrderNumber
    └── Zoekveld: Status (dropdown)
```

Focus op:
- Data containers (DataView, DataGrid, ListView, TemplateGrid) met hun data source
- Input widgets met hun attribuut binding
- Buttons met hun on-click actie
- Structuur (LayoutGrid, Container, TabContainer) — alleen als nesting context

Negeer voor nu:
- Styling/CSS details
- Conditionele visibility regels
- Responsiveness settings

### 2. src/tools/pages.ts
registerPageTools(server, mendixClient) met:

**Tool: list_pages**
- Parameter: `module` (string)

**Tool: get_page_structure**
- Parameter: `qualifiedName` (string — "Module.PageNaam")

### 3. Tests en documentatie
Schrijf tests met mock page data. Update info bestanden.
```

---

## Prompt 6 — Security Tools

```
Pages werken. Nu security — een van de meest waardevolle features voor Mendix developers. Veel security bugs ontstaan door ontbrekende of verkeerde access rules.

### 1. src/mendix/serializers/security.ts

**serializeSecurityOverview(model)**
Maak een matrix van user roles → module roles → entity toegang:

```
## Security Overview

### User Roles
- Administrator → [Admin rechten in: MyModule, Administration]
- RegularUser → [User rechten in: MyModule]

### Module: MyModule

| Entity | Administrator | RegularUser |
|--------|--------------|-------------|
| Order | CRUD | R (eigen) |
| Customer | CRUD | R |
| OrderLine | CRUD | - |

Legenda: C=Create, R=Read, U=Update, D=Delete, (eigen)=alleen eigen objecten
```

**serializeEntityAccess(entity, securityInfo)**
Gedetailleerde access rules per entity:

```
## Entity: MyModule.Order

### Role: Administrator
- Create: ✅
- Delete: ✅
- Attributen:
  - OrderNumber: Read/Write
  - Status: Read/Write
  - TotalAmount: Read/Write

### Role: RegularUser
- Create: ❌
- Delete: ❌
- XPath constraint: [MyModule.Order_Account = '[%CurrentUser%]']
- Attributen:
  - OrderNumber: Read
  - Status: Read
  - TotalAmount: Read
```

### 2. src/tools/security.ts
registerSecurityTools(server, mendixClient) met:

**Tool: get_security_overview**
- Geen verplichte parameters
- Optioneel: `module` (string) — filter op specifieke module

**Tool: get_entity_access**
- Parameter: `qualifiedName` (string)

### 3. Tests en documentatie
Maak mock security data. Schrijf tests. Update info bestanden.
```

---

## Prompt 7 — Search + Analyse Tools

```
Alle core model tools zijn af. Nu de "slimme" tools: zoeken door het hele model en best practice analyse.

### 1. src/tools/navigation.ts (uitbreiden)

**Tool: search_model**
- Parameter: `query` (string)
- Optioneel: `scope` (enum: "all" | "entities" | "microflows" | "pages" | "enumerations")
- Doorzoekt namen van alle model documenten
- Case-insensitive matching
- Retourneert: type, qualified name, en de module waar het in zit
- Maximum 50 resultaten, gesorteerd op relevantie (exacte match > begint met > bevat)

### 2. src/tools/analysis.ts
registerAnalysisTools(server, mendixClient) met:

**Tool: check_best_practices**
- Optioneel: `module` (string) — specifieke module of hele app
- Controleert:
  - Microflows zonder error handling (geen error handler flow)
  - Entities zonder access rules
  - Entities zonder delete behavior op associaties
  - Microflows met meer dan 25 activiteiten (te complex)
  - Pages zonder data source op data containers
  - Ongebruikte variabelen in microflows (bonus, als haalbaar)
- Retourneert per bevinding: type (warning/info), locatie, beschrijving, aanbeveling

**Tool: get_dependencies**
- Parameter: `qualifiedName` (string)
- Retourneert:
  - Uitgaand: wat gebruikt dit document? (welke entities, microflows, pages refereert het)
  - Inkomend: wat gebruikt dit document? (welke andere documenten verwijzen hiernaar)
- Dit is complex met de SDK — doe wat haalbaar is. Als bepaalde richtingen niet werken, documenteer dat als beperking.

### 3. Tests
- Test search met diverse queries
- Test best practices met mock modellen die bewust fouten bevatten
- Test edge cases: lege modules, modules zonder microflows

### 4. Documentatie
Update alle info_*.md bestanden. Dit is een goed moment om /document te draaien.
```

---

## Prompt 8 — Resources + Prompts + Polish

```
Alle tools zijn af. Nu de MCP resources en prompts toevoegen, en de server polijsten voor dagelijks gebruik.

### 1. src/resources/app-overview.ts
Registreer een MCP resource:
- URI: mendix://app/overview
- Inhoud: automatisch gegenereerde samenvatting van de hele app
  - App naam en Mendix versie
  - Lijst van modules met hun grootte (entities/microflows/pages count)
  - Security status: hoeveel user roles, is security ingeschakeld
  - "Highlights": grootste module, module met meeste microflows, etc.

### 2. src/prompts/
Implementeer deze MCP prompts:

**review-module.ts**
- Parameter: module naam
- Prompt die Claude instrueert om:
  1. get_domain_model aan te roepen
  2. list_microflows aan te roepen
  3. get_security_overview te checken voor die module
  4. check_best_practices te draaien
  5. Een samenvatting te geven met bevindingen en aanbevelingen

**explain-microflow.ts**
- Parameter: microflow qualified name
- Prompt die Claude instrueert om:
  1. get_microflow_details aan te roepen
  2. De logica uit te leggen in begrijpelijke taal
  3. Mogelijke verbeterpunten te noemen

**security-audit.ts**
- Geen verplichte parameters
- Prompt die Claude instrueert om een volledige security audit te doen

### 3. Server Polish
- Voeg een --version flag toe aan de CLI
- Voeg een startup banner toe (naar stderr):
  ```
  Mendix Copilot v0.1.0
  Verbinden met app: [naam] (branch: [branch])
  Model geladen: [X] modules, [Y] entities, [Z] microflows
  MCP server gestart — klaar voor Claude
  ```
- Error handling verbeteren: als de SDK connectie faalt, geef een duidelijke foutmelding en exit
- Graceful shutdown: bij Ctrl+C netjes opruimen

### 4. End-to-end test
Beschrijf een handmatige test flow:
1. Start de server met een echte Mendix app
2. Verbind via MCP Inspector
3. Test elke tool minstens één keer
4. Documenteer resultaten in tests/MANUAL-TEST.md

### 5. README.md bijwerken
Werk de README bij met:
- Volledige installatie-instructies
- Configuratie uitleg
- Voorbeelden van wat je kunt vragen
- Bekende beperkingen
- Claude Code setup instructies
- Claude Desktop setup instructies

### 6. Finale documentatie ronde
Draai /document om alle info_*.md bestanden bij te werken.
Update de status in CLAUDE.md naar "MVP compleet".
```

---

## Prompt 9 (optioneel) — NPM Package + Distribution

```
De MVP is functioneel compleet. Nu klaar maken voor distributie.

### 1. Package.json opschonen
- Controleer alle velden: name, version, description, keywords, license, repository, bin
- Voeg een "files" veld toe dat alleen dist/ en package.json includeert
- Voeg "prepublishOnly": "npm run build" toe aan scripts

### 2. Build & Bundle
- Zorg dat `npm run build` een werkende dist/ folder produceert
- Test dat `node dist/index.js --app-id test --branch main` start (en dan failt op de token — dat is OK)
- Test de shebang: `chmod +x dist/index.js && ./dist/index.js --version`

### 3. Lokale test als global package
```bash
npm link
mendix-copilot --version
# Test met Claude Code:
claude mcp add mendix-copilot -- mendix-copilot --app-id "xxx" --branch "main"
```

### 4. .npmignore
Maak een .npmignore die alles excludeert behalve:
- dist/
- package.json
- README.md
- LICENSE

### 5. CHANGELOG.md
Maak een changelog voor v0.1.0 met alle features.

### 6. GitHub release voorbereiding
- Maak een .github/workflows/ci.yml voor basic CI (typecheck + tests)
- Voeg badges toe aan README.md
```

---

## Tussentijdse Tips

### Als iets niet werkt
```
De [tool/feature] werkt niet. De error is: [plak error]
Gebruik de debugger agent om dit te diagnosticeren en fixen.
```

### Als je de status wilt checken
```
/status
```

### Als documentatie achterblijft
```
/document
```

### Als je een specifieke tool wilt verbeteren
```
De output van de [tool_naam] tool is te lang/onleesbaar/incompleet.
Gebruik de architect agent om een beter output formaat te ontwerpen,
en de implementer agent om het te implementeren.
Hou rekening met Claude's context window — beknopt is beter.
```
