# info_resources

> Laatst bijgewerkt: 2026-02-16

## Doel
MCP resources: read-only contextbronnen die de client kan ophalen.

## Bestanden
| Bestand | Doel | URI | Status |
|---------|------|-----|--------|
| app-overview.ts | Appbrede samenvatting (modules, security, highlights) | `mendix://app/overview` | Geimplementeerd |

## Resource details
`mendix://app/overview` bevat:
- App naam, App ID en Mendix versie
- Modulegroottes (entities/microflows/pages)
- Security status (aan/uit + aantal user roles)
- Highlights (grootste module, meeste microflows)

## Bekende beperkingen
- Resource-opbouw kan relatief duur zijn op grote apps omdat meerdere modelqueries worden uitgevoerd.
- Highlight logica is simpel (max op entities/microflows).
