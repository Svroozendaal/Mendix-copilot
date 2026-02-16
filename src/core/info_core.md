# info_core

> Laatst bijgewerkt: 2026-02-16

## Doel
Gedeelde core service-laag bovenop `MendixClient` en serializers.  
Deze laag levert consistente `text + meta` resultaten voor zowel API als toekomstige host-integraties.

## Bestanden
| Bestand | Doel | Status |
|---------|------|--------|
| copilot-core.ts | Uniforme lees-operaties (app, module, entity, microflow, page, security, analyse) met serializer-output | Geimplementeerd |

## Design
- Hergebruikt bestaande Mendix SDK facade (`MendixClient`).
- Hergebruikt bestaande serializers voor Claude-vriendelijke output.
- Retourneert altijd:
  - `text`: direct renderbaar in chat/detailviews
  - `meta`: UI-vriendelijke structuur (lijsten/details) zonder SDK-object dumps

## Bekende beperkingen
- Read-only: geen write-mutaties naar Mendix model.
- Sommige analyse-resultaten blijven heuristisch (afhankelijk van onderliggende clientmethodes).
