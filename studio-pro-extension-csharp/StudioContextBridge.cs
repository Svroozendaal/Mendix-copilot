using System.ComponentModel.Composition;
using System.Text.Json.Nodes;
using Mendix.StudioPro.ExtensionsAPI.UI.WebView;

namespace WellBased.Copilot.StudioPro10;

[Export(typeof(StudioContextBridge))]
[PartCreationPolicy(CreationPolicy.Shared)]
public sealed class StudioContextBridge
{
    private readonly object syncRoot = new();
    private IWebView? attachedWebView;
    private bool messageListenerReady;
    private StudioContextPayload latestContext = StudioContextPayload.Empty;

    internal void Attach(IWebView webView)
    {
        lock (syncRoot)
        {
            attachedWebView = webView;
            messageListenerReady = false;
        }
    }

    internal void Detach(IWebView webView)
    {
        lock (syncRoot)
        {
            if (!ReferenceEquals(attachedWebView, webView))
            {
                return;
            }

            attachedWebView = null;
            messageListenerReady = false;
        }
    }

    internal void UpdateContext(StudioContextPayload nextContext)
    {
        IWebView? webViewToNotify;
        var contextToSend = nextContext;

        lock (syncRoot)
        {
            latestContext = contextToSend;
            webViewToNotify = messageListenerReady ? attachedWebView : null;
        }

        if (webViewToNotify is null)
        {
            return;
        }

        SendContext(webViewToNotify, contextToSend);
    }

    internal void HandleWebViewMessage(IWebView webView, string message)
    {
        if (!IsAttached(webView))
        {
            return;
        }

        if (string.Equals(message, CopilotConstants.MessageListenerRegistered, StringComparison.Ordinal))
        {
            StudioContextPayload contextSnapshot;
            lock (syncRoot)
            {
                messageListenerReady = true;
                contextSnapshot = latestContext;
            }

            SendEmbeddedHandshake(webView);
            SendContext(webView, contextSnapshot);
            return;
        }

        if (string.Equals(message, CopilotConstants.ContextRequestMessageType, StringComparison.Ordinal))
        {
            StudioContextPayload contextSnapshot;
            lock (syncRoot)
            {
                contextSnapshot = latestContext;
            }
            SendContext(webView, contextSnapshot);
        }
    }

    private bool IsAttached(IWebView webView)
    {
        lock (syncRoot)
        {
            return ReferenceEquals(attachedWebView, webView);
        }
    }

    private static void SendEmbeddedHandshake(IWebView webView)
    {
        var payload = new JsonObject
        {
            ["embedded"] = JsonValue.Create(true),
            ["host"] = CopilotConstants.EmbeddedHost,
        };

        TryPostMessage(webView, CopilotConstants.EmbeddedMessageType, payload);
    }

    private static void SendContext(IWebView webView, StudioContextPayload context)
    {
        TryPostMessage(webView, CopilotConstants.ContextMessageType, context.ToJsonObject());
    }

    private static void TryPostMessage(IWebView webView, string message, JsonObject payload)
    {
        try
        {
            webView.PostMessage(message, payload);
        }
        catch
        {
            // Ignore transient webview messaging failures.
        }
    }
}
