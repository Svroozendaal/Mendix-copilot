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
      grid-template-columns: 1.2fr 1fr;
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
    pre {
      margin: 0;
      padding: 10px;
      flex: 1;
      overflow: auto;
      white-space: pre;
      font-size: 12px;
      line-height: 1.4;
      background: #ffffff;
      color: #111827;
      font-family: Consolas, "Courier New", monospace;
    }
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

      const diffPanel = element("section", "panel");
      diffPanel.appendChild(element("div", "panel-title", "Diff"));
      const diffText = element("pre");
      diffText.textContent = "Select a file to view diff.";
      diffPanel.appendChild(diffText);

      const rows = [];
      function selectRow(index) {
        rows.forEach((row, rowIndex) => {
          row.classList.toggle("active", rowIndex === index);
        });

        const selectedChange = changes[index];
        if (!selectedChange) {
          diffText.textContent = "Diff unavailable";
          return;
        }

        diffText.textContent =
          selectedChange.DiffText && selectedChange.DiffText.trim().length > 0
            ? selectedChange.DiffText
            : "Diff unavailable";
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
      layout.appendChild(diffPanel);
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
