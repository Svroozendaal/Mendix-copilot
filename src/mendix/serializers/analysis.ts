import type { BestPracticeFindingInfo, DependencyInfo } from "../client.js";

export function serializeBestPracticeFindings(findings: BestPracticeFindingInfo[]): string {
  if (findings.length === 0) {
    return "Geen bevindingen.";
  }

  const lines: string[] = [`Best-practice bevindingen (${findings.length}):`];
  findings.forEach((finding, index) => {
    lines.push(`${index + 1}. [${finding.severity}] ${finding.location} - ${finding.description}`);
    lines.push(`   Aanbeveling: ${finding.recommendation}`);
  });

  return lines.join("\n");
}

export function serializeDependencies(dependencies: DependencyInfo): string {
  const outgoing =
    dependencies.outgoing.length > 0
      ? dependencies.outgoing.map((value) => `- ${value}`)
      : ["- (geen uitgaande dependencies gevonden)"];
  const incoming =
    dependencies.incoming.length > 0
      ? dependencies.incoming.map((value) => `- ${value}`)
      : ["- (geen inkomende dependencies gevonden)"];
  const notes =
    dependencies.notes.length > 0
      ? dependencies.notes.map((note) => `- ${note}`)
      : ["- (geen aanvullende notities)"];

  return [
    `## Dependencies: ${dependencies.document}`,
    "",
    "Uitgaand:",
    ...outgoing,
    "",
    "Inkomend:",
    ...incoming,
    "",
    "Notities:",
    ...notes,
  ].join("\n");
}
