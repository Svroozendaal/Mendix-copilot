import type { PageInfo, PageStructureInfo, PageWidgetInfo } from "../client.js";

function formatPageLine(page: PageInfo): string {
  const url = page.url ?? "(geen)";
  return `- ${page.name} | Layout: ${page.layoutName} | URL: ${url}`;
}

function formatWidgetLabel(widget: PageWidgetInfo): string {
  const hasLabel = Boolean(widget.label && widget.label.trim());

  if (widget.type.toLowerCase().includes("button") && hasLabel) {
    return `${widget.type} "${widget.label}"`;
  }

  if (widget.type.toLowerCase().includes("column") && widget.attribute) {
    return `Kolom: ${widget.attribute}`;
  }

  if (
    widget.type.toLowerCase().includes("input") &&
    widget.attribute &&
    widget.label &&
    widget.label !== widget.type
  ) {
    return `${widget.type} "${widget.label}"`;
  }

  if (hasLabel && widget.label !== widget.type) {
    return `${widget.type} "${widget.label}"`;
  }

  return widget.type;
}

function formatWidgetDetails(widget: PageWidgetInfo): string {
  const details: string[] = [];
  if (widget.dataSource) {
    details.push(`bron: ${widget.dataSource}`);
  }
  if (widget.entity) {
    details.push(`entity: ${widget.entity}`);
  }
  if (widget.attribute) {
    details.push(`attribuut: ${widget.attribute}`);
  }
  if (widget.action) {
    details.push(`Actie: ${widget.action}`);
  }

  if (details.length === 0) {
    return formatWidgetLabel(widget);
  }

  return `${formatWidgetLabel(widget)} (${details.join(", ")})`;
}

function renderWidgetTree(
  widget: PageWidgetInfo,
  lines: string[],
  prefix: string,
  isLast: boolean
): void {
  const connector = isLast ? "└──" : "├──";
  lines.push(`${prefix}${connector} ${formatWidgetDetails(widget)}`);

  const childPrefix = `${prefix}${isLast ? "    " : "│   "}`;
  widget.children.forEach((child, index) => {
    renderWidgetTree(
      child,
      lines,
      childPrefix,
      index === widget.children.length - 1
    );
  });
}

export function serializePageList(pages: PageInfo[]): string {
  if (pages.length === 0) {
    return "Geen pages gevonden.";
  }

  const sortedPages = [...pages].sort((left, right) => left.name.localeCompare(right.name));
  const lines = [`Pages (${sortedPages.length}):`];
  for (const page of sortedPages) {
    lines.push(formatPageLine(page));
  }

  return lines.join("\n");
}

export function serializePageStructure(page: PageStructureInfo): string {
  const lines: string[] = [
    `## Page: ${page.name}`,
    "",
    `Qualified name: ${page.qualifiedName}`,
    `Layout: ${page.layoutName}`,
    `URL: ${page.url ?? "(niet beschikbaar)"}`,
    "",
    "Structuur:",
  ];

  if (page.widgets.length === 0) {
    lines.push("- (geen widgets gevonden)");
    return lines.join("\n");
  }

  page.widgets.forEach((widget, index) => {
    renderWidgetTree(widget, lines, "", index === page.widgets.length - 1);
  });

  return lines.join("\n");
}
