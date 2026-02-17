using System.Text.Json;

namespace AutoCommitMessage;

internal static class GitChangesPanelHtml
{
    public static string Render(GitChangesPayload payload, string projectPath)
    {
        var payloadJson = JsonSerializer.Serialize(payload);
        var projectPathJson = JsonSerializer.Serialize(projectPath ?? string.Empty);

        return $$"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AutoCommitMessage - Git Changes</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Segoe UI", Tahoma, sans-serif;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #f5f7fb;
      color: #1e293b;
    }
    #root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid #d7ddea;
      background: #ffffff;
    }
    .title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      border-radius: 999px;
      border: 1px solid #b9c6dc;
      background: #eef3fb;
      color: #1e3a8a;
      padding: 3px 10px;
      font-weight: 600;
      font-size: 11px;
      max-width: 480px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn {
      border: 1px solid #2563eb;
      background: #2563eb;
      color: #ffffff;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .subtitle {
      padding: 8px 14px;
      border-bottom: 1px solid #e4e8f2;
      font-size: 12px;
      color: #475569;
      background: #fbfcff;
    }
    .content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 12px;
    }
    .card {
      border: 1px solid #d8e0ef;
      border-radius: 10px;
      background: #ffffff;
      padding: 14px;
      line-height: 1.45;
      font-size: 13px;
    }
    .layout {
      display: grid;
      grid-template-columns: 0.8fr 1.2fr;
      gap: 12px;
      height: 100%;
      min-height: 0;
    }
    .panel {
      border: 1px solid #d8e0ef;
      border-radius: 10px;
      background: #ffffff;
      overflow: hidden;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .panel-title {
      padding: 8px 10px;
      border-bottom: 1px solid #e5eaf5;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      background: #f8faff;
    }
    .table-wrap {
      overflow: auto;
      min-height: 0;
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead th {
      position: sticky;
      top: 0;
      background: #f8faff;
      z-index: 1;
      border-bottom: 1px solid #e5eaf5;
      color: #334155;
      text-align: left;
      padding: 8px 9px;
      font-weight: 700;
    }
    tbody td {
      border-bottom: 1px solid #eef2f8;
      padding: 7px 9px;
      font-size: 12px;
    }
    tbody tr {
      cursor: pointer;
    }
    tbody tr:hover {
      background: #f8fbff;
    }
    tbody tr.active {
      background: #e8f0ff;
    }
    .status {
      font-weight: 700;
    }
    .status-modified { color: #236cc0; }
    .status-added { color: #228b22; }
    .status-deleted { color: #b22222; }
    .status-renamed { color: #b8860b; }
    .right-content {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
    }
    pre {
      margin: 0;
      padding: 10px;
      overflow: auto;
      white-space: pre;
      font-size: 12px;
      line-height: 1.4;
      background: #ffffff;
      color: #111827;
      font-family: Consolas, "Courier New", monospace;
      min-height: 80px;
      max-height: 22%;
      border-bottom: 1px solid #e5eaf5;
    }
    .model-changes {
      padding: 8px 10px 10px 10px;
      overflow: auto;
      flex: 1;
      min-height: 0;
      display: none;
    }
    .model-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #0f172a;
    }
    .model-group {
      margin-bottom: 8px;
      border: 1px solid #e2e8f5;
      border-radius: 6px;
      background: #fbfdff;
    }
    .model-group > summary {
      cursor: pointer;
      padding: 6px 8px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .model-list {
      margin: 0 0 8px 0;
      padding: 0 22px;
      font-size: 12px;
      line-height: 1.5;
    }
    .model-change-added { color: #228b22; }
    .model-change-modified { color: #236cc0; }
    .model-change-deleted { color: #b22222; }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const payload = {{payloadJson}};
    const projectPath = {{projectPathJson}};

    function element(tag, className, textContent) {
      const node = document.createElement(tag);
      if (className) {
        node.className = className;
      }
      if (textContent !== undefined) {
        node.textContent = textContent;
      }
      return node;
    }

    function statusClass(status) {
      switch (status) {
        case "Modified":
          return "status-modified";
        case "Added":
          return "status-added";
        case "Deleted":
          return "status-deleted";
        case "Renamed":
          return "status-renamed";
        default:
          return "";
      }
    }

    function modelChangeClass(changeType) {
      switch (changeType) {
        case "Added":
          return "model-change-added";
        case "Modified":
          return "model-change-modified";
        case "Deleted":
          return "model-change-deleted";
        default:
          return "";
      }
    }

    function renderCard(content, className) {
      const card = element("div", className ? `card ${className}` : "card");
      card.textContent = content;
      return card;
    }

    function renderChanges(changes) {
      const layout = element("div", "layout");

      const listPanel = element("section", "panel");
      listPanel.appendChild(element("div", "panel-title", "Changed Files"));
      const tableWrap = element("div", "table-wrap");

      const table = element("table");
      const thead = element("thead");
      const headerRow = element("tr");
      ["Name", "Path", "Status", "Staged"].forEach((label) => {
        headerRow.appendChild(element("th", null, label));
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = element("tbody");
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      listPanel.appendChild(tableWrap);

      const detailsPanel = element("section", "panel");
      detailsPanel.appendChild(element("div", "panel-title", "Diff"));

      const rightContent = element("div", "right-content");
      const diffText = element("pre");
      diffText.textContent = "Select a file to view diff.";
      rightContent.appendChild(diffText);

      const modelChangesContainer = element("div", "model-changes");
      rightContent.appendChild(modelChangesContainer);
      detailsPanel.appendChild(rightContent);

      function renderModelChanges(selectedChange) {
        const modelChanges = selectedChange && Array.isArray(selectedChange.ModelChanges)
          ? selectedChange.ModelChanges
          : [];
        const isMpr = selectedChange &&
          typeof selectedChange.FilePath === "string" &&
          selectedChange.FilePath.toLowerCase().endsWith(".mpr");

        modelChangesContainer.replaceChildren();
        if (!isMpr && modelChanges.length === 0) {
          modelChangesContainer.style.display = "none";
          return;
        }

        modelChangesContainer.style.display = "block";
        modelChangesContainer.appendChild(element("div", "model-title", "Model changes (.mpr)"));

        if (modelChanges.length === 0) {
          const emptyGroup = element("div", "model-group");
          const emptyMessage = element("div", null, "No model-level changes detected.");
          emptyMessage.style.padding = "8px";
          emptyMessage.style.fontSize = "12px";
          emptyMessage.style.color = "#475569";
          emptyGroup.appendChild(emptyMessage);
          modelChangesContainer.appendChild(emptyGroup);
          return;
        }

        const groups = new Map();
        modelChanges.forEach((change) => {
          const key = change.ElementType || "Other";
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key).push(change);
        });

        Array.from(groups.keys())
          .sort((a, b) => a.localeCompare(b))
          .forEach((type) => {
            const groupChanges = groups.get(type) || [];
            const groupDetails = element("details", "model-group");
            groupDetails.open = true;

            const summary = element("summary", null, `${type}: ${groupChanges.length} changed`);
            groupDetails.appendChild(summary);

            const list = element("ul", "model-list");
            groupChanges
              .slice()
              .sort((a, b) => (a.ElementName || "").localeCompare(b.ElementName || ""))
              .forEach((change) => {
                const item = element("li");
                const changeClass = modelChangeClass(change.ChangeType);
                if (changeClass) {
                  item.classList.add(changeClass);
                }

                const name = change.ElementName || "<unnamed>";
                const typeLabel = change.ChangeType || "Changed";
                const details = change.Details && String(change.Details).trim().length > 0
                  ? ` - ${change.Details}`
                  : "";
                item.textContent = `${name} (${typeLabel})${details}`;
                list.appendChild(item);
              });

            groupDetails.appendChild(list);
            modelChangesContainer.appendChild(groupDetails);
          });
      }

      const rows = [];
      function selectRow(index) {
        rows.forEach((row, rowIndex) => {
          row.classList.toggle("active", rowIndex === index);
        });

        const selectedChange = changes[index];
        if (!selectedChange) {
          diffText.textContent = "Diff unavailable";
          renderModelChanges(null);
          return;
        }

        diffText.textContent =
          selectedChange.DiffText && selectedChange.DiffText.trim().length > 0
            ? selectedChange.DiffText
            : "Diff unavailable";

        renderModelChanges(selectedChange);
      }

      changes.forEach((change, index) => {
        const row = element("tr");
        row.appendChild(element("td", null, change.FilePath.split("/").pop() || change.FilePath));

        const lastSlash = change.FilePath.lastIndexOf("/");
        const folder = lastSlash >= 0 ? change.FilePath.slice(0, lastSlash) : "";
        row.appendChild(element("td", null, folder));

        const statusCell = element("td");
        const statusValue = element("span", "status", change.Status || "");
        const colorClass = statusClass(change.Status);
        if (colorClass) {
          statusValue.classList.add(colorClass);
        }
        statusCell.appendChild(statusValue);
        row.appendChild(statusCell);

        row.appendChild(element("td", null, change.IsStaged ? "Yes" : "No"));

        row.addEventListener("click", () => selectRow(index));
        tbody.appendChild(row);
        rows.push(row);
      });

      if (changes.length > 0) {
        selectRow(0);
      }

      layout.appendChild(listPanel);
      layout.appendChild(detailsPanel);
      return layout;
    }

    function render() {
      const root = document.getElementById("root");
      root.replaceChildren();

      const topbar = element("div", "topbar");
      topbar.appendChild(element("div", "title", "Git Changes"));
      const meta = element("div", "meta");
      const pathLabel = projectPath && projectPath.length > 0 ? projectPath : "Project path unavailable";
      meta.appendChild(element("span", "badge", pathLabel));
      const refreshButton = element("button", "btn", "Refresh");
      refreshButton.type = "button";
      refreshButton.addEventListener("click", () => window.location.reload());
      meta.appendChild(refreshButton);
      topbar.appendChild(meta);
      root.appendChild(topbar);

      const branchName = payload && payload.BranchName ? payload.BranchName : "-";
      root.appendChild(element("div", "subtitle", `Branch: ${branchName}`));

      const content = element("div", "content");
      root.appendChild(content);

      if (!payload || payload.IsGitRepo !== true) {
        content.appendChild(renderCard("Not a Git repository"));
        return;
      }

      if (payload.Error && payload.Error.trim().length > 0) {
        content.appendChild(renderCard(`Error: ${payload.Error}`));
        return;
      }

      const changes = Array.isArray(payload.Changes) ? payload.Changes : [];
      if (changes.length === 0) {
        content.appendChild(renderCard("No uncommitted changes"));
        return;
      }

      content.appendChild(renderChanges(changes));
    }

    render();
  </script>
</body>
</html>
""";
    }
}
