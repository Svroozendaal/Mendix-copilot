import type { MicroflowDetailsInfo, MicroflowInfo } from "../client.js";

function formatParameters(microflow: MicroflowInfo): string {
  if (microflow.parameters.length === 0) {
    return "(geen)";
  }

  return microflow.parameters
    .map((parameter) => `${parameter.name} (${parameter.type})`)
    .join(", ");
}

export function serializeMicroflowList(microflows: MicroflowInfo[]): string {
  if (microflows.length === 0) {
    return "Geen microflows gevonden.";
  }

  const sorted = [...microflows].sort((left, right) => left.name.localeCompare(right.name));

  const lines: string[] = [`Microflows (${sorted.length}):`];
  for (const microflow of sorted) {
    const subflowTag = microflow.isSubMicroflow ? " [sub-microflow]" : "";
    lines.push(
      `- ${microflow.name}${subflowTag} | Parameters: ${formatParameters(microflow)} | Return: ${microflow.returnType}`
    );
  }

  return lines.join("\n");
}

export function serializeMicroflowDetails(microflow: MicroflowDetailsInfo): string {
  const lines: string[] = [
    `## Microflow: ${microflow.name}`,
    "",
    `Qualified name: ${microflow.qualifiedName}`,
    `Parameters: ${formatParameters(microflow)}`,
    `Return type: ${microflow.returnType}`,
    "",
    "### Stappen:",
  ];

  if (microflow.steps.length === 0) {
    lines.push("Geen activiteiten gevonden.");
  } else {
    microflow.steps.forEach((step, index) => {
      lines.push(`${index + 1}. [${step.type}] ${step.description}`);
      for (const transition of step.transitions) {
        lines.push(`   -> ${transition}`);
      }
    });
  }

  lines.push("");
  if (microflow.unknownActivityTypes.length > 0) {
    lines.push(
      `Onbekende activity types: ${microflow.unknownActivityTypes.join(", ")}`
    );
  }

  lines.push(
    microflow.hasErrorHandling
      ? "Error handling: Aanwezig."
      : "Error handling: Geen (aanbeveling: voeg error handler toe)."
  );

  return lines.join("\n");
}
