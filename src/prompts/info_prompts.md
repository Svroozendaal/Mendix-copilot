# info_prompts

> Laatst bijgewerkt: 2026-02-16

## Doel
MCP prompt templates voor herbruikbare multi-step workflows.

## Bestanden
| Bestand | Doel | Prompt naam | Status |
|---------|------|-------------|--------|
| review-module.ts | Volledige module review workflow | `review-module` | Geimplementeerd |
| explain-microflow.ts | Microflow uitleg in begrijpelijke taal | `explain-microflow` | Geimplementeerd |
| security-audit.ts | Security audit workflow | `security-audit` | Geimplementeerd |

## Opzet
Elke prompt instrueert de client expliciet welke tools in welke volgorde aangeroepen moeten worden.

## Bekende beperkingen
- Prompts voeren zelf geen tools uit; ze leveren alleen instructieberichten aan de client.
- Kwaliteit van de uitkomst blijft afhankelijk van tool-output en modelmetadata.
