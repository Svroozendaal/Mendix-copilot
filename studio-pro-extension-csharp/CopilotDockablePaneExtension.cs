using System.ComponentModel.Composition;
using Mendix.StudioPro.ExtensionsAPI.UI.DockablePane;
using Mendix.StudioPro.ExtensionsAPI.UI.Events;

namespace WellBased.Copilot.StudioPro10;

[Export(typeof(DockablePaneExtension))]
public sealed class CopilotDockablePaneExtension : DockablePaneExtension
{
    private readonly StudioContextBridge contextBridge;

    [ImportingConstructor]
    public CopilotDockablePaneExtension(StudioContextBridge contextBridge)
    {
        this.contextBridge = contextBridge;

        _ = Subscribe<ExtensionLoaded>(HandleExtensionLoaded);
        _ = Subscribe<ActiveDocumentChanged>(HandleActiveDocumentChanged);
    }

    public override string Id => CopilotConstants.PaneId;

    public override DockablePanePosition InitialPosition => DockablePanePosition.Right;

    public override DockablePaneViewModelBase Open()
    {
        var panelAddress = BuildPanelAddress();
        return new CopilotDockablePaneViewModel(panelAddress, contextBridge);
    }

    private Uri BuildPanelAddress()
    {
        var routeAddress = new Uri(WebServerBaseUrl, $"{CopilotConstants.WebServerRoutePrefix}/");
        var configuredPort = CopilotSettings.ReadConfiguredPort();
        if (string.IsNullOrWhiteSpace(configuredPort))
        {
            return routeAddress;
        }

        return new Uri($"{routeAddress}?configuredPort={Uri.EscapeDataString(configuredPort)}");
    }

    private void HandleActiveDocumentChanged(ActiveDocumentChanged change)
    {
        var context = StudioContextMapper.FromActiveDocument(change, CurrentApp?.Root);
        contextBridge.UpdateContext(context);
    }

    private void HandleExtensionLoaded()
    {
        contextBridge.UpdateContext(StudioContextPayload.Empty);
    }
}
