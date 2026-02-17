# Roadmap Commands

Deze map bevat uitgebreide command-prompts om de huidige Mendix Copilot gericht om te bouwen naar een production-grade Mendix-GPT.

## Beschikbare prompts

1. `roadmap-master.md`
Doel: end-to-end programmaprompt voor planning en uitvoering over alle fases.

2. `roadmap-p0-security-foundation.md`
Doel: security, sessie-isolatie, rate limiting, logging, basis betrouwbaarheid.

3. `roadmap-p1-knowledge-quality.md`
Doel: betere Mendix-kennisdekking, retrieval, bronkwaliteit en factual accuracy.

4. `roadmap-p2-chat-ux-reliability.md`
Doel: chat UX, streamingkwaliteit, conversation persistence, robuuste foutpaden.

5. `roadmap-p3-write-agent.md`
Doel: veilige transitie van simulated execution naar echte write-path.

## Aanbevolen volgorde

1. Start met `roadmap-master.md` voor planning en scope.
2. Voer daarna P0 uit.
3. Ga pas naar P1/P2 wanneer P0 acceptance criteria groen zijn.
4. Start P3 alleen als expliciet gewenst en nadat P0-P2 stabiel zijn.

## Praktisch gebruik

- Gebruik argumenten om scope te beperken, bijvoorbeeld:
  - `auth-only`
  - `chat-runtime`
  - `phase=p1 module=Sales`
- Laat de agent steeds eindigen met:
  - wat is gedaan,
  - wat niet is gedaan,
  - welke tests zijn gedraaid,
  - welke risico's open blijven.

