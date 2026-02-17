using System.ComponentModel.Composition;
using Mendix.StudioPro.ExtensionsAPI.UI.Menu;
using Mendix.StudioPro.ExtensionsAPI.UI.Services;

namespace WellBased.Copilot.StudioPro10;

[Export(typeof(MenuExtension))]
public sealed class CopilotMenuExtension : MenuExtension
{
    private readonly IDockingWindowService dockingWindowService;

    [ImportingConstructor]
    public CopilotMenuExtension(IDockingWindowService dockingWindowService)
    {
        this.dockingWindowService = dockingWindowService;
    }

    public override IEnumerable<MenuViewModel> GetMenus()
    {
        yield return new MenuViewModel(
            "Open Panel",
            () => dockingWindowService.OpenPane(CopilotConstants.PaneId));

        yield return new MenuViewModel(
            "Close Panel",
            () => dockingWindowService.ClosePane(CopilotConstants.PaneId));
    }
}
