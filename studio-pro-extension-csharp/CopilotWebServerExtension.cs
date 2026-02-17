using System.ComponentModel.Composition;
using System.Net;
using System.Text;
using Mendix.StudioPro.ExtensionsAPI.UI.WebServer;

namespace WellBased.Copilot.StudioPro10;

[Export(typeof(WebServerExtension))]
public sealed class CopilotWebServerExtension : WebServerExtension
{
    public override void InitializeWebServer(IWebServer webServer)
    {
        webServer.AddRoute(CopilotConstants.WebServerRoutePrefix, HandleRequestAsync);
    }

    private static async Task HandleRequestAsync(
        HttpListenerRequest request,
        HttpListenerResponse response,
        CancellationToken cancellationToken)
    {
        var configuredPort = CopilotSettings.NormalizePort(ReadQueryParameter(request.Url, "configuredPort"));
        var html = CopilotPanelHtml.Render(configuredPort);
        var content = Encoding.UTF8.GetBytes(html);

        response.ContentType = "text/html; charset=utf-8";
        response.StatusCode = 200;
        response.ContentLength64 = content.Length;
        await response.OutputStream.WriteAsync(content, cancellationToken);
    }

    private static string? ReadQueryParameter(Uri? requestUrl, string key)
    {
        if (requestUrl is null || string.IsNullOrWhiteSpace(requestUrl.Query))
        {
            return null;
        }

        var rawQuery = requestUrl.Query.TrimStart('?');
        if (string.IsNullOrWhiteSpace(rawQuery))
        {
            return null;
        }

        var pairs = rawQuery.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var pair in pairs)
        {
            var separator = pair.IndexOf('=', StringComparison.Ordinal);
            var rawKey = separator >= 0 ? pair[..separator] : pair;
            if (!string.Equals(Uri.UnescapeDataString(rawKey), key, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var rawValue = separator >= 0 ? pair[(separator + 1)..] : string.Empty;
            return Uri.UnescapeDataString(rawValue);
        }

        return null;
    }
}
