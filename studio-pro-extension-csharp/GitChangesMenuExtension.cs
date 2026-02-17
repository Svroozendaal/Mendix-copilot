using System.ComponentModel.Composition;
using Mendix.StudioPro.ExtensionsAPI.UI.Menu;
using Mendix.StudioPro.ExtensionsAPI.UI.Services;

namespace AutoCommitMessage;

[Export(typeof(MenuExtension))]
public sealed class GitChangesMenuExtension : MenuExtension
{
    private readonly IDockingWindowService dockingWindowService;

    [ImportingConstructor]
    public GitChangesMenuExtension(IDockingWindowService dockingWindowService)
    {
        this.dockingWindowService = dockingWindowService;
    }

    public override IEnumerable<MenuViewModel> GetMenus()
    {
        yield return new MenuViewModel(
            "Open Git Changes",
            () => dockingWindowService.OpenPane(ExtensionConstants.PaneId));

        yield return new MenuViewModel(
            "Close Git Changes",
            () => dockingWindowService.ClosePane(ExtensionConstants.PaneId));
    }
}
