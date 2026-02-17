using Mendix.StudioPro.ExtensionsAPI.UI.DockablePane;
using Mendix.StudioPro.ExtensionsAPI.UI.WebView;

namespace WellBased.Copilot.StudioPro10;

internal sealed class CopilotDockablePaneViewModel : WebViewDockablePaneViewModel
{
    private readonly Uri panelAddress;
    private readonly StudioContextBridge contextBridge;
    private IWebView? webView;

    public CopilotDockablePaneViewModel(Uri panelAddress, StudioContextBridge contextBridge)
    {
        this.panelAddress = panelAddress;
        this.contextBridge = contextBridge;
    }

    public override void InitWebView(IWebView webView)
    {
        this.webView = webView;
        Title = CopilotConstants.PaneTitle;
        OnClosed = HandlePaneClosed;

        contextBridge.Attach(webView);
        webView.MessageReceived += HandleMessageReceived;
        webView.Address = panelAddress;
    }

    private void HandleMessageReceived(object? sender, MessageReceivedEventArgs messageEventArgs)
    {
        if (sender is not IWebView senderWebView)
        {
            return;
        }

        contextBridge.HandleWebViewMessage(senderWebView, messageEventArgs.Message);
    }

    private void HandlePaneClosed()
    {
        if (webView is null)
        {
            return;
        }

        webView.MessageReceived -= HandleMessageReceived;
        contextBridge.Detach(webView);
        webView = null;
    }
}
