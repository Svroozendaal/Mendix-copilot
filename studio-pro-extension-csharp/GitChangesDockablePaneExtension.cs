using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Windows.Forms;
using Mendix.StudioPro.ExtensionsAPI.UI.DockablePane;

namespace AutoCommitMessage;

[Export(typeof(DockablePaneExtension))]
public sealed class GitChangesDockablePaneExtension : DockablePaneExtension
{
    public override string Id => ExtensionConstants.PaneId;

    public override DockablePanePosition InitialPosition => DockablePanePosition.Right;

    public override DockablePaneViewModelBase Open()
    {
        var currentProjectPath = CurrentApp?.Root?.DirectoryPath ?? string.Empty;
        var panelAddress = BuildPanelAddress(currentProjectPath);
        return new GitChangesDockablePaneViewModel(panelAddress);
    }

    public IEnumerable<(string PaneId, string Title, Func<UserControl> Factory)> GetDockablePanes()
    {
        var currentProjectPath = CurrentApp?.Root?.DirectoryPath ?? string.Empty;
        yield return (ExtensionConstants.PaneId, ExtensionConstants.PaneTitle, () => new ChangesPanel(currentProjectPath));
    }

    private Uri BuildPanelAddress(string projectPath)
    {
        var routeAddress = new Uri(WebServerBaseUrl, $"{ExtensionConstants.WebServerRoutePrefix}/");
        if (string.IsNullOrWhiteSpace(projectPath))
        {
            return routeAddress;
        }

        return new Uri($"{routeAddress}?{ExtensionConstants.ProjectPathQueryKey}={Uri.EscapeDataString(projectPath)}");
    }
}
