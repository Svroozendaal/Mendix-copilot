using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AutoCommitMessage;

/// <summary>
/// WinForms panel that shows uncommitted Git changes for Mendix project files.
/// </summary>
public partial class ChangesPanel : UserControl
{
    private const string StatusModified = "Modified";
    private const string StatusAdded = "Added";
    private const string StatusDeleted = "Deleted";
    private const string StatusRenamed = "Renamed";

    private static readonly Color ModifiedColor = Color.FromArgb(35, 108, 192);
    private static readonly Color AddedColor = Color.FromArgb(34, 139, 34);
    private static readonly Color DeletedColor = Color.FromArgb(178, 34, 34);
    private static readonly Color RenamedColor = Color.FromArgb(184, 134, 11);
    private static readonly Color DefaultColor = Color.FromArgb(60, 60, 60);

    private readonly string projectPath;
    private bool isRefreshing;

    /// <summary>
    /// Initializes a new panel instance for designer support.
    /// </summary>
    public ChangesPanel()
        : this(string.Empty)
    {
    }

    /// <summary>
    /// Initializes a new panel instance bound to a project path.
    /// </summary>
    /// <param name="projectPath">The project directory path used for Git lookups.</param>
    public ChangesPanel(string projectPath)
    {
        this.projectPath = projectPath ?? string.Empty;
        InitializeComponent();
    }

    private async void btnRefresh_Click(object? sender, EventArgs e)
    {
        if (isRefreshing)
        {
            return;
        }

        isRefreshing = true;
        btnRefresh.Enabled = false;

        try
        {
            var payload = await Task.Run(() => GitChangesService.ReadChanges(ResolveProjectPath()));

            if (IsHandleCreated && !IsDisposed)
            {
                Invoke((Action)(() => UpdateUI(payload)));
            }
            else
            {
                UpdateUI(payload);
            }
        }
        finally
        {
            if (IsHandleCreated && !IsDisposed)
            {
                Invoke((Action)(() => btnRefresh.Enabled = true));
            }
            else
            {
                btnRefresh.Enabled = true;
            }

            isRefreshing = false;
        }
    }

    private string ResolveProjectPath()
    {
        if (!string.IsNullOrWhiteSpace(projectPath))
        {
            return projectPath;
        }

        return Environment.CurrentDirectory;
    }

    private void UpdateUI(GitChangesPayload payload)
    {
        lblBranch.Text = payload.IsGitRepo && !string.IsNullOrWhiteSpace(payload.BranchName)
            ? $"Branch: {payload.BranchName}"
            : string.Empty;

        lvChanges.BeginUpdate();
        try
        {
            lvChanges.Items.Clear();
            rtbDiff.Clear();

            if (!payload.IsGitRepo)
            {
                lblStatus.Text = "Not a Git repository";
                return;
            }

            if (!string.IsNullOrWhiteSpace(payload.Error))
            {
                lblStatus.Text = $"Error: {payload.Error}";
                return;
            }

            if (payload.Changes.Count == 0)
            {
                lblStatus.Text = "No uncommitted changes";
                return;
            }

            var items = new List<ListViewItem>(payload.Changes.Count);
            foreach (var change in payload.Changes)
            {
                var item = new ListViewItem(Path.GetFileName(change.FilePath));
                item.SubItems.Add(Path.GetDirectoryName(change.FilePath) ?? string.Empty);
                item.SubItems.Add(change.Status);
                item.SubItems.Add(change.IsStaged ? "Yes" : "No");
                item.Tag = change;

                SetListViewItemColor(item, change.Status);
                items.Add(item);
            }

            lvChanges.Items.AddRange(items.ToArray());
            if (lvChanges.Items.Count > 0)
            {
                lvChanges.Items[0].Selected = true;
            }

            lblStatus.Text = $"{payload.Changes.Count} file(s) changed - {payload.BranchName}";
        }
        finally
        {
            lvChanges.EndUpdate();
        }
    }

    private void lvChanges_SelectedIndexChanged(object? sender, EventArgs e)
    {
        if (lvChanges.SelectedItems.Count == 0)
        {
            rtbDiff.Clear();
            return;
        }

        var selectedItem = lvChanges.SelectedItems[0];
        if (selectedItem.Tag is GitFileChange change)
        {
            rtbDiff.Text = string.IsNullOrWhiteSpace(change.DiffText)
                ? "Diff unavailable"
                : change.DiffText;
        }
        else
        {
            rtbDiff.Text = "Diff unavailable";
        }
    }

    private static void SetListViewItemColor(ListViewItem item, string status)
    {
        item.ForeColor = status switch
        {
            StatusModified => ModifiedColor,
            StatusAdded => AddedColor,
            StatusDeleted => DeletedColor,
            StatusRenamed => RenamedColor,
            _ => DefaultColor,
        };
    }
}

