using Mendix.StudioPro.ExtensionsAPI.UI.DockablePane;
using Mendix.StudioPro.ExtensionsAPI.UI.WebView;

namespace AutoCommitMessage;

internal sealed class GitChangesDockablePaneViewModel : WebViewDockablePaneViewModel
{
    private readonly Uri panelAddress;

    public GitChangesDockablePaneViewModel(Uri panelAddress)
    {
        this.panelAddress = panelAddress;
    }

    public override void InitWebView(IWebView webView)
    {
        Title = ExtensionConstants.PaneTitle;
        webView.Address = panelAddress;
    }
}
