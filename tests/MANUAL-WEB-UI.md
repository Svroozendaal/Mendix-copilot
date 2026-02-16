# Manual Test - Web UI + API

> Laatst bijgewerkt: 2026-02-16

## Doel
Valideren dat de localhost web UI en `copilot-api` end-to-end werken met een echte Mendix app.

## Voorwaarden

- `MENDIX_TOKEN` gezet in environment
- Optioneel `MENDIX_APP_ID` en `MENDIX_BRANCH` gezet in environment
- Dependencies geinstalleerd (`npm install`)

## Stappen

1. Start API en UI:

```bash
npm run dev
```

Verwacht:
- API op `http://127.0.0.1:8787`
- UI op `http://127.0.0.1:5173`

2. Connect:
- Open de UI.
- Vul `App ID` + `Branch` (of laat App ID leeg als server-side env is gezet).
- Klik `Connect`.

Verwacht:
- Status gaat naar verbonden.
- Module/aantal-statistieken zichtbaar.

3. Haal modules op:
- Klik `Reload modules`.
- Klik een module in de Explorer.

Verwacht:
- Entities, microflows en pages laden in de sidebar.
- Detail pane toont module/domain model output.

4. Open entity details:
- Klik een entity in de Explorer.

Verwacht:
- Detail pane toont entity details + associaties.
- `Copy` knop kopieert de output.

5. Run best-practices:
- Ga naar tab `Actions`.
- Vul module in.
- Klik `Review module` of `Security audit`.

Verwacht:
- Output bevat security en best-practice bevindingen.

6. Run plan/approval flow in Chat:
- Ga naar tab `Chat`.
- Geef een NL prompt, bijvoorbeeld:
  - `Maak een nieuwe entity Invoice in module Sales`
  - `Voeg attribuut Status toe aan Sales.Order`
- Klik `Generate plan`.

Verwacht:
- Plan preview toont:
  - summary
  - affected artifacts
  - risk badge (+ destructive badge als van toepassing)
- Approve is pas mogelijk na ingevuld `approvalToken`.
- Bij destructive plannen moet `confirmText` exact matchen.

7. Approve + execution streaming:
- Klik `Approve`.

Verwacht:
- Execution pane toont live events:
  - `command_start`
  - `command_success`
  - `command_failed` (alleen bij fout)
  - `commit_done`
  - `postcheck_results`
- Tab `Execution Log` toont command details + timestamp.
- `Execution summary` toont commit en post-check output.

8. Test ChangePlan API (optioneel via REST client):
- `POST /api/plan` met body `{ "message": "Create entity Invoice in module Sales" }`
- Neem `planId` uit de response.
- `POST /api/plan/validate` met `{ "planId": "<planId>" }`
- `POST /api/plan/execute` met `{ "planId": "<planId>", "approvalToken": "<token>" }`
  - Lees response als SSE stream.

Verwacht:
- Geldige ChangePlan JSON + preview.
- Validate response met warnings/errors.
- Execute stream met command events + final payload (`executionMode: "simulated"`).

## Resultaat (laatste run)

- Automatische checks lokaal: `npm run typecheck`, `npm run typecheck:web`, `npm run test:ci`, `npm run build` geslaagd.
- Handmatige live app-validatie: niet uitgevoerd in deze sessie (geen echte appverbinding in sandbox).
