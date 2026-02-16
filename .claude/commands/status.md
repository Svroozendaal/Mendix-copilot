---
description: Toon de huidige projectstatus, wat af is, wat in progress is, en wat de volgende stap is.
---

## Project Status Check

Geef een volledig statusoverzicht van het Mendix Copilot project.

### Controleer:
1. **Projectstructuur**: Welke folders/bestanden bestaan al?
2. **Geïmplementeerde tools**: Welke MCP tools zijn al geregistreerd in src/index.ts?
3. **Test coverage**: Hoeveel tests zijn er? Slagen ze allemaal? (`npm test`)
4. **Documentatie**: Hebben alle code-folders een info_*.md?
5. **Dependencies**: Zijn alle packages geïnstalleerd? Is er een werkende build? (`npx tsc --noEmit`)

### Output format:
```
## 📊 Mendix Copilot Status

### ✅ Afgerond
- [lijst van voltooide features/componenten]

### 🚧 In Progress
- [lijst van features waar aan gewerkt wordt]

### 📋 Volgende Stap
- [eerstvolgende feature om te implementeren]

### ⚠️ Issues
- [bekende problemen of missende zaken]

### 📝 Documentatie Status
- [x] info_*.md: X van Y folders gedocumenteerd
- [x] DECISIONS.md: X beslissingen gelogd
- [x] Tests: X tests, Y slagend
```

Update ook de "Huidige Status" sectie in CLAUDE.md.
